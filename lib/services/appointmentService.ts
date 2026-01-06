import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    Timestamp,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreateAppointmentData {
    clinicId: string;
    doctorId: string;
    patientId: string;
    date: Date;
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

interface CancelAppointmentData {
    appointmentId: string;
    reason?: string;
}

interface RescheduleAppointmentData {
    appointmentId: string;
    newDate: Date;
    newDuration?: number;
    reason?: string;
}

export const appointmentService = {
    async createAppointment(data: CreateAppointmentData, userId: string) {
        const startDate = Timestamp.fromDate(data.date);
        const endDate = new Date(data.date);
        endDate.setMinutes(endDate.getMinutes() + data.duration);

        // Check for conflicts
        const conflicts = await getDocs(
            query(
                collection(db, 'appointments'),
                where('doctorId', '==', data.doctorId),
                where('date', '>=', startDate),
                where('date', '<', Timestamp.fromDate(endDate)),
                where('status', 'in', ['agendado', 'confirmado'])
            )
        );

        if (!conflicts.empty) {
            throw new Error('Já existe uma consulta agendada neste horário');
        }

        // Create appointment
        const appointmentRef = await addDoc(collection(db, 'appointments'), {
            clinicId: data.clinicId,
            doctorId: data.doctorId,
            patientId: data.patientId,
            bookedBy: userId,
            bookedFor: data.bookedFor || null,
            date: startDate,
            endDate: Timestamp.fromDate(endDate),
            duration: data.duration,
            type: data.type,
            convenioId: data.convenioId || null,
            convenioData: data.convenioData || null,
            status: 'agendado',
            statusHistory: [
                {
                    status: 'agendado',
                    changedAt: serverTimestamp(),
                    changedBy: userId,
                },
            ],
            confirmed: false,
            remindersSent: [],
            notes: data.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            version: 1,
        });

        // Create audit log
        await addDoc(collection(db, 'auditLogs'), {
            clinicId: data.clinicId,
            userId: userId,
            action: 'create_appointment',
            entityType: 'appointment',
            entityId: appointmentRef.id,
            changes: {
                after: { ...data, id: appointmentRef.id },
            },
            timestamp: serverTimestamp(),
        });

        return { success: true, appointmentId: appointmentRef.id };
    },

    async cancelAppointment(data: CancelAppointmentData, userId: string) {
        const appointmentRef = doc(db, 'appointments', data.appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            throw new Error('Consulta não encontrada');
        }

        const appointment = appointmentDoc.data();

        await updateDoc(appointmentRef, {
            status: 'cancelado',
            cancelledAt: serverTimestamp(),
            cancelledBy: userId,
            cancellationReason: data.reason || '',
            statusHistory: [
                ...(appointment.statusHistory || []),
                {
                    status: 'cancelado',
                    changedAt: serverTimestamp(),
                    changedBy: userId,
                    reason: data.reason || '',
                },
            ],
            updatedAt: serverTimestamp(),
            version: (appointment.version || 1) + 1,
        });

        // Create audit log
        await addDoc(collection(db, 'auditLogs'), {
            clinicId: appointment.clinicId,
            userId: userId,
            action: 'cancel_appointment',
            entityType: 'appointment',
            entityId: data.appointmentId,
            changes: {
                before: { status: appointment.status },
                after: { status: 'cancelado', reason: data.reason },
            },
            timestamp: serverTimestamp(),
        });

        return { success: true };
    },

    async rescheduleAppointment(data: RescheduleAppointmentData, userId: string) {
        const appointmentRef = doc(db, 'appointments', data.appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            throw new Error('Consulta não encontrada');
        }

        const appointment = appointmentDoc.data();
        const newStartDate = Timestamp.fromDate(data.newDate);
        const duration = data.newDuration || appointment.duration;
        const newEndDate = new Date(data.newDate);
        newEndDate.setMinutes(newEndDate.getMinutes() + duration);

        // Check for conflicts (excluding current appointment)
        const conflicts = await getDocs(
            query(
                collection(db, 'appointments'),
                where('doctorId', '==', appointment.doctorId),
                where('date', '>=', newStartDate),
                where('date', '<', Timestamp.fromDate(newEndDate)),
                where('status', 'in', ['agendado', 'confirmado'])
            )
        );

        const hasConflict = conflicts.docs.some(doc => doc.id !== data.appointmentId);

        if (hasConflict) {
            throw new Error('Já existe uma consulta agendada neste horário');
        }

        await updateDoc(appointmentRef, {
            date: newStartDate,
            endDate: Timestamp.fromDate(newEndDate),
            duration: duration,
            statusHistory: [
                ...(appointment.statusHistory || []),
                {
                    status: 'reagendado',
                    changedAt: serverTimestamp(),
                    changedBy: userId,
                    reason: data.reason || 'Reagendamento',
                },
            ],
            updatedAt: serverTimestamp(),
            version: (appointment.version || 1) + 1,
        });

        // Create audit log
        await addDoc(collection(db, 'auditLogs'), {
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
                    date: newStartDate,
                    endDate: Timestamp.fromDate(newEndDate),
                },
            },
            timestamp: serverTimestamp(),
        });

        return { success: true };
    },

    async confirmAppointment(appointmentId: string, userId: string) {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            throw new Error('Consulta não encontrada');
        }

        const appointment = appointmentDoc.data();

        await updateDoc(appointmentRef, {
            status: 'confirmado',
            confirmed: true,
            confirmedAt: serverTimestamp(),
            confirmationMethod: 'system',
            statusHistory: [
                ...(appointment.statusHistory || []),
                {
                    status: 'confirmado',
                    changedAt: serverTimestamp(),
                    changedBy: userId,
                },
            ],
            updatedAt: serverTimestamp(),
            version: (appointment.version || 1) + 1,
        });

        return { success: true };
    }
};

