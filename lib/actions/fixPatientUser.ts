import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Fix patient user by creating patient profile and linking it
 * This fixes the issue where user.patientId is undefined
 */
export async function fixPatientUser(userId: string, clinicId: string) {
    try {
        console.log('[FIX_PATIENT] Starting fix for user:', userId);

        // Get user document
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' };
        }

        const userData = userSnap.data();
        console.log('[FIX_PATIENT] User data:', userData);

        // Check if user already has patientId
        if (userData.patientId) {
            console.log('[FIX_PATIENT] User already has patientId:', userData.patientId);
            return { success: true, message: 'User already has patientId', patientId: userData.patientId };
        }

        // Check if patient profile already exists with this user's email
        const patientsQuery = query(
            collection(db, 'patients'),
            where('email', '==', userData.email),
            where('clinicId', '==', clinicId)
        );

        const patientsSnap = await getDocs(patientsQuery);

        let patientId: string;

        if (!patientsSnap.empty) {
            // Patient profile exists, just link it
            patientId = patientsSnap.docs[0].id;
            console.log('[FIX_PATIENT] Found existing patient profile:', patientId);
        } else {
            // Create new patient profile
            console.log('[FIX_PATIENT] Creating new patient profile...');
            const patientRef = await addDoc(collection(db, 'patients'), {
                name: userData.name || 'Paciente',
                phone: userData.phone || '',
                email: userData.email,
                clinicId: clinicId,
                active: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            patientId = patientRef.id;
            console.log('[FIX_PATIENT] Created patient profile:', patientId);
        }

        // Update user document with patientId
        await updateDoc(userRef, {
            patientId: patientId,
            updatedAt: Timestamp.now()
        });

        console.log('[FIX_PATIENT] ✅ User fixed successfully');

        return {
            success: true,
            message: 'Patient profile linked successfully',
            patientId: patientId
        };
    } catch (error: any) {
        console.error('[FIX_PATIENT] ❌ Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
