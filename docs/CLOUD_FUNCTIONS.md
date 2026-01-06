# Cloud Functions - Medical Appointment Scheduling System

## Overview
This document defines all Cloud Functions required for business logic, validation, notifications, and data integrity in the medical appointment scheduling system.

---

## Function Categories

1. **Appointment Management**
2. **Booking Window Validation**
3. **Notifications & Reminders**
4. **Audit Logging**
5. **Data Integrity & Validation**
6. **Reports & Analytics**

---

## 1. Appointment Management Functions

### 1.1 `validateAndCreateAppointment`

**Trigger:** HTTPS Callable  
**Purpose:** Validate and create appointments with conflict checking

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface CreateAppointmentRequest {
  clinicId: string;
  doctorId: string;
  patientId: string;
  date: admin.firestore.Timestamp;
  duration: number;
  type: 'particular' | 'convenio';
  convenioId?: string;
  convenioData?: {
    convenioName: string;
    planName?: string;
    cardNumber?: string;
  };
  bookedFor?: string;
  notes?: string;
}

export const validateAndCreateAppointment = functions.https.onCall(
  async (data: CreateAppointmentRequest, context) => {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      // 2. Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Usuário não encontrado'
        );
      }

      const userData = userDoc.data()!;

      // 3. Verify clinic access
      if (userData.clinicId !== data.clinicId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Acesso negado à clínica'
        );
      }

      // 4. Get clinic data for booking window validation
      const clinicDoc = await db.collection('clinics').doc(data.clinicId).get();
      if (!clinicDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Clínica não encontrada'
        );
      }

      const clinicData = clinicDoc.data()!;

      // 5. Validate booking window
      const appointmentDate = data.date.toDate();
      const now = new Date();
      
      if (appointmentDate < now) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Não é possível agendar consultas no passado'
        );
      }

      const bookingWindow = clinicData.settings.bookingWindow;
      let maxMonths = bookingWindow.defaultMonths;

      // Check for extended booking window
      if (bookingWindow.extendedMonths) {
        const extendedUntil = bookingWindow.extendedUntil?.toDate();
        if (!extendedUntil || now < extendedUntil) {
          maxMonths = bookingWindow.extendedMonths;
        }
      }

      const maxDate = new Date(now);
      maxDate.setMonth(maxDate.getMonth() + maxMonths);

      if (appointmentDate > maxDate) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Agendamento permitido apenas até ${maxMonths} meses à frente`
        );
      }

      // 6. Validate doctor exists and is active
      const doctorDoc = await db.collection('doctors').doc(data.doctorId).get();
      if (!doctorDoc.exists || !doctorDoc.data()!.active) {
        throw new functions.https.HttpsError(
          'not-found',
          'Médico não encontrado ou inativo'
        );
      }

      const doctorData = doctorDoc.data()!;

      // 7. Validate convênio if applicable
      if (data.type === 'convenio') {
        if (!data.convenioId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Convênio não especificado'
          );
        }

        const convenioDoc = await db.collection('convenios').doc(data.convenioId).get();
        if (!convenioDoc.exists || !convenioDoc.data()!.active) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Convênio não encontrado ou inativo'
          );
        }

        // Check if doctor accepts this convênio
        if (!doctorData.acceptsConvenio || !doctorData.convenioIds.includes(data.convenioId)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Médico não aceita este convênio'
          );
        }
      } else if (data.type === 'particular') {
        if (!doctorData.acceptsParticular) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Médico não aceita consultas particulares'
          );
        }
      }

      // 8. Check for conflicts using transaction
      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + data.duration);

      const result = await db.runTransaction(async (transaction) => {
        // Query for conflicting appointments
        const conflictQuery = db
          .collection('appointments')
          .where('doctorId', '==', data.doctorId)
          .where('date', '>=', admin.firestore.Timestamp.fromDate(appointmentDate))
          .where('date', '<', admin.firestore.Timestamp.fromDate(endDate))
          .where('status', 'in', ['agendado', 'confirmado']);

        const conflicts = await transaction.get(conflictQuery);

        if (!conflicts.empty) {
          throw new functions.https.HttpsError(
            'already-exists',
            'Já existe uma consulta agendada neste horário'
          );
        }

        // Create appointment
        const appointmentRef = db.collection('appointments').doc();
        const appointment = {
          id: appointmentRef.id,
          clinicId: data.clinicId,
          doctorId: data.doctorId,
          patientId: data.patientId,
          bookedBy: userId,
          bookedFor: data.bookedFor || null,
          date: data.date,
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          duration: data.duration,
          type: data.type,
          convenioId: data.convenioId || null,
          convenioData: data.convenioData || null,
          status: 'agendado',
          statusHistory: [
            {
              status: 'agendado',
              changedAt: admin.firestore.FieldValue.serverTimestamp(),
              changedBy: userId,
            },
          ],
          confirmed: false,
          remindersSent: [],
          notes: data.notes || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          version: 1,
        };

        transaction.set(appointmentRef, appointment);

        // Create audit log
        const auditRef = db.collection('auditLogs').doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          clinicId: data.clinicId,
          userId: userId,
          action: 'create_appointment',
          entityType: 'appointment',
          entityId: appointmentRef.id,
          changes: {
            after: appointment,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return appointmentRef.id;
      });

      // 9. Trigger confirmation notification (async)
      await db.collection('notifications').add({
        clinicId: data.clinicId,
        appointmentId: result,
        patientId: data.patientId,
        type: 'confirmation',
        method: 'whatsapp',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, appointmentId: result };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

---

### 1.2 `cancelAppointment`

**Trigger:** HTTPS Callable  
**Purpose:** Cancel appointments with validation and notifications

```typescript
interface CancelAppointmentRequest {
  appointmentId: string;
  reason?: string;
}

