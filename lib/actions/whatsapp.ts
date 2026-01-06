'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Envia mensagem de confirmação de consulta via WhatsApp
 * NOTA: Esta é uma implementação placeholder. Em produção, integrar com:
 * - Twilio API
 * - WhatsApp Business API
 * - Ou serviço similar
 */
export async function sendConfirmationRequest(appointmentId: string) {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);

        if (!appointmentSnap.exists()) {
            throw new Error('Agendamento não encontrado');
        }

        const appointment = appointmentSnap.data();

        // Buscar dados do paciente
        const patientSnap = await getDoc(doc(db, 'patients', appointment.patientId));
        const patient = patientSnap.data();

        // Buscar dados do médico
        const doctorSnap = await getDoc(doc(db, 'doctors', appointment.doctorId));
        const doctor = doctorSnap.data();

        // TODO: Implementar envio real de WhatsApp
        // const message = `Olá ${patient?.name}! Você tem uma consulta agendada com Dr(a). ${doctor?.name} em ${formatDate(appointment.date)}. Por favor, confirme sua presença respondendo SIM ou cancele respondendo NÃO.`;
        // await sendWhatsAppMessage(patient?.phone, message);

        // Atualizar status do agendamento
        await updateDoc(appointmentRef, {
            confirmationRequestedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        console.log(`[WhatsApp] Confirmação enviada para agendamento ${appointmentId}`);
        return { success: true };
    } catch (error) {
        console.error('Erro ao enviar confirmação:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Processa resposta de confirmação do paciente
 * NOTA: Em produção, esta função seria chamada por webhook do serviço de WhatsApp
 */
export async function processConfirmationResponse(
    appointmentId: string,
    response: 'confirm' | 'cancel'
) {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);

        if (response === 'confirm') {
            await updateDoc(appointmentRef, {
                status: 'confirmado',
                confirmedAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } else {
            await updateDoc(appointmentRef, {
                status: 'cancelado',
                cancelledAt: Timestamp.now(),
                cancelledBy: 'patient',
                updatedAt: Timestamp.now()
            });

            // Disparar fluxo de lista de espera
            await processWaitlistOnCancellation(appointmentId);
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao processar resposta:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Marca agendamentos sem resposta como "aguardando confirmação"
 * NOTA: Em produção, executar via Cloud Function agendada (cron)
 */
export async function markPendingConfirmations() {
    try {
        const now = new Date();
        const hoursBeforeAppointment = 24; // Configurável

        const appointmentsRef = collection(db, 'appointments');
        const q = query(
            appointmentsRef,
            where('status', '==', 'agendado'),
            where('confirmationRequestedAt', '!=', null)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const appointment = docSnap.data();
            const appointmentDate = appointment.date.toDate();
            const confirmationRequested = appointment.confirmationRequestedAt.toDate();

            const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            const hoursSinceRequest = (now.getTime() - confirmationRequested.getTime()) / (1000 * 60 * 60);

            // Se faltam menos de X horas e já se passaram Y horas desde a solicitação
            if (hoursUntilAppointment < hoursBeforeAppointment && hoursSinceRequest > 12) {
                await updateDoc(doc(db, 'appointments', docSnap.id), {
                    status: 'aguardando-confirmacao',
                    updatedAt: Timestamp.now()
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao marcar confirmações pendentes:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Processa lista de espera quando um agendamento é cancelado
 */
async function processWaitlistOnCancellation(appointmentId: string) {
    try {
        const appointmentSnap = await getDoc(doc(db, 'appointments', appointmentId));
        if (!appointmentSnap.exists()) return;

        const appointment = appointmentSnap.data();
        const appointmentDate = appointment.date;

        // Buscar médico para pegar especialidades
        const doctorSnap = await getDoc(doc(db, 'doctors', appointment.doctorId));
        if (!doctorSnap.exists()) return;

        const doctor = doctorSnap.data();

        // Buscar pacientes na lista de espera compatíveis
        const waitlistRef = collection(db, 'waitlist');
        const q = query(
            waitlistRef,
            where('clinicId', '==', appointment.clinicId),
            where('status', '==', 'waiting'),
            orderBy('createdAt', 'asc'),
            limit(1)
        );

        const waitlistSnapshot = await getDocs(q);

        if (waitlistSnapshot.empty) {
            console.log('Nenhum paciente na lista de espera');
            return;
        }

        // Pegar o primeiro da fila
        const firstInLine = waitlistSnapshot.docs[0];
        const waitlistEntry = firstInLine.data();

        // Verificar se a especialidade é compatível
        const isSpecialtyMatch = doctor.specialties?.some(
            (s: string) => s.toLowerCase() === waitlistEntry.specialty.toLowerCase()
        );

        if (!isSpecialtyMatch) {
            console.log('Especialidade não compatível');
            return;
        }

        // Verificar se o médico é compatível (se especificado)
        if (waitlistEntry.doctorId && waitlistEntry.doctorId !== appointment.doctorId) {
            console.log('Médico não compatível');
            return;
        }

        // Verificar se a data está no range preferido
        const preferredStart = waitlistEntry.preferredDateRange.start.toDate();
        const preferredEnd = waitlistEntry.preferredDateRange.end.toDate();
        const appointmentDateObj = appointmentDate.toDate();

        if (appointmentDateObj < preferredStart || appointmentDateObj > preferredEnd) {
            console.log('Data fora do range preferido');
            return;
        }

        // Oferecer horário ao paciente
        const offerExpiresAt = new Date();
        offerExpiresAt.setMinutes(offerExpiresAt.getMinutes() + 15); // 15 minutos para responder

        await updateDoc(doc(db, 'waitlist', firstInLine.id), {
            status: 'offered',
            offeredAppointmentId: appointmentId,
            offeredAt: Timestamp.now(),
            offerExpiresAt: Timestamp.fromDate(offerExpiresAt),
            updatedAt: Timestamp.now()
        });

        // TODO: Enviar WhatsApp com oferta
        // const patient = await getDoc(doc(db, 'patients', waitlistEntry.patientId));
        // await sendWhatsAppOffer(patient.data()?.phone, appointmentDate, doctor.name);

        console.log(`Horário oferecido ao paciente ${waitlistEntry.patientId}`);
    } catch (error) {
        console.error('Erro ao processar lista de espera:', error);
    }
}

/**
 * Processa resposta de oferta da lista de espera
 */
export async function processWaitlistOfferResponse(
    waitlistId: string,
    response: 'accept' | 'decline'
) {
    try {
        const waitlistRef = doc(db, 'waitlist', waitlistId);
        const waitlistSnap = await getDoc(waitlistRef);

        if (!waitlistSnap.exists()) {
            throw new Error('Entrada da lista de espera não encontrada');
        }

        const waitlistEntry = waitlistSnap.data();

        if (response === 'accept') {
            // Criar agendamento
            const appointmentRef = doc(db, 'appointments', waitlistEntry.offeredAppointmentId);
            const appointmentSnap = await getDoc(appointmentRef);

            if (!appointmentSnap.exists()) {
                throw new Error('Agendamento não encontrado');
            }

            const appointment = appointmentSnap.data();

            // Atualizar agendamento com novo paciente
            await updateDoc(appointmentRef, {
                patientId: waitlistEntry.patientId,
                status: 'confirmado',
                confirmedAt: Timestamp.now(),
                cancelledAt: null,
                cancelledBy: null,
                updatedAt: Timestamp.now()
            });

            // Atualizar lista de espera
            await updateDoc(waitlistRef, {
                status: 'accepted',
                updatedAt: Timestamp.now()
            });

            console.log(`Paciente ${waitlistEntry.patientId} aceitou horário`);
        } else {
            // Marcar como expirado e passar para o próximo
            await updateDoc(waitlistRef, {
                status: 'expired',
                updatedAt: Timestamp.now()
            });

            // Processar próximo da fila
            await processWaitlistOnCancellation(waitlistEntry.offeredAppointmentId);
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao processar resposta da oferta:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Expira ofertas que não foram respondidas no tempo limite
 * NOTA: Em produção, executar via Cloud Function agendada
 */
export async function expireWaitlistOffers() {
    try {
        const now = Timestamp.now();
        const waitlistRef = collection(db, 'waitlist');
        const q = query(
            waitlistRef,
            where('status', '==', 'offered'),
            where('offerExpiresAt', '<=', now)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            await updateDoc(doc(db, 'waitlist', docSnap.id), {
                status: 'expired',
                updatedAt: Timestamp.now()
            });

            // Processar próximo da fila
            const waitlistEntry = docSnap.data();
            if (waitlistEntry.offeredAppointmentId) {
                await processWaitlistOnCancellation(waitlistEntry.offeredAppointmentId);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao expirar ofertas:', error);
        return { success: false, error: String(error) };
    }
}
