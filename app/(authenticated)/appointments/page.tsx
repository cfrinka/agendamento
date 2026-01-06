'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, Clock, Plus, AlertCircle, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.clinicId) return;

        let q;
        if (user.role === 'patient' && user.patientId) {
            // Patients see only their own appointments
            q = query(
                collection(db, 'appointments'),
                where('patientId', '==', user.patientId),
                orderBy('date', 'desc')
            );
        } else if (user.role === 'doctor' && user.doctorId) {
            // Doctors see only their own appointments
            q = query(
                collection(db, 'appointments'),
                where('doctorId', '==', user.doctorId),
                orderBy('date', 'desc')
            );
        } else {
            // Admin and secretary see all clinic appointments
            q = query(
                collection(db, 'appointments'),
                where('clinicId', '==', user.clinicId),
                orderBy('date', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const appointmentsData: any[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch doctor data for each appointment
            const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctorId).filter(Boolean))];
            const doctorsData: Record<string, any> = {};

            await Promise.all(
                doctorIds.map(async (doctorId) => {
                    if (!doctorsData[doctorId]) {
                        const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
                        if (doctorDoc.exists()) {
                            doctorsData[doctorId] = { id: doctorDoc.id, ...doctorDoc.data() };
                        }
                    }
                })
            );

            setDoctors(doctorsData);
            setAppointments(appointmentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId, user?.patientId, user?.doctorId, user?.role]);

    if (!user) return null;

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        if (!user) return;

        try {
            const statusUpdate: any = {
                status: newStatus,
                updatedAt: Timestamp.now()
            };

            if (newStatus === 'confirmado') {
                statusUpdate.confirmedAt = Timestamp.now();
            }

            if (newStatus === 'cancelado') {
                statusUpdate.cancelledAt = Timestamp.now();
                statusUpdate.cancelledBy = 'staff';
            }

            await updateDoc(doc(db, 'appointments', appointmentId), statusUpdate);

            // Disparar fluxo de lista de espera se for cancelamento
            if (newStatus === 'cancelado') {
                // O fluxo automático será disparado pelo listener do Firestore
                // ou por Cloud Function em produção
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            alert('Erro ao atualizar status. Tente novamente.');
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        if (!user || !confirm('Tem certeza que deseja cancelar esta consulta?')) return;
        await handleStatusChange(appointmentId, 'cancelado');
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            agendado: 'default',
            confirmado: 'secondary',
            'aguardando-confirmacao': 'destructive',
            realizado: 'outline',
            'no-show': 'destructive',
            cancelado: 'destructive',
        };
        return variants[status] || 'outline';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            agendado: 'Agendado',
            confirmado: 'Confirmado',
            'aguardando-confirmacao': 'Aguardando Confirmação',
            realizado: 'Realizado',
            'no-show': 'No-Show',
            cancelado: 'Cancelado',
        };
        return labels[status] || status;
    };

    const needsConfirmationAlert = (appointment: any) => {
        if (appointment.status !== 'aguardando-confirmacao') return false;
        return canManageStatus;
    };

    const canManageStatus = ['admin', 'secretary', 'doctor'].includes(user.role);

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Consultas"
                description="Visualize e gerencie as consultas"
                action={{
                    label: 'Nova Consulta',
                    href: '/book',
                    icon: Plus
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingState message="Carregando consultas..." />
                ) : appointments.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="Nenhuma consulta encontrada"
                        description="Você ainda não tem consultas agendadas"
                        action={{
                            label: 'Agendar Primeira Consulta',
                            href: '/book'
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment) => (
                            <Card key={appointment.id} className={needsConfirmationAlert(appointment) ? 'border-destructive' : ''}>
                                <CardContent className="p-6">
                                    {needsConfirmationAlert(appointment) && (
                                        <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 rounded-md">
                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                            <span className="text-sm font-medium text-destructive">
                                                Paciente não confirmou presença. Entre em contato urgente!
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-lg font-semibold">
                                                    {appointment.date?.toDate ?
                                                        format(appointment.date.toDate(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
                                                        : 'Data não disponível'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <Clock className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    {appointment.date?.toDate ?
                                                        format(appointment.date.toDate(), 'HH:mm')
                                                        : '--:--'}
                                                </span>
                                            </div>
                                            {appointment.doctorId && doctors[appointment.doctorId] && (
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Stethoscope className="w-5 h-5 text-muted-foreground" />
                                                    <span className="text-muted-foreground">
                                                        Dr(a). {doctors[appointment.doctorId].name}
                                                        {doctors[appointment.doctorId].crm && (
                                                            <span className="text-xs ml-2">CRM: {doctors[appointment.doctorId].crm}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="text-sm text-muted-foreground">
                                                <p className="mb-1">
                                                    <span className="font-medium">Tipo:</span>{' '}
                                                    {appointment.type === 'particular' ? 'Particular' : 'Convênio'}
                                                </p>
                                                {appointment.notes && (
                                                    <p className="mb-1">
                                                        <span className="font-medium">Observações:</span> {appointment.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={getStatusVariant(appointment.status)}>
                                                {getStatusLabel(appointment.status)}
                                            </Badge>
                                            {canManageStatus && appointment.status !== 'cancelado' && appointment.status !== 'realizado' && (
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {(appointment.status === 'agendado' || appointment.status === 'aguardando-confirmacao') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(appointment.id, 'confirmado')}
                                                        >
                                                            Confirmar
                                                        </Button>
                                                    )}
                                                    {appointment.status === 'confirmado' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusChange(appointment.id, 'realizado')}
                                                            >
                                                                Realizado
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusChange(appointment.id, 'no-show')}
                                                            >
                                                                No-Show
                                                            </Button>
                                                        </>
                                                    )}
                                                    {(appointment.status === 'agendado' || appointment.status === 'confirmado' || appointment.status === 'aguardando-confirmacao') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleCancelAppointment(appointment.id)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
