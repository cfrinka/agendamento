import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Fix patient user by creating patient profile and linking it
 * Client-side function to fix users missing patientId
 */
export async function fixPatientProfile(userId: string, clinicId: string, userEmail: string, userName: string) {
    try {
        console.log('[FIX_PATIENT] Starting fix for user:', userId);
        console.log('[FIX_PATIENT] Parameters:', { userId, clinicId, userEmail, userName });

        // First, verify user document exists, if not create it
        console.log('[FIX_PATIENT] Checking if user document exists...');
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.warn('[FIX_PATIENT] User document does not exist! Creating it...');
            // Create user document
            const userData = {
                email: userEmail,
                name: userName,
                role: 'patient',
                clinicId: clinicId,
                active: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            console.log('[FIX_PATIENT] Creating user document with data:', userData);

            // Use setDoc instead of updateDoc since document doesn't exist
            await setDoc(userRef, userData);
            console.log('[FIX_PATIENT] ✅ User document created');
        } else {
            console.log('[FIX_PATIENT] User document exists:', userSnap.data());
        }

        // Check if patient profile already exists with this user's email
        console.log('[FIX_PATIENT] Searching for existing patient profile...');
        const patientsQuery = query(
            collection(db, 'patients'),
            where('email', '==', userEmail),
            where('clinicId', '==', clinicId)
        );

        const patientsSnap = await getDocs(patientsQuery);
        console.log('[FIX_PATIENT] Found', patientsSnap.size, 'existing patient profiles');

        let patientId: string;

        if (!patientsSnap.empty) {
            // Patient profile exists, just link it
            patientId = patientsSnap.docs[0].id;
            console.log('[FIX_PATIENT] Using existing patient profile:', patientId);
        } else {
            // Create new patient profile
            console.log('[FIX_PATIENT] Creating new patient profile...');
            const patientData = {
                name: userName || 'Paciente',
                phone: '',
                email: userEmail,
                clinicId: clinicId,
                active: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            console.log('[FIX_PATIENT] Patient data:', patientData);

            const patientRef = await addDoc(collection(db, 'patients'), patientData);
            patientId = patientRef.id;
            console.log('[FIX_PATIENT] ✅ Created patient profile:', patientId);
        }

        // Update user document with patientId
        console.log('[FIX_PATIENT] Updating user document with patientId:', patientId);
        const updateData = {
            patientId: patientId,
            updatedAt: Timestamp.now()
        };
        console.log('[FIX_PATIENT] Update data:', updateData);

        await updateDoc(userRef, updateData);
        console.log('[FIX_PATIENT] ✅ User document updated successfully');

        return {
            success: true,
            message: 'Patient profile linked successfully',
            patientId: patientId
        };
    } catch (error: any) {
        console.error('[FIX_PATIENT] ❌ Error:', error);
        console.error('[FIX_PATIENT] Error code:', error.code);
        console.error('[FIX_PATIENT] Error message:', error.message);
        console.error('[FIX_PATIENT] Error stack:', error.stack);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}
