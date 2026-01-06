'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { WaitlistEntry } from '@/types';

export async function addToWaitlist(data: {
    clinicId: string;
    patientId: string;
    specialty: string;
    doctorId?: string;
    preferredDateRange: {
        start: Date;
        end: Date;
    };
}) {
    try {
        const waitlistRef = collection(db, 'waitlist');

        const newEntry = await addDoc(waitlistRef, {
            clinicId: data.clinicId,
            patientId: data.patientId,
            specialty: data.specialty,
            doctorId: data.doctorId || null,
            preferredDateRange: {
                start: Timestamp.fromDate(data.preferredDateRange.start),
                end: Timestamp.fromDate(data.preferredDateRange.end)
            },
            status: 'waiting',
            offeredAppointmentId: null,
            offeredAt: null,
            offerExpiresAt: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        return { success: true, id: newEntry.id };
    } catch (error) {
        console.error('Erro ao adicionar à lista de espera:', error);
        return { success: false, error: String(error) };
    }
}

export async function removeFromWaitlist(waitlistId: string) {
    try {
        await deleteDoc(doc(db, 'waitlist', waitlistId));
        return { success: true };
    } catch (error) {
        console.error('Erro ao remover da lista de espera:', error);
        return { success: false, error: String(error) };
    }
}

export async function updateWaitlistEntry(
    waitlistId: string,
    data: Partial<WaitlistEntry>
) {
    try {
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now()
        };

        if (data.preferredDateRange) {
            updateData.preferredDateRange = {
                start: Timestamp.fromDate(data.preferredDateRange.start as any),
                end: Timestamp.fromDate(data.preferredDateRange.end as any)
            };
        }

        await updateDoc(doc(db, 'waitlist', waitlistId), updateData);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar entrada da lista de espera:', error);
        return { success: false, error: String(error) };
    }
}

export async function getWaitlistByClinic(clinicId: string) {
    try {
        const waitlistRef = collection(db, 'waitlist');
        const q = query(
            waitlistRef,
            where('clinicId', '==', clinicId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        const waitlist = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: waitlist };
    } catch (error) {
        console.error('Erro ao buscar lista de espera:', error);
        return { success: false, error: String(error) };
    }
}
