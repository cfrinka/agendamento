import {
    collection,
    doc,
    setDoc,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const demoDataService = {
    async createAllDemoData(userId: string) {
        const results = {
            clinic: false,
            doctors: false,
            convenios: false,
            userUpdated: false,
            success: false,
            error: null as string | null,
        };

        try {
            // First, update current user to admin
            await setDoc(doc(db, 'users', userId), {
                id: userId,
                role: 'admin',
                clinicId: 'demo_clinic',
                active: true,
                permissions: {
                    canManageUsers: true,
                    canManageDoctors: true,
                    canManageConvenios: true,
                    canExtendAgenda: true,
                    canViewReports: true,
                    canManageAppointments: true,
                },
                updatedAt: serverTimestamp(),
            }, { merge: true });
            results.userUpdated = true;

            // 1. Create Demo Clinic
            await setDoc(doc(db, 'clinics', 'demo_clinic'), {
                id: 'demo_clinic',
                name: 'Clínica Saúde Total',
                cnpj: '12.345.678/0001-90',
                phone: '+5511987654321',
                email: 'contato@saudetotal.com.br',
                address: {
                    street: 'Av. Paulista',
                    number: '1000',
                    complement: 'Sala 501',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01310-100',
                },
                settings: {
                    defaultAppointmentDuration: 30,
                    defaultBufferTime: 5,
                    workingHours: {
                        monday: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            breaks: [{ start: '12:00', end: '13:00' }],
                        },
                        tuesday: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            breaks: [{ start: '12:00', end: '13:00' }],
                        },
                        wednesday: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            breaks: [{ start: '12:00', end: '13:00' }],
                        },
                        thursday: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            breaks: [{ start: '12:00', end: '13:00' }],
                        },
                        friday: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            breaks: [{ start: '12:00', end: '13:00' }],
                        },
                        saturday: {
                            enabled: true,
                            start: '08:00',
                            end: '12:00',
                            breaks: [],
                        },
                        sunday: {
                            enabled: false,
                            start: '',
                            end: '',
                            breaks: [],
                        },
                    },
                    bookingWindow: {
                        defaultMonths: 1,
                        extendedMonths: null,
                        extendedUntil: null,
                        extendedBy: null,
                        extendedAt: null,
                    },
                    whatsappEnabled: true,
                    whatsappNumber: '+5511987654321',
                    reminderSettings: {
                        enabled: true,
                        times: [24, 2],
                    },
                },
                subscription: {
                    plan: 'pro',
                    status: 'active',
                    startDate: Timestamp.fromDate(new Date('2025-01-01')),
                    expiryDate: Timestamp.fromDate(new Date('2026-01-01')),
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                active: true,
            });
            results.clinic = true;

            // 2. Create Demo Doctors
            const doctors = [
                {
                    id: 'doctor_001',
                    name: 'Dr. João Santos',
                    crm: 'CRM/SP 123456',
                    specialties: ['Cardiologia', 'Clínica Geral'],
                    color: '#3B82F6',
                },
                {
                    id: 'doctor_002',
                    name: 'Dra. Maria Silva',
                    crm: 'CRM/SP 234567',
                    specialties: ['Pediatria'],
                    color: '#10B981',
                },
                {
                    id: 'doctor_003',
                    name: 'Dr. Carlos Oliveira',
                    crm: 'CRM/SP 345678',
                    specialties: ['Ortopedia'],
                    color: '#F59E0B',
                },
            ];

            for (const doctor of doctors) {
                await setDoc(doc(db, 'doctors', doctor.id), {
                    id: doctor.id,
                    clinicId: 'demo_clinic',
                    userId: `user_${doctor.id}`,
                    name: doctor.name,
                    crm: doctor.crm,
                    specialties: doctor.specialties,
                    phone: '+5511987654321',
                    email: `${doctor.id}@saudetotal.com.br`,
                    avatar: null,
                    availability: {
                        monday: {
                            enabled: true,
                            slots: [
                                { start: '08:00', end: '12:00' },
                                { start: '14:00', end: '18:00' },
                            ],
                        },
                        tuesday: {
                            enabled: true,
                            slots: [
                                { start: '08:00', end: '12:00' },
                                { start: '14:00', end: '18:00' },
                            ],
                        },
                        wednesday: {
                            enabled: true,
                            slots: [
                                { start: '08:00', end: '12:00' },
                                { start: '14:00', end: '18:00' },
                            ],
                        },
                        thursday: {
                            enabled: true,
                            slots: [
                                { start: '08:00', end: '12:00' },
                                { start: '14:00', end: '18:00' },
                            ],
                        },
                        friday: {
                            enabled: true,
                            slots: [
                                { start: '08:00', end: '12:00' },
                                { start: '14:00', end: '18:00' },
                            ],
                        },
                        saturday: {
                            enabled: true,
                            slots: [{ start: '08:00', end: '12:00' }],
                        },
                        sunday: {
                            enabled: false,
                            slots: [],
                        },
                    },
                    appointmentDuration: 30,
                    bufferTime: 5,
                    acceptsParticular: true,
                    acceptsConvenio: true,
                    convenioIds: ['convenio_001', 'convenio_002', 'convenio_003'],
                    color: doctor.color,
                    active: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            results.doctors = true;

            // 3. Create Demo Convênios
            const convenios = [
                { id: 'convenio_001', name: 'Unimed', code: 'UNI001' },
                { id: 'convenio_002', name: 'Bradesco Saúde', code: 'BRA002' },
                { id: 'convenio_003', name: 'SulAmérica', code: 'SUL003' },
                { id: 'convenio_004', name: 'Amil', code: 'AMI004' },
                { id: 'convenio_005', name: 'NotreDame Intermédica', code: 'NDI005' },
            ];

            for (const convenio of convenios) {
                await setDoc(doc(db, 'convenios', convenio.id), {
                    id: convenio.id,
                    clinicId: 'demo_clinic',
                    name: convenio.name,
                    code: convenio.code,
                    active: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            results.convenios = true;

            results.success = true;
            return results;
        } catch (error: any) {
            console.error('Error creating demo data:', error);
            results.error = error.message;
            return results;
        }
    },

    async createDemoAppointments(userId: string) {
        try {
            const today = new Date();
            const appointments = [];

            // Create 5 sample appointments for today
            for (let i = 0; i < 5; i++) {
                const hour = 9 + i;
                const appointmentDate = new Date(today);
                appointmentDate.setHours(hour, 0, 0, 0);

                const endDate = new Date(appointmentDate);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const doctorIds = ['doctor_001', 'doctor_002', 'doctor_003'];
                const doctorId = doctorIds[i % doctorIds.length];

                await setDoc(doc(collection(db, 'appointments')), {
                    clinicId: 'demo_clinic',
                    doctorId: doctorId,
                    patientId: `demo_patient_${i}`,
                    bookedBy: userId,
                    bookedFor: null,
                    date: Timestamp.fromDate(appointmentDate),
                    endDate: Timestamp.fromDate(endDate),
                    duration: 30,
                    type: i % 2 === 0 ? 'particular' : 'convenio',
                    convenioId: i % 2 === 0 ? null : 'convenio_001',
                    convenioData: i % 2 === 0 ? null : {
                        convenioName: 'Unimed',
                        planName: 'Unimed Premium',
                        cardNumber: '****1234',
                    },
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
                    notes: `Consulta demo ${i + 1}`,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    version: 1,
                });

                appointments.push({ hour, doctorId });
            }

            return { success: true, appointments };
        } catch (error: any) {
            console.error('Error creating demo appointments:', error);
            return { success: false, error: error.message };
        }
    },
};