export const cancelAppointment = functions.https.onCall(
  async (data: CancelAppointmentRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      const appointmentRef = db.collection('appointments').doc(data.appointmentId);
      
      await db.runTransaction(async (transaction) => {
        const appointmentDoc = await transaction.get(appointmentRef);
        
        if (!appointmentDoc.exists) {
          throw new functions.https.HttpsError(
            'not-found',
            'Consulta não encontrada'
          );
        }

        const appointment = appointmentDoc.data()!;

        // Verify user has permission
        const userDoc = await transaction.get(db.collection('users').doc(userId));
        const userData = userDoc.data()!;

        const hasPermission =
          userData.role === 'admin' ||
          userData.role === 'secretary' ||
          (userData.role === 'patient' && appointment.patientId === userData.patientId);

        if (!hasPermission) {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Sem permissão para cancelar esta consulta'
          );
        }

        // Update appointment
        transaction.update(appointmentRef, {
          status: 'cancelado',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelledBy: userId,
          cancellationReason: data.reason || '',
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: 'cancelado',
            changedAt: admin.firestore.FieldValue.serverTimestamp(),
            changedBy: userId,
            reason: data.reason || '',
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          version: admin.firestore.FieldValue.increment(1),
        });

        // Create audit log
        const auditRef = db.collection('auditLogs').doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          clinicId: appointment.clinicId,
          userId: userId,
          action: 'cancel_appointment',
          entityType: 'appointment',
          entityId: data.appointmentId,
          changes: {
            before: { status: appointment.status },
            after: { status: 'cancelado', reason: data.reason },
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Trigger cancellation notification
      const appointmentDoc = await appointmentRef.get();
      const appointment = appointmentDoc.data()!;

      await db.collection('notifications').add({
        clinicId: appointment.clinicId,
        appointmentId: data.appointmentId,
        patientId: appointment.patientId,
        type: 'cancellation',
        method: 'whatsapp',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

---

### 1.3 `rescheduleAppointment`

**Trigger:** HTTPS Callable  
**Purpose:** Reschedule appointments with conflict checking

```typescript
interface RescheduleAppointmentRequest {
  appointmentId: string;
  newDate: admin.firestore.Timestamp;
  newDuration?: number;
  reason?: string;
}

export const rescheduleAppointment = functions.https.onCall(
  async (data: RescheduleAppointmentRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      const appointmentRef = db.collection('appointments').doc(data.appointmentId);
      
      const result = await db.runTransaction(async (transaction) => {
        const appointmentDoc = await transaction.get(appointmentRef);
        
        if (!appointmentDoc.exists) {
          throw new functions.https.HttpsError(
            'not-found',
            'Consulta não encontrada'
          );
        }

        const appointment = appointmentDoc.data()!;
        const newDate = data.newDate.toDate();
        const duration = data.newDuration || appointment.duration;
        const newEndDate = new Date(newDate);
        newEndDate.setMinutes(newEndDate.getMinutes() + duration);

        // Check for conflicts (excluding current appointment)
        const conflictQuery = db
          .collection('appointments')
          .where('doctorId', '==', appointment.doctorId)
          .where('date', '>=', admin.firestore.Timestamp.fromDate(newDate))
          .where('date', '<', admin.firestore.Timestamp.fromDate(newEndDate))
          .where('status', 'in', ['agendado', 'confirmado']);

        const conflicts = await transaction.get(conflictQuery);
        
        const hasConflict = conflicts.docs.some(doc => doc.id !== data.appointmentId);
        
        if (hasConflict) {
          throw new functions.https.HttpsError(
            'already-exists',
            'Já existe uma consulta agendada neste horário'
          );
        }

        // Update appointment
        transaction.update(appointmentRef, {
          date: data.newDate,
          endDate: admin.firestore.Timestamp.fromDate(newEndDate),
          duration: duration,
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: 'reagendado',
            changedAt: admin.firestore.FieldValue.serverTimestamp(),
            changedBy: userId,
            reason: data.reason || 'Reagendamento',
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          version: admin.firestore.FieldValue.increment(1),
        });

        // Create audit log
        const auditRef = db.collection('auditLogs').doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          clinicId: appointment.clinicId,
          userId: userId,
          action: 'reschedule_appointment',
          entityType: 'appointment',
          entityId: data.appointmentId,
          changes: {
            before: { 
              date: appointment.date,
              endDate: appointment.endDate,
            },
            after: { 
              date: data.newDate,
              endDate: admin.firestore.Timestamp.fromDate(newEndDate),
            },
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return true;
      });

      return { success: result };
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

---

## 2. Booking Window Management

### 2.1 `extendBookingWindow`

**Trigger:** HTTPS Callable  
**Purpose:** Allow secretaries to extend the booking window

```typescript
interface ExtendBookingWindowRequest {
  clinicId: string;
  extendedMonths: number;
  expiresInDays?: number;
  reason?: string;
}

export const extendBookingWindow = functions.https.onCall(
  async (data: ExtendBookingWindowRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      // Verify user has permission
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Usuário não encontrado'
        );
      }

      const userData = userDoc.data()!;
      
      if (userData.clinicId !== data.clinicId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Acesso negado à clínica'
        );
      }

      const hasPermission =
        userData.role === 'admin' ||
        (userData.permissions && userData.permissions.canExtendAgenda === true);

      if (!hasPermission) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Sem permissão para estender a agenda'
        );
      }

      // Validate extended months
      if (data.extendedMonths < 1 || data.extendedMonths > 12) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Extensão deve ser entre 1 e 12 meses'
        );
      }

      const now = new Date();
      const expiresAt = data.expiresInDays
        ? new Date(now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await db.runTransaction(async (transaction) => {
        // Update clinic settings
        const clinicRef = db.collection('clinics').doc(data.clinicId);
        transaction.update(clinicRef, {
          'settings.bookingWindow.extendedMonths': data.extendedMonths,
          'settings.bookingWindow.extendedUntil': expiresAt
            ? admin.firestore.Timestamp.fromDate(expiresAt)
            : null,
          'settings.bookingWindow.extendedBy': userId,
          'settings.bookingWindow.extendedAt': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create agenda rule
        const ruleRef = db.collection('agendaRules').doc();
        transaction.set(ruleRef, {
          id: ruleRef.id,
          clinicId: data.clinicId,
          type: 'booking_window_extension',
          extendedMonths: data.extendedMonths,
          extendedBy: userId,
          extendedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: expiresAt
            ? admin.firestore.Timestamp.fromDate(expiresAt)
            : null,
          active: true,
          reason: data.reason || '',
        });

        // Create audit log
        const auditRef = db.collection('auditLogs').doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          clinicId: data.clinicId,
          userId: userId,
          action: 'extend_booking_window',
          entityType: 'agendaRule',
          entityId: ruleRef.id,
          changes: {
            after: {
              extendedMonths: data.extendedMonths,
              expiresAt: expiresAt,
              reason: data.reason,
            },
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error extending booking window:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

---

## 3. Notification Functions

### 3.1 `sendAppointmentReminders`

**Trigger:** Scheduled (Cloud Scheduler)  
**Purpose:** Send 24h and 2h reminders

```typescript
export const sendAppointmentReminders = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();

    // Calculate time windows
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
      // Query appointments needing 24h reminder
      const appointments24h = await db
        .collection('appointments')
        .where('status', 'in', ['agendado', 'confirmado'])
        .where('date', '>=', admin.firestore.Timestamp.fromDate(in24Hours))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(
          new Date(in24Hours.getTime() + 15 * 60 * 1000)
        ))
        .get();

      // Query appointments needing 2h reminder
      const appointments2h = await db
        .collection('appointments')
        .where('status', 'in', ['agendado', 'confirmado'])
        .where('date', '>=', admin.firestore.Timestamp.fromDate(in2Hours))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(
          new Date(in2Hours.getTime() + 15 * 60 * 1000)
        ))
        .get();

      // Process 24h reminders
      for (const doc of appointments24h.docs) {
        const appointment = doc.data();
        
        // Check if 24h reminder already sent
        const alreadySent = appointment.remindersSent?.some(
          (r: any) => r.type === '24h'
        );

        if (!alreadySent) {
          await db.collection('notifications').add({
            clinicId: appointment.clinicId,
            appointmentId: doc.id,
            patientId: appointment.patientId,
            type: 'reminder_24h',
            method: 'whatsapp',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Process 2h reminders
      for (const doc of appointments2h.docs) {
        const appointment = doc.data();
        
        // Check if 2h reminder already sent
        const alreadySent = appointment.remindersSent?.some(
          (r: any) => r.type === '2h'
        );

        if (!alreadySent) {
          await db.collection('notifications').add({
            clinicId: appointment.clinicId,
            appointmentId: doc.id,
            patientId: appointment.patientId,
            type: 'reminder_2h',
            method: 'whatsapp',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      console.log(
        `Processed ${appointments24h.size} 24h reminders and ${appointments2h.size} 2h reminders`
      );
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  });
```

---

### 3.2 `processNotificationQueue`

**Trigger:** Firestore onCreate  
**Purpose:** Process notification queue and send via WhatsApp/SMS/Email

```typescript
export const processNotificationQueue = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const db = admin.firestore();

    try {
      // Get appointment details
      const appointmentDoc = await db
        .collection('appointments')
        .doc(notification.appointmentId)
        .get();

      if (!appointmentDoc.exists) {
        throw new Error('Appointment not found');
      }

      const appointment = appointmentDoc.data()!;

      // Get patient details
      const patientDoc = await db
        .collection('patients')
        .doc(notification.patientId)
        .get();

      if (!patientDoc.exists) {
        throw new Error('Patient not found');
      }

      const patient = patientDoc.data()!;

      // Check consent
      if (!patient.consent.whatsappNotifications && notification.method === 'whatsapp') {
        await snap.ref.update({
          status: 'failed',
          error: 'Patient has not consented to WhatsApp notifications',
        });
        return;
      }

      // Get doctor details
      const doctorDoc = await db
        .collection('doctors')
        .doc(appointment.doctorId)
        .get();

      const doctor = doctorDoc.data()!;

      // Get clinic details
      const clinicDoc = await db
        .collection('clinics')
        .doc(notification.clinicId)
        .get();

      const clinic = clinicDoc.data()!;

      // Build message
      const message = buildNotificationMessage(
        notification.type,
        patient,
        appointment,
        doctor,
        clinic
      );

      // Send notification (integrate with WhatsApp API, Twilio, etc.)
      const result = await sendWhatsAppMessage(patient.phone, message);

      // Update notification status
      await snap.ref.update({
        message: message,
        recipient: patient.phone,
        status: result.success ? 'sent' : 'failed',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveredAt: result.delivered
          ? admin.firestore.FieldValue.serverTimestamp()
          : null,
        error: result.error || null,
      });

      // Update appointment remindersSent
      if (result.success && notification.type.startsWith('reminder_')) {
        await db
          .collection('appointments')
          .doc(notification.appointmentId)
          .update({
            remindersSent: admin.firestore.FieldValue.arrayUnion({
              type: notification.type.replace('reminder_', ''),
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              method: notification.method,
              success: true,
            }),
          });
      }
    } catch (error: any) {
      console.error('Error processing notification:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message,
      });
    }
  });

function buildNotificationMessage(
  type: string,
  patient: any,
  appointment: any,
  doctor: any,
  clinic: any
): string {
  const date = appointment.date.toDate();
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  switch (type) {
    case 'confirmation':
      return `Olá ${patient.name}! Sua consulta foi agendada para ${dateStr} às ${timeStr} com ${doctor.name} na ${clinic.name}. Para confirmar, responda SIM. Para cancelar, responda NÃO.`;

    case 'reminder_24h':
      return `Olá ${patient.name}! Lembrete: você tem consulta amanhã (${dateStr}) às ${timeStr} com ${doctor.name}. Para confirmar, responda SIM. Para cancelar, responda NÃO.`;

    case 'reminder_2h':
      return `Olá ${patient.name}! Sua consulta com ${doctor.name} é daqui a 2 horas (${timeStr}). Endereço: ${clinic.address.street}, ${clinic.address.number} - ${clinic.address.neighborhood}.`;

    case 'cancellation':
      return `Olá ${patient.name}. Sua consulta de ${dateStr} às ${timeStr} com ${doctor.name} foi cancelada. Entre em contato para reagendar: ${clinic.phone}.`;

    default:
      return `Notificação da ${clinic.name}.`;
  }
}

async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; delivered?: boolean; error?: string }> {
  // TODO: Integrate with WhatsApp Business API or Twilio
  // This is a placeholder implementation
  
  try {
    // Example using Twilio
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // const result = await client.messages.create({
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phone}`,
    //   body: message,
    // });
    
    console.log(`Sending WhatsApp to ${phone}: ${message}`);
    
    return { success: true, delivered: true };
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 4. Data Integrity Functions

### 4.1 `onAppointmentUpdate`

**Trigger:** Firestore onUpdate  
**Purpose:** Maintain data integrity and audit trail

```typescript
export const onAppointmentUpdate = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const db = admin.firestore();

    // Detect significant changes
    const significantChanges: any = {};

    if (before.status !== after.status) {
      significantChanges.status = { before: before.status, after: after.status };
    }

    if (before.date !== after.date) {
      significantChanges.date = { before: before.date, after: after.date };
    }

    if (before.doctorId !== after.doctorId) {
      significantChanges.doctorId = { before: before.doctorId, after: after.doctorId };
    }

    // Create audit log for significant changes
    if (Object.keys(significantChanges).length > 0) {
      await db.collection('auditLogs').add({
        clinicId: after.clinicId,
        userId: after.updatedBy || 'system',
        action: 'update_appointment',
        entityType: 'appointment',
        entityId: context.params.appointmentId,
        changes: significantChanges,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
```

---

## 5. Scheduled Maintenance Functions

### 5.1 `expireBookingWindowExtensions`

**Trigger:** Scheduled (daily)  
**Purpose:** Automatically expire booking window extensions

```typescript
export const expireBookingWindowExtensions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Find expired rules
      const expiredRules = await db
        .collection('agendaRules')
        .where('active', '==', true)
        .where('expiresAt', '<=', now)
        .get();

      const batch = db.batch();

      for (const doc of expiredRules.docs) {
        const rule = doc.data();

        // Deactivate rule
        batch.update(doc.ref, { active: false });

        // Reset clinic booking window
        const clinicRef = db.collection('clinics').doc(rule.clinicId);
        batch.update(clinicRef, {
          'settings.bookingWindow.extendedMonths': null,
          'settings.bookingWindow.extendedUntil': null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create audit log
        const auditRef = db.collection('auditLogs').doc();
        batch.set(auditRef, {
          id: auditRef.id,
          clinicId: rule.clinicId,
          userId: 'system',
          action: 'expire_booking_window',
          entityType: 'agendaRule',
          entityId: doc.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log(`Expired ${expiredRules.size} booking window extensions`);
    } catch (error) {
      console.error('Error expiring booking windows:', error);
    }
  });
```

---

### 5.2 `markNoShows`

**Trigger:** Scheduled (hourly)  
**Purpose:** Automatically mark no-shows

```typescript
export const markNoShows = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Find appointments that should have happened but weren't marked as attended
      const missedAppointments = await db
        .collection('appointments')
        .where('status', 'in', ['agendado', 'confirmado'])
        .where('date', '<=', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .get();

      const batch = db.batch();

      for (const doc of missedAppointments.docs) {
        batch.update(doc.ref, {
          status: 'falta',
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: 'falta',
            changedAt: admin.firestore.FieldValue.serverTimestamp(),
            changedBy: 'system',
            reason: 'Marcado automaticamente como falta',
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create audit log
        const appointment = doc.data();
        const auditRef = db.collection('auditLogs').doc();
        batch.set(auditRef, {
          id: auditRef.id,
          clinicId: appointment.clinicId,
          userId: 'system',
          action: 'mark_no_show',
          entityType: 'appointment',
          entityId: doc.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log(`Marked ${missedAppointments.size} appointments as no-show`);
    } catch (error) {
      console.error('Error marking no-shows:', error);
    }
  });
```

---

## 6. Analytics & Reports Functions

### 6.1 `generateMonthlyReport`

**Trigger:** HTTPS Callable  
**Purpose:** Generate monthly reports for clinics

```typescript
interface GenerateReportRequest {
  clinicId: string;
  month: number;
  year: number;
}

export const generateMonthlyReport = functions.https.onCall(
  async (data: GenerateReportRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const db = admin.firestore();

    try {
      // Verify user has permission
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data()!;

      if (userData.clinicId !== data.clinicId || userData.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Sem permissão para gerar relatórios'
        );
      }

      // Calculate date range
      const startDate = new Date(data.year, data.month - 1, 1);
      const endDate = new Date(data.year, data.month, 0, 23, 59, 59);

      // Query appointments
      const appointments = await db
        .collection('appointments')
        .where('clinicId', '==', data.clinicId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .get();

      // Calculate metrics
      const metrics = {
        total: appointments.size,
        byStatus: {} as Record<string, number>,
        byType: { particular: 0, convenio: 0 },
        byDoctor: {} as Record<string, number>,
        byConvenio: {} as Record<string, number>,
        noShowRate: 0,
      };

      let noShows = 0;

      for (const doc of appointments.docs) {
        const appointment = doc.data();

        // By status
        metrics.byStatus[appointment.status] =
          (metrics.byStatus[appointment.status] || 0) + 1;

        // By type
        metrics.byType[appointment.type]++;

        // By doctor
        metrics.byDoctor[appointment.doctorId] =
          (metrics.byDoctor[appointment.doctorId] || 0) + 1;

        // By convênio
        if (appointment.type === 'convenio' && appointment.convenioId) {
          metrics.byConvenio[appointment.convenioId] =
            (metrics.byConvenio[appointment.convenioId] || 0) + 1;
        }

        // No-shows
        if (appointment.status === 'falta') {
          noShows++;
        }
      }

      metrics.noShowRate = metrics.total > 0 ? (noShows / metrics.total) * 100 : 0;

      return { success: true, metrics };
    } catch (error: any) {
      console.error('Error generating report:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

---

## Deployment

### Install Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions
npm install --save-dev typescript @types/node
```

### Deploy All Functions

```bash
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:validateAndCreateAppointment
```

---

## Environment Variables

Set required environment variables:

```bash
firebase functions:config:set \
  whatsapp.api_key="YOUR_API_KEY" \
  whatsapp.phone_number="+5511999999999" \
  twilio.account_sid="YOUR_ACCOUNT_SID" \
  twilio.auth_token="YOUR_AUTH_TOKEN"
```

---

## Testing

### Local Emulator

```bash
firebase emulators:start --only functions,firestore
```

### Unit Tests

```typescript
// functions/test/appointments.test.ts
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('validateAndCreateAppointment', () => {
  it('should create appointment successfully', async () => {
    // Test implementation
  });

  it('should reject conflicting appointments', async () => {
    // Test implementation
  });
});
```

---

## Monitoring & Logging

### Cloud Logging

All functions automatically log to Cloud Logging. View logs:

```bash
firebase functions:log
```

### Error Reporting

Errors are automatically reported to Cloud Error Reporting.

### Performance Monitoring

Monitor function execution time and success rates in Firebase Console.

---

## Cost Optimization

1. **Use batched writes** instead of individual writes
2. **Implement caching** for frequently accessed data
3. **Use Cloud Scheduler** efficiently (avoid excessive runs)
4. **Set function timeouts** appropriately
5. **Use regional deployment** to reduce latency

---

## Security Best Practices

1. **Always validate input** in callable functions
2. **Check authentication** before processing
3. **Verify permissions** using Firestore Security Rules
4. **Sanitize user input** to prevent injection attacks
5. **Use transactions** for critical operations
6. **Log all sensitive operations** for audit trail
7. **Encrypt sensitive data** (CPF, card numbers)
8. **Rate limit** functions to prevent abuse