export const agendaService = {
    async extendBookingWindow(
        clinicId: string,
        extendedMonths: number,
        expiresInDays: number | undefined,
        reason: string | undefined,
        userId: string
    ) {
        const clinicRef = doc(db, 'clinics', clinicId);
        const expiresAt = expiresInDays
            ? Timestamp.fromDate(new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000))
            : null;

        await updateDoc(clinicRef, {
            'settings.bookingWindow.extendedMonths': extendedMonths,
            'settings.bookingWindow.extendedUntil': expiresAt,
            'settings.bookingWindow.extendedBy': userId,
            'settings.bookingWindow.extendedAt': serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Create agenda rule
        const ruleRef = await addDoc(collection(db, 'agendaRules'), {
            clinicId: clinicId,
            type: 'booking_window_extension',
            extendedMonths: extendedMonths,
            extendedBy: userId,
            extendedAt: serverTimestamp(),
            expiresAt: expiresAt,
            active: true,
            reason: reason || '',
        });

        // Create audit log
        await addDoc(collection(db, 'auditLogs'), {
            clinicId: clinicId,
            userId: userId,
            action: 'extend_booking_window',
            entityType: 'agendaRule',
            entityId: ruleRef.id,
            changes: {
                after: {
                    extendedMonths: extendedMonths,
                    expiresAt: expiresAt,
                    reason: reason,
                },
            },
            timestamp: serverTimestamp(),
        });

        return { success: true };
    }
};

export const reportService = {
    async generateMonthlyReport(clinicId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const appointments = await getDocs(
            query(
                collection(db, 'appointments'),
                where('clinicId', '==', clinicId),
                where('date', '>=', Timestamp.fromDate(startDate)),
                where('date', '<=', Timestamp.fromDate(endDate))
            )
        );

        const metrics = {
            total: appointments.size,
            byStatus: {} as Record<string, number>,
            byType: { particular: 0, convenio: 0 },
            byDoctor: {} as Record<string, number>,
            byConvenio: {} as Record<string, number>,
            noShowRate: 0,
        };

        let noShows = 0;

        appointments.forEach((doc) => {
            const appointment = doc.data();

            metrics.byStatus[appointment.status] =
                (metrics.byStatus[appointment.status] || 0) + 1;

            metrics.byType[appointment.type as 'particular' | 'convenio']++;

            metrics.byDoctor[appointment.doctorId] =
                (metrics.byDoctor[appointment.doctorId] || 0) + 1;

            if (appointment.type === 'convenio' && appointment.convenioId) {
                metrics.byConvenio[appointment.convenioId] =
                    (metrics.byConvenio[appointment.convenioId] || 0) + 1;
            }

            if (appointment.status === 'falta') {
                noShows++;
            }
        });

        metrics.noShowRate = metrics.total > 0 ? (noShows / metrics.total) * 100 : 0;

        return { success: true, metrics };
    }
};
