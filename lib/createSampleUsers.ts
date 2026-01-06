import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

export async function createSampleUsers(clinicId: string) {
    const password = 'Testp@ss123';
    const results = {
        admin: null as any,
        secretary: null as any,
        doctor: null as any,
        patient: null as any,
        errors: [] as string[]
    };

    // 1. Create Admin User
    try {
        const adminEmail = 'admin@admin.com';
        const adminAuth = await createUserWithEmailAndPassword(auth, adminEmail, password);

        await setDoc(doc(db, 'users', adminAuth.user.uid), {
            email: adminEmail,
            name: 'Admin User',
            role: 'admin',
            clinicId: clinicId,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        results.admin = { uid: adminAuth.user.uid, email: adminEmail };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            results.errors.push('Admin: Email já existe');
        } else {
            results.errors.push(`Admin: ${error.message}`);
        }
    }

    // 2. Create Secretary User
    try {
        const secretaryEmail = 'secretary@secretary.com';
        const secretaryAuth = await createUserWithEmailAndPassword(auth, secretaryEmail, password);

        await setDoc(doc(db, 'users', secretaryAuth.user.uid), {
            email: secretaryEmail,
            name: 'Secretary User',
            role: 'secretary',
            clinicId: clinicId,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        results.secretary = { uid: secretaryAuth.user.uid, email: secretaryEmail };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            results.errors.push('Secretary: Email já existe');
        } else {
            results.errors.push(`Secretary: ${error.message}`);
        }
    }

    // 3. Create Doctor User
    try {
        const doctorEmail = 'doctor@doctor.com';
        const doctorAuth = await createUserWithEmailAndPassword(auth, doctorEmail, password);

        // Create doctor profile
        const doctorRef = await addDoc(collection(db, 'doctors'), {
            name: 'Dr. João Silva',
            crm: '123456',
            specialties: ['Clínico Geral', 'Cardiologia'],
            phone: '(11) 98765-4321',
            email: doctorEmail,
            color: '#3B82F6',
            clinicId: clinicId,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        await setDoc(doc(db, 'users', doctorAuth.user.uid), {
            email: doctorEmail,
            name: 'Dr. João Silva',
            role: 'doctor',
            clinicId: clinicId,
            doctorId: doctorRef.id,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        results.doctor = { uid: doctorAuth.user.uid, email: doctorEmail, doctorId: doctorRef.id };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            results.errors.push('Doctor: Email já existe');
        } else {
            results.errors.push(`Doctor: ${error.message}`);
        }
    }

    // 4. Create Patient User
    try {
        const patientEmail = 'patient@patient.com';
        const patientAuth = await createUserWithEmailAndPassword(auth, patientEmail, password);

        // Create patient profile
        const patientRef = await addDoc(collection(db, 'patients'), {
            name: 'Maria Santos',
            phone: '(11) 91234-5678',
            email: patientEmail,
            cpf: '123.456.789-00',
            clinicId: clinicId,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        await setDoc(doc(db, 'users', patientAuth.user.uid), {
            email: patientEmail,
            name: 'Maria Santos',
            role: 'patient',
            clinicId: clinicId,
            patientId: patientRef.id,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        results.patient = { uid: patientAuth.user.uid, email: patientEmail, patientId: patientRef.id };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            results.errors.push('Patient: Email já existe');
        } else {
            results.errors.push(`Patient: ${error.message}`);
        }
    }

    return {
        success: results.errors.length === 0,
        results,
        message: results.errors.length === 0
            ? 'Todos os usuários de exemplo foram criados com sucesso!'
            : `Alguns usuários já existem ou não puderam ser criados`
    };
}
