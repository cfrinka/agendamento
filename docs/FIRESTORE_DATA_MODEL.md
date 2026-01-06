# Firestore Data Model - Medical Appointment Scheduling System

## Overview
This document defines the complete Firestore data structure for a real-time medical appointment scheduling SaaS for Brazilian private clinics.

---

## Collection Structure

```
/clinics/{clinicId}
/users/{userId}
/appointments/{appointmentId}
/patients/{patientId}
/doctors/{doctorId}
/convenios/{convenioId}
/agendaRules/{ruleId}
/auditLogs/{logId}
/notifications/{notificationId}
```

---

## 1. Clinics Collection

**Path:** `/clinics/{clinicId}`

### Document Structure

```typescript
{
  id: string;                          // Auto-generated
  name: string;                        // "Clínica São Paulo"
  cnpj: string;                        // "12.345.678/0001-90"
  phone: string;                       // "+5511999999999"
  email: string;                       // "contato@clinica.com.br"
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;                     // "SP"
    zipCode: string;                   // "01234-567"
  };
  settings: {
    defaultAppointmentDuration: number; // Minutes (e.g., 30)
    defaultBufferTime: number;          // Minutes (e.g., 5)
    workingHours: {
      [day: string]: {                 // "monday", "tuesday", etc.
        enabled: boolean;
        start: string;                 // "08:00"
        end: string;                   // "18:00"
        breaks?: Array<{
          start: string;               // "12:00"
          end: string;                 // "13:00"
        }>;
      };
    };
    bookingWindow: {
      defaultMonths: number;           // 1 (current + next month)
      extendedMonths?: number;         // Set by secretary override
      extendedUntil?: Timestamp;       // Expiration date
      extendedBy?: string;             // userId who extended
      extendedAt?: Timestamp;
    };
    whatsappEnabled: boolean;
    whatsappNumber?: string;           // Business WhatsApp
    reminderSettings: {
      enabled: boolean;
      times: number[];                 // [24, 2] hours before
    };
  };
  subscription: {
    plan: string;                      // "basic", "pro", "enterprise"
    status: string;                    // "active", "trial", "suspended"
    startDate: Timestamp;
    expiryDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}
```

### Example Document

```json
{
  "id": "clinic_abc123",
  "name": "Clínica Saúde Total",
  "cnpj": "12.345.678/0001-90",
  "phone": "+5511987654321",
  "email": "contato@saudetotal.com.br",
  "address": {
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "Sala 501",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "settings": {
    "defaultAppointmentDuration": 30,
    "defaultBufferTime": 5,
    "workingHours": {
      "monday": {
        "enabled": true,
        "start": "08:00",
        "end": "18:00",
        "breaks": [
          { "start": "12:00", "end": "13:00" }
        ]
      },
      "saturday": {
        "enabled": true,
        "start": "08:00",
        "end": "12:00"
      },
      "sunday": {
        "enabled": false
      }
    },
    "bookingWindow": {
      "defaultMonths": 1,
      "extendedMonths": null,
      "extendedUntil": null
    },
    "whatsappEnabled": true,
    "whatsappNumber": "+5511987654321",
    "reminderSettings": {
      "enabled": true,
      "times": [24, 2]
    }
  },
  "subscription": {
    "plan": "pro",
    "status": "active",
    "startDate": "2025-01-01T00:00:00Z",
    "expiryDate": "2026-01-01T00:00:00Z"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z",
  "active": true
}
```

---

## 2. Users Collection

**Path:** `/users/{userId}`

### Document Structure

