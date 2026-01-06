export type AppointmentStatus =
    | 'agendado'
    | 'confirmado'
    | 'aguardando-confirmacao'
    | 'cancelado'
    | 'realizado'
    | 'no-show';

export type CancelledBy = 'patient' | 'system' | 'staff' | null;

export type WaitlistStatus = 'waiting' | 'offered' | 'accepted' | 'expired';

export interface Appointment {
    id: string;
    clinicId: string;
    patientId: string;
    doctorId: string;
    date: any; // Firestore Timestamp
    status: AppointmentStatus;
    notes?: string;
    confirmationRequestedAt?: any; // Firestore Timestamp
    confirmedAt?: any; // Firestore Timestamp
    cancelledAt?: any; // Firestore Timestamp
    cancelledBy?: CancelledBy;
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}

export interface WaitlistEntry {
    id: string;
    clinicId: string;
    patientId: string;
    specialty: string;
    doctorId?: string | null;
    preferredDateRange: {
        start: any; // Firestore Timestamp
        end: any; // Firestore Timestamp
    };
    status: WaitlistStatus;
    offeredAppointmentId?: string | null;
    offeredAt?: any; // Firestore Timestamp
    offerExpiresAt?: any; // Firestore Timestamp
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'secretary' | 'doctor' | 'patient';
    clinicId: string;
    active: boolean;
}

export interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    clinicId: string;
    active: boolean;
    address?: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
    };
}

export interface Doctor {
    id: string;
    name: string;
    crm: string;
    specialties: string[];
    phone?: string;
    email?: string;
    color: string;
    clinicId: string;
    active: boolean;
    address?: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
    };
}
