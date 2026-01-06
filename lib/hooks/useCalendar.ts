import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    Unsubscribe,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarAppointment, Doctor, Patient } from '@/lib/types';

export function useCalendarAppointments(
    clinicId: string,
    date: Date,
    doctorId: string | null = null
) {
    const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!clinicId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let q = query(
            collection(db, 'appointments'),
            where('clinicId', '==', clinicId),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('date', 'asc')
        );

        if (doctorId) {
            q = query(
                collection(db, 'appointments'),
                where('clinicId', '==', clinicId),
                where('doctorId', '==', doctorId),
                where('date', '>=', Timestamp.fromDate(startOfDay)),
                where('date', '<=', Timestamp.fromDate(endOfDay)),
                orderBy('date', 'asc')
            );
        }

        const unsubscribe: Unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                try {
                    const doctorIds = new Set<string>();
                    const patientIds = new Set<string>();

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        doctorIds.add(data.doctorId);
                        patientIds.add(data.patientId);
                    });

                    const [doctors, patients] = await Promise.all([
                        fetchDoctorsBatch(Array.from(doctorIds)),
                        fetchPatientsBatch(Array.from(patientIds))
                    ]);

                    const appointmentsList: CalendarAppointment[] = [];

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const doctor = doctors.get(data.doctorId);
                        const patient = patients.get(data.patientId);

                        appointmentsList.push({
                            id: doc.id,
                            doctorId: data.doctorId,
                            doctorName: doctor?.name || 'Desconhecido',
                            doctorColor: doctor?.color || '#3B82F6',
                            patientId: data.patientId,
                            patientName: patient?.name || 'Desconhecido',
                            date: data.date.toDate(),
                            endDate: data.endDate.toDate(),
                            duration: data.duration,
                            type: data.type,
                            status: data.status,
                            convenioName: data.convenioData?.convenioName,
                            notes: data.notes
                        });
                    });

                    setAppointments(appointmentsList);
                    setLoading(false);
                } catch (err: any) {
                    console.error('Error processing appointments:', err);
                    setError(err);
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Error in calendar subscription:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [clinicId, date, doctorId]);

    return { appointments, loading, error };
}

async function fetchDoctorsBatch(doctorIds: string[]): Promise<Map<string, Doctor>> {
    const doctors = new Map<string, Doctor>();

    if (doctorIds.length === 0) return doctors;

    const batches = [];
    for (let i = 0; i < doctorIds.length; i += 10) {
        const batch = doctorIds.slice(i, i + 10);
        const q = query(
            collection(db, 'doctors'),
            where('__name__', 'in', batch)
        );
        batches.push(getDocs(q));
    }

    const results = await Promise.all(batches);
    results.forEach((snapshot) => {
        snapshot.forEach((doc) => {
            doctors.set(doc.id, { id: doc.id, ...doc.data() } as Doctor);
        });
    });

    return doctors;
}

async function fetchPatientsBatch(patientIds: string[]): Promise<Map<string, Patient>> {
    const patients = new Map<string, Patient>();

    if (patientIds.length === 0) return patients;

    const batches = [];
    for (let i = 0; i < patientIds.length; i += 10) {
        const batch = patientIds.slice(i, i + 10);
        const q = query(
            collection(db, 'patients'),
            where('__name__', 'in', batch)
        );
        batches.push(getDocs(q));
    }

    const results = await Promise.all(batches);
    results.forEach((snapshot) => {
        snapshot.forEach((doc) => {
            patients.set(doc.id, { id: doc.id, ...doc.data() } as Patient);
        });
    });

    return patients;
}

export function useWeeklyCalendar(
    clinicId: string,
    startDate: Date,
    doctorId: string | null = null
) {
    const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!clinicId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const weekStart = new Date(startDate);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(startDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let q = query(
            collection(db, 'appointments'),
            where('clinicId', '==', clinicId),
            where('date', '>=', Timestamp.fromDate(weekStart)),
            where('date', '<=', Timestamp.fromDate(weekEnd)),
            orderBy('date', 'asc')
        );

        if (doctorId) {
            q = query(
                collection(db, 'appointments'),
                where('clinicId', '==', clinicId),
                where('doctorId', '==', doctorId),
                where('date', '>=', Timestamp.fromDate(weekStart)),
                where('date', '<=', Timestamp.fromDate(weekEnd)),
                orderBy('date', 'asc')
            );
        }

        const unsubscribe: Unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                try {
                    const doctorIds = new Set<string>();
                    const patientIds = new Set<string>();

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        doctorIds.add(data.doctorId);
                        patientIds.add(data.patientId);
                    });

                    const [doctors, patients] = await Promise.all([
                        fetchDoctorsBatch(Array.from(doctorIds)),
                        fetchPatientsBatch(Array.from(patientIds))
                    ]);

                    const appointmentsList: CalendarAppointment[] = [];

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const doctor = doctors.get(data.doctorId);
                        const patient = patients.get(data.patientId);

                        appointmentsList.push({
                            id: doc.id,
                            doctorId: data.doctorId,
                            doctorName: doctor?.name || 'Desconhecido',
                            doctorColor: doctor?.color || '#3B82F6',
                            patientId: data.patientId,
                            patientName: patient?.name || 'Desconhecido',
                            date: data.date.toDate(),
                            endDate: data.endDate.toDate(),
                            duration: data.duration,
                            type: data.type,
                            status: data.status,
                            convenioName: data.convenioData?.convenioName,
                            notes: data.notes
                        });
                    });

                    setAppointments(appointmentsList);
                    setLoading(false);
                } catch (err: any) {
                    console.error('Error processing appointments:', err);
                    setError(err);
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Error in weekly calendar subscription:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [clinicId, startDate, doctorId]);

    return { appointments, loading, error };
}