```typescript
{
  id: string;                          // Firebase Auth UID
  email: string;
  name: string;
  phone: string;
  role: "admin" | "doctor" | "secretary" | "patient";
  clinicId: string;                    // Reference to clinic
  doctorId?: string;                   // If role is "doctor"
  patientId?: string;                  // If role is "patient"
  permissions?: {
    canManageUsers?: boolean;
    canManageDoctors?: boolean;
    canManageConvenios?: boolean;
    canExtendAgenda?: boolean;
    canViewReports?: boolean;
    canManageAppointments?: boolean;
  };
  avatar?: string;                     // URL
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

### Example Documents

**Admin:**
```json
{
  "id": "user_admin_001",
  "email": "admin@saudetotal.com.br",
  "name": "Maria Silva",
  "phone": "+5511987654321",
  "role": "admin",
  "clinicId": "clinic_abc123",
  "permissions": {
    "canManageUsers": true,
    "canManageDoctors": true,
    "canManageConvenios": true,
    "canExtendAgenda": true,
    "canViewReports": true,
    "canManageAppointments": true
  },
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z",
  "lastLoginAt": "2025-01-05T08:30:00Z"
}
```

**Secretary:**
```json
{
  "id": "user_sec_001",
  "email": "recepcao@saudetotal.com.br",
  "name": "Ana Costa",
  "phone": "+5511987654322",
  "role": "secretary",
  "clinicId": "clinic_abc123",
  "permissions": {
    "canExtendAgenda": true,
    "canManageAppointments": true
  },
  "active": true,
  "createdAt": "2025-01-02T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z"
}
```

**Doctor:**
```json
{
  "id": "user_doc_001",
  "email": "dr.joao@saudetotal.com.br",
  "name": "Dr. João Santos",
  "phone": "+5511987654323",
  "role": "doctor",
  "clinicId": "clinic_abc123",
  "doctorId": "doctor_001",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z"
}
```

**Patient:**
```json
{
  "id": "user_patient_001",
  "email": "paciente@email.com",
  "name": "Carlos Oliveira",
  "phone": "+5511987654324",
  "role": "patient",
  "clinicId": "clinic_abc123",
  "patientId": "patient_001",
  "active": true,
  "createdAt": "2025-01-03T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z"
}
```

---

## 3. Doctors Collection

**Path:** `/doctors/{doctorId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  userId: string;                      // Link to users collection
  name: string;
  crm: string;                         // "CRM/SP 123456"
  specialties: string[];               // ["Cardiologia", "Clínica Geral"]
  phone: string;
  email: string;
  avatar?: string;
  availability: {
    [day: string]: {                   // "monday", "tuesday", etc.
      enabled: boolean;
      slots: Array<{
        start: string;                 // "08:00"
        end: string;                   // "12:00"
      }>;
    };
  };
  appointmentDuration: number;         // Minutes (default or custom)
  bufferTime: number;                  // Minutes between appointments
  acceptsParticular: boolean;
  acceptsConvenio: boolean;
  convenioIds: string[];               // Accepted convênios
  color: string;                       // For calendar UI "#3B82F6"
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Example Document

```json
{
  "id": "doctor_001",
  "clinicId": "clinic_abc123",
  "userId": "user_doc_001",
  "name": "Dr. João Santos",
  "crm": "CRM/SP 123456",
  "specialties": ["Cardiologia", "Clínica Geral"],
  "phone": "+5511987654323",
  "email": "dr.joao@saudetotal.com.br",
  "avatar": "https://storage.googleapis.com/...",
  "availability": {
    "monday": {
      "enabled": true,
      "slots": [
        { "start": "08:00", "end": "12:00" },
        { "start": "14:00", "end": "18:00" }
      ]
    },
    "tuesday": {
      "enabled": true,
      "slots": [
        { "start": "08:00", "end": "12:00" }
      ]
    },
    "wednesday": {
      "enabled": true,
      "slots": [
        { "start": "14:00", "end": "18:00" }
      ]
    },
    "sunday": {
      "enabled": false,
      "slots": []
    }
  },
  "appointmentDuration": 30,
  "bufferTime": 5,
  "acceptsParticular": true,
  "acceptsConvenio": true,
  "convenioIds": ["convenio_001", "convenio_002"],
  "color": "#3B82F6",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z"
}
```

---

## 4. Patients Collection

**Path:** `/patients/{patientId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  userId?: string;                     // Link to users collection (if registered)
  name: string;
  phone: string;                       // WhatsApp primary
  email?: string;
  cpf?: string;                        // Optional, encrypted
  birthDate?: Timestamp;
  consent: {
    dataStorage: boolean;
    whatsappNotifications: boolean;
    consentDate: Timestamp;
  };
  convenios?: Array<{
    convenioId: string;
    planName?: string;
    cardNumber?: string;               // Encrypted
    validityDate?: Timestamp;
  }>;
  notes?: string;                      // Operational notes only
  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}
```

### Example Document

```json
{
  "id": "patient_001",
  "clinicId": "clinic_abc123",
  "userId": "user_patient_001",
  "name": "Carlos Oliveira",
  "phone": "+5511987654324",
  "email": "carlos@email.com",
  "cpf": "123.456.789-00",
  "birthDate": "1985-05-15T00:00:00Z",
  "consent": {
    "dataStorage": true,
    "whatsappNotifications": true,
    "consentDate": "2025-01-03T10:00:00Z"
  },
  "convenios": [
    {
      "convenioId": "convenio_001",
      "planName": "Unimed Premium",
      "cardNumber": "1234567890123456",
      "validityDate": "2026-12-31T00:00:00Z"
    }
  ],
  "notes": "Prefere consultas pela manhã",
  "createdAt": "2025-01-03T10:00:00Z",
  "updatedAt": "2025-01-05T11:55:00Z",
  "active": true
}
```

---

## 5. Convênios Collection

**Path:** `/convenios/{convenioId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  name: string;                        // "Unimed"
  code?: string;                       // Internal code
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deactivatedAt?: Timestamp;
  deactivatedBy?: string;              // userId
}
```

### Example Documents

```json
{
  "id": "convenio_001",
  "clinicId": "clinic_abc123",
  "name": "Unimed",
  "code": "UNI001",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

```json
{
  "id": "convenio_002",
  "clinicId": "clinic_abc123",
  "name": "Bradesco Saúde",
  "code": "BRA002",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

## 6. Appointments Collection

**Path:** `/appointments/{appointmentId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  bookedBy: string;                    // userId who created
  bookedFor?: string;                  // patientId if booking for family member
  
  // Scheduling
  date: Timestamp;                     // Start date/time
  endDate: Timestamp;                  // End date/time
  duration: number;                    // Minutes
  
  // Type
  type: "particular" | "convenio";
  convenioId?: string;                 // If type is "convenio"
  convenioData?: {
    convenioName: string;
    planName?: string;
    cardNumber?: string;               // Last 4 digits only
  };
  
  // Status
  status: "agendado" | "confirmado" | "atendido" | "falta" | "cancelado";
  statusHistory: Array<{
    status: string;
    changedAt: Timestamp;
    changedBy: string;                 // userId
    reason?: string;
  }>;
  
  // Confirmation
  confirmed: boolean;
  confirmedAt?: Timestamp;
  confirmationMethod?: "whatsapp" | "phone" | "email" | "system";
  
  // Cancellation
  cancelledAt?: Timestamp;
  cancelledBy?: string;                // userId
  cancellationReason?: string;
  
  // Notifications
  remindersSent: Array<{
    type: "24h" | "2h";
    sentAt: Timestamp;
    method: "whatsapp" | "sms" | "email";
    success: boolean;
  }>;
  
  // Notes
  notes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;                     // For optimistic locking
}
```

### Example Document

```json
{
  "id": "appointment_001",
  "clinicId": "clinic_abc123",
  "doctorId": "doctor_001",
  "patientId": "patient_001",
  "bookedBy": "user_sec_001",
  "date": "2025-01-15T09:00:00Z",
  "endDate": "2025-01-15T09:30:00Z",
  "duration": 30,
  "type": "convenio",
  "convenioId": "convenio_001",
  "convenioData": {
    "convenioName": "Unimed",
    "planName": "Unimed Premium",
    "cardNumber": "****3456"
  },
  "status": "confirmado",
  "statusHistory": [
    {
      "status": "agendado",
      "changedAt": "2025-01-05T10:00:00Z",
      "changedBy": "user_sec_001"
    },
    {
      "status": "confirmado",
      "changedAt": "2025-01-14T10:00:00Z",
      "changedBy": "system",
      "reason": "Confirmado via WhatsApp"
    }
  ],
  "confirmed": true,
  "confirmedAt": "2025-01-14T10:00:00Z",
  "confirmationMethod": "whatsapp",
  "remindersSent": [
    {
      "type": "24h",
      "sentAt": "2025-01-14T09:00:00Z",
      "method": "whatsapp",
      "success": true
    }
  ],
  "notes": "Primeira consulta",
  "createdAt": "2025-01-05T10:00:00Z",
  "updatedAt": "2025-01-14T10:00:00Z",
  "version": 2
}
```

---

## 7. Agenda Rules Collection

**Path:** `/agendaRules/{ruleId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  type: "booking_window_extension";
  extendedMonths: number;              // Total months allowed
  extendedBy: string;                  // userId (secretary/admin)
  extendedAt: Timestamp;
  expiresAt?: Timestamp;               // Optional expiration
  active: boolean;
  reason?: string;
}
```

### Example Document

```json
{
  "id": "rule_001",
  "clinicId": "clinic_abc123",
  "type": "booking_window_extension",
  "extendedMonths": 3,
  "extendedBy": "user_sec_001",
  "extendedAt": "2025-01-05T11:00:00Z",
  "expiresAt": "2025-02-05T11:00:00Z",
  "active": true,
  "reason": "Alta demanda para especialista"
}
```

---

## 8. Audit Logs Collection

**Path:** `/auditLogs/{logId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  userId: string;
  action: string;                      // "create_appointment", "cancel_appointment", etc.
  entityType: string;                  // "appointment", "convenio", "agendaRule"
  entityId: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
  timestamp: Timestamp;
}
```

### Example Document

```json
{
  "id": "log_001",
  "clinicId": "clinic_abc123",
  "userId": "user_sec_001",
  "action": "extend_agenda",
  "entityType": "agendaRule",
  "entityId": "rule_001",
  "changes": {
    "before": {
      "extendedMonths": null
    },
    "after": {
      "extendedMonths": 3,
      "expiresAt": "2025-02-05T11:00:00Z"
    }
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "timestamp": "2025-01-05T11:00:00Z"
}
```

---

## 9. Notifications Collection

**Path:** `/notifications/{notificationId}`

### Document Structure

```typescript
{
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  type: "confirmation" | "reminder_24h" | "reminder_2h" | "cancellation";
  method: "whatsapp" | "sms" | "email";
  recipient: string;                   // Phone or email
  message: string;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
}
```

### Example Document

```json
{
  "id": "notification_001",
  "clinicId": "clinic_abc123",
  "appointmentId": "appointment_001",
  "patientId": "patient_001",
  "type": "reminder_24h",
  "method": "whatsapp",
  "recipient": "+5511987654324",
  "message": "Olá Carlos! Lembrete: você tem consulta amanhã às 09:00 com Dr. João Santos. Confirme respondendo SIM ou cancele respondendo NÃO.",
  "status": "delivered",
  "sentAt": "2025-01-14T09:00:00Z",
  "deliveredAt": "2025-01-14T09:00:15Z",
  "createdAt": "2025-01-14T09:00:00Z"
}
```

---

## Indexes Required

### Composite Indexes

```javascript
// Appointments by clinic and date
appointments: [
  { clinicId: "asc", date: "asc" },
  { clinicId: "asc", date: "desc" }
]

// Appointments by doctor and date
appointments: [
  { doctorId: "asc", date: "asc" },
  { doctorId: "asc", date: "desc" }
]

// Appointments by patient and date
appointments: [
  { patientId: "asc", date: "asc" },
  { patientId: "asc", date: "desc" }
]

// Appointments by clinic, status and date
appointments: [
  { clinicId: "asc", status: "asc", date: "asc" }
]

// Audit logs by clinic and timestamp
auditLogs: [
  { clinicId: "asc", timestamp: "desc" }
]

// Notifications by appointment and status
notifications: [
  { appointmentId: "asc", status: "asc", createdAt: "desc" }
]
```

---

## Data Access Patterns

### Real-time Listeners

1. **Calendar View (All Users)**
   - Listen to appointments for specific date range
   - Filter by clinicId and doctorId (if applicable)
   - Order by date ascending

2. **Patient Appointments (Patient)**
   - Listen to appointments where patientId matches
   - Filter by status (exclude cancelled)
   - Order by date ascending

3. **Active Convênios (Secretary/Patient)**
   - Listen to convenios where active = true
   - Filter by clinicId

4. **Agenda Rules (Secretary/Admin)**
   - Listen to agendaRules where active = true
   - Filter by clinicId

### Transactions

1. **Create Appointment**
   - Check for conflicts (same doctor, overlapping time)
   - Validate booking window
   - Validate convênio acceptance
   - Create appointment document
   - Create audit log

2. **Cancel Appointment**
   - Update appointment status
   - Update statusHistory
   - Create audit log
   - Trigger cancellation notification

3. **Extend Agenda**
   - Create agendaRule document
   - Update clinic settings
   - Create audit log

---

## Data Retention & LGPD Compliance

### Retention Policies

- **Active Appointments:** Indefinite
- **Completed Appointments:** 5 years (legal requirement)
- **Cancelled Appointments:** 2 years
- **Audit Logs:** 5 years
- **Notifications:** 90 days

### Data Minimization

- Store only required fields
- Encrypt sensitive data (CPF, card numbers)
- No medical records in this system
- Patient can request data deletion (LGPD Article 18)

### Consent Management

- Explicit consent flags in patient document
- Consent timestamp recorded
- Withdrawal process available

---

## Scalability Considerations

### Sharding Strategy

- Primary shard key: `clinicId`
- Each clinic's data is isolated
- Enables horizontal scaling

### Document Size Limits

- Appointments: ~2KB each
- Patients: ~1KB each
- Audit logs: ~500B each
- Well within Firestore 1MB limit

### Read/Write Patterns

- Heavy reads on appointments (calendar views)
- Moderate writes on appointments (CRUD operations)
- Light reads on doctors, patients, convênios
- Very light writes on clinic settings

### Cost Optimization

- Use real-time listeners efficiently (limit date ranges)
- Implement pagination for large lists
- Cache static data (doctors, convênios) client-side
- Use Cloud Functions for batch operations

---

## Migration Strategy

### Phase 1: Initial Setup
- Create collections
- Deploy security rules
- Deploy Cloud Functions

### Phase 2: Data Import
- Import clinic data
- Import doctors
- Import existing patients (with consent)

### Phase 3: Go Live
- Enable real-time listeners
- Start accepting appointments
- Monitor performance

### Phase 4: Optimization
- Analyze query patterns
- Add indexes as needed
- Optimize Cloud Functions

---

## Backup & Disaster Recovery

### Automated Backups
- Daily Firestore exports to Cloud Storage
- 30-day retention
- Cross-region replication

### Point-in-Time Recovery
- Firestore native PITR (7 days)
- Manual restore process documented

### Business Continuity
- Multi-region deployment
- Failover procedures
- RTO: 1 hour
- RPO: 15 minutes
