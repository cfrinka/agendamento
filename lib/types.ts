import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'doctor' | 'secretary' | 'patient';

export type AppointmentStatus = 'agendado' | 'confirmado' | 'atendido' | 'falta' | 'cancelado';

export type AppointmentType = 'particular' | 'convenio';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: UserRole;
    clinicId: string;
    doctorId?: string;
    patientId?: string;
    permissions?: {
        canManageUsers?: boolean;
        canManageDoctors?: boolean;
        canManageConvenios?: boolean;
        canExtendAgenda?: boolean;
        canViewReports?: boolean;
        canManageAppointments?: boolean;
    };
    avatar?: string;
    active: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
}

export interface Clinic {
    id: string;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    settings: {
        defaultAppointmentDuration: number;
        defaultBufferTime: number;
        workingHours: {
            [day: string]: {
                enabled: boolean;
                start: string;
                end: string;
                breaks?: Array<{
                    start: string;
                    end: string;
                }>;
            };
        };
        bookingWindow: {
            defaultMonths: number;
            extendedMonths?: number;
            extendedUntil?: Timestamp;
            extendedBy?: string;
            extendedAt?: Timestamp;
        };
        whatsappEnabled: boolean;
        whatsappNumber?: string;
        reminderSettings: {
            enabled: boolean;
            times: number[];
        };
    };
    subscription: {
        plan: string;
        status: string;
        startDate: Timestamp;
        expiryDate?: Timestamp;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    active: boolean;
}

export interface Doctor {
    id: string;
    clinicId: string;
    userId: string;
    name: string;
    crm: string;
    specialties: string[];
    phone: string;
    email: string;
    avatar?: string;
    availability: {
        [day: string]: {
            enabled: boolean;
            slots: Array<{
                start: string;
                end: string;
            }>;
        };
    };
    appointmentDuration: number;
    bufferTime: number;
    acceptsParticular: boolean;
    acceptsConvenio: boolean;
    convenioIds: string[];
    color: string;
    active: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Patient {
    id: string;
    clinicId: string;
    userId?: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    birthDate?: Timestamp;
    consent: {
        dataStorage: boolean;
        whatsappNotifications: boolean;
        consentDate: Timestamp;
    };
    convenios?: Array<{
        convenioId: string;
        planName?: string;
        cardNumber?: string;
        validityDate?: Timestamp;
    }>;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    active: boolean;
}

export interface Convenio {
    id: string;
    clinicId: string;
    name: string;
    code?: string;
    active: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    deactivatedAt?: Timestamp;
    deactivatedBy?: string;
}

export interface Appointment {
    id: string;
    clinicId: string;
    doctorId: string;
    patientId: string;
    bookedBy: string;
    bookedFor?: string;
    date: Timestamp;
    endDate: Timestamp;
    duration: number;
    type: AppointmentType;
    convenioId?: string;
    convenioData?: {
        convenioName: string;
        planName?: string;
        cardNumber?: string;
    };
    status: AppointmentStatus;
    statusHistory: Array<{
        status: string;
        changedAt: Timestamp;
        changedBy: string;
        reason?: string;
    }>;
    confirmed: boolean;
    confirmedAt?: Timestamp;
    confirmationMethod?: 'whatsapp' | 'phone' | 'email' | 'system';
    cancelledAt?: Timestamp;
    cancelledBy?: string;
    cancellationReason?: string;
    remindersSent: Array<{
        type: '24h' | '2h';
        sentAt: Timestamp;
        method: 'whatsapp' | 'sms' | 'email';
        success: boolean;
    }>;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: number;
}

export interface CalendarAppointment {
    id: string;
    doctorId: string;
    doctorName: string;
    doctorColor: string;
    patientId: string;
    patientName: string;
    date: Date;
    endDate: Date;
    duration: number;
    type: AppointmentType;
    status: AppointmentStatus;
    convenioName?: string;
    notes?: string;
}

export interface AgendaRule {
    id: string;
    clinicId: string;
    type: 'booking_window_extension';
    extendedMonths: number;
    extendedBy: string;
    extendedAt: Timestamp;
    expiresAt?: Timestamp;
    active: boolean;
    reason?: string;
}

export interface AuditLog {
    id: string;
    clinicId: string;
    userId: string;
    action: string;
    entityType: string;
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

export interface Notification {
    id: string;
    clinicId: string;
    appointmentId: string;
    patientId: string;
    type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
    method: 'whatsapp' | 'sms' | 'email';
    recipient: string;
    message: string;
    status: 'pending' | 'sent' | 'failed' | 'delivered';
    sentAt?: Timestamp;
    deliveredAt?: Timestamp;
    error?: string;
    createdAt: Timestamp;
}

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}

export interface BookingWindow {
    defaultMonths: number;
    extendedMonths?: number;
    extendedUntil?: Timestamp;
    extendedBy?: string;
    extendedAt?: Timestamp;
}
