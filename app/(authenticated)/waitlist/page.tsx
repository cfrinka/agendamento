'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Clock, Plus, User, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { removeFromWaitlist } from '@/lib/actions/waitlist';

export default function WaitlistPage() {
    const { user } = useAuth();
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    useEffect(() => {
        if (!user?.clinicId) return;

        const fetchPatientsAndDoctors = async () => {
            const patientsSnap = await getDocs(
                query(collection(db, 'patients'), where('clinicId', '==', user.clinicId))
            );
            const patientsData = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatients(patientsData);

            const doctorsSnap = await getDocs(
                query(collection(db, 'doctors'), where('clinicId', '==', user.clinicId))
            );
            const doctorsData = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDoctors(doctorsData);
        };

        fetchPatientsAndDoctors();
    }, [user?.clinicId]);

    useEffect(() => {
        if (!user?.clinicId) return;

        const q = query(
            collection(db, 'waitlist'),
            where('clinicId', '==', user.clinicId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const waitlistData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWaitlist(waitlistData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId]);

    if (!user) return null;

    const canManageWaitlist = ['admin', 'secretary'].includes(user.role);

    const getPatientName = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        return patient?.name || 'Paciente não encontrado';
    };

    const getDoctorName = (doctorId: string) => {
        if (!doctorId) return 'Qualquer médico';
        const doctor = doctors.find(d => d.id === doctorId);
        return doctor?.name || 'Médico não encontrado';
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            waiting: 'default',
            offered: 'secondary',
            accepted: 'outline',
            expired: 'destructive',
        };
        return variants[status] || 'outline';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            waiting: 'Aguardando',
            offered: 'Oferta Ativa',
            accepted: 'Aceito',
            expired: 'Expirado',
        };
        return labels[status] || status;
    };

    const handleRemove = async (waitlistId: string) => {
        if (!confirm('Tem certeza que deseja remover este paciente da lista de espera?')) return;

        const result = await removeFromWaitlist(waitlistId);
        if (!result.success) {
            alert('Erro ao remover da lista de espera. Tente novamente.');
        }
    };

    const getQueuePosition = (index: number) => {
        const activeEntries = waitlist.filter(entry => entry.status === 'waiting');
        const position = activeEntries.findIndex(entry => entry.id === waitlist[index].id);
        return position >= 0 ? position + 1 : null;
    };

    const activeWaitlist = waitlist.filter(entry => entry.status === 'waiting' || entry.status === 'offered');
    const historicalWaitlist = waitlist.filter(entry => entry.status === 'accepted' || entry.status === 'expired');

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Lista de Espera"
                description="Gerencie pacientes aguardando horários disponíveis"
                action={canManageWaitlist ? {
                    label: 'Adicionar à Lista',
                    href: '/waitlist/new',
                    icon: Plus
                } : undefined}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingState message="Carregando lista de espera..." />
                ) : waitlist.length === 0 ? (
                    <EmptyState
                        icon={Clock}
                        title="Nenhum paciente na lista de espera"
                        description="Adicione pacientes para serem notificados quando houver cancelamentos"
                        action={canManageWaitlist ? {
                            label: 'Adicionar Primeiro Paciente',
                            href: '/waitlist/new'
                        } : undefined}
                    />
                ) : (
                    <div className="space-y-8">
                        {/* Lista Ativa */}
                        {activeWaitlist.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Fila Ativa</h2>
                                <div className="space-y-4">
                                    {activeWaitlist.map((entry, index) => {
                                        const queuePosition = getQueuePosition(waitlist.indexOf(entry));
                                        return (
                                            <Card key={entry.id} className={entry.status === 'offered' ? 'border-secondary' : ''}>
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {queuePosition && (
                                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                                                                    {queuePosition}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <CardTitle className="text-lg">
                                                                    {getPatientName(entry.patientId)}
                                                                </CardTitle>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Adicionado em {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '--'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={getStatusVariant(entry.status)}>
                                                            {getStatusLabel(entry.status)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    {entry.status === 'offered' && (
                                                        <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/20 rounded-md">
                                                            <AlertCircle className="w-5 h-5 text-secondary-foreground" />
                                                            <span className="text-sm font-medium">
                                                                Horário oferecido! Aguardando resposta do paciente.
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">Especialidade</p>
                                                            <p className="font-medium">{entry.specialty}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">Médico Preferido</p>
                                                            <p className="font-medium">{getDoctorName(entry.doctorId)}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-sm text-muted-foreground mb-1">Período Preferido</p>
                                                            <p className="font-medium">
                                                                {entry.preferredDateRange?.start?.toDate && entry.preferredDateRange?.end?.toDate
                                                                    ? `${format(entry.preferredDateRange.start.toDate(), 'dd/MM/yyyy', { locale: ptBR })} até ${format(entry.preferredDateRange.end.toDate(), 'dd/MM/yyyy', { locale: ptBR })}`
                                                                    : 'Não especificado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {canManageWaitlist && (
                                                        <div className="flex gap-2 mt-4 pt-4 border-t">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleRemove(entry.id)}
                                                            >
                                                                Remover da Lista
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Histórico */}
                        {historicalWaitlist.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Histórico</h2>
                                <div className="space-y-4">
                                    {historicalWaitlist.map((entry) => (
                                        <Card key={entry.id} className="opacity-60">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {getPatientName(entry.patientId)}
                                                        </CardTitle>
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.specialty} • {getDoctorName(entry.doctorId)}
                                                        </p>
                                                    </div>
                                                    <Badge variant={getStatusVariant(entry.status)}>
                                                        {getStatusLabel(entry.status)}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
