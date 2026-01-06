'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function CalendarPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('day');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!user?.clinicId) return;

        const fetchDoctorsAndPatients = async () => {
            const doctorsSnap = await getDocs(
                query(collection(db, 'doctors'), where('clinicId', '==', user.clinicId))
            );
            const doctorsData = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDoctors(doctorsData);

            const patientsSnap = await getDocs(
                query(collection(db, 'patients'), where('clinicId', '==', user.clinicId))
            );
            const patientsData = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatients(patientsData);
        };

        fetchDoctorsAndPatients();
    }, [user?.clinicId]);

    useEffect(() => {
        if (!user?.clinicId) return;

        let startDate, endDate;

        if (view === 'day') {
            startDate = startOfDay(selectedDate);
            endDate = endOfDay(selectedDate);
        } else if (view === 'week') {
            startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
            endDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
        } else {
            startDate = startOfMonth(selectedDate);
            endDate = endOfMonth(selectedDate);
        }

        let q;
        if (user.role === 'doctor' && user.doctorId) {
            // Doctors see only their own appointments
            q = query(
                collection(db, 'appointments'),
                where('doctorId', '==', user.doctorId)
            );
        } else if (user.role === 'patient' && user.patientId) {
            // Patients see only their own appointments
            q = query(
                collection(db, 'appointments'),
                where('patientId', '==', user.patientId)
            );
        } else {
            // Admin and secretary see all clinic appointments
            q = query(
                collection(db, 'appointments'),
                where('clinicId', '==', user.clinicId)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appointmentsData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((apt: any) => {
                    if (!apt.date?.toDate) return false;
                    const aptDate = apt.date.toDate();
                    return aptDate >= startDate && aptDate <= endDate;
                })
                .sort((a: any, b: any) => {
                    const dateA = a.date?.toDate?.() || new Date(0);
                    const dateB = b.date?.toDate?.() || new Date(0);
                    return dateA.getTime() - dateB.getTime();
                });

            setAppointments(appointmentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId, user?.doctorId, user?.patientId, user?.role, selectedDate, view]);

    if (!user) return null;

    const canCreateAppointment = ['admin', 'secretary'].includes(user.role);

    const getDoctorName = (doctorId: string) => {
        const doctor = doctors.find(d => d.id === doctorId);
        return doctor?.name || 'Médico não encontrado';
    };

    const getPatientName = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        return patient?.name || 'Paciente não encontrado';
    };

    const getDoctorColor = (doctorId: string) => {
        const doctor = doctors.find(d => d.id === doctorId);
        return doctor?.color || '#3B82F6';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'confirmado': '#10B981',        // Verde - Confirmado
            'agendado': '#3B82F6',          // Azul - Agendado
            'realizado': '#6B7280',         // Cinza - Realizado
            'cancelado': '#F97316',         // Laranja - Cancelado
            'no-show': '#DC2626',           // Vermelho - No-show
        };
        return colors[status] || '#3B82F6';
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

    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        if (!user) return;

        try {
            const statusUpdate: any = {
                status: newStatus,
                updatedAt: new Date()
            };

            if (newStatus === 'cancelado') {
                statusUpdate.cancelledAt = new Date();
                statusUpdate.cancelledBy = user.id;
            }

            await updateDoc(doc(db, 'appointments', appointmentId), statusUpdate);
        } catch (error) {
            console.error('Error updating appointment status:', error);
            alert('Erro ao atualizar status. Tente novamente.');
        }
    };

    const canManageStatus = ['admin', 'secretary', 'doctor'].includes(user.role);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
                            <p className="text-sm text-gray-600">
                                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    Voltar
                                </button>
                            </Link>
                            {canCreateAppointment && (
                                <Link href="/book">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Nova Consulta
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors text-gray-900"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setView('day')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'day'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                            >
                                Dia
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setView('month')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                            >
                                Mês
                            </button>
                        </div>
                    </div>

                    {/* Color Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-6 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Legenda:</span>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
                                <span className="text-sm text-gray-600">Agendado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
                                <span className="text-sm text-gray-600">Confirmado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6B7280' }}></div>
                                <span className="text-sm text-gray-600">Realizado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F97316' }}></div>
                                <span className="text-sm text-gray-600">Cancelado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#DC2626' }}></div>
                                <span className="text-sm text-gray-600">No-Show</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <LoadingState message="Carregando agenda..." />
                ) : view === 'day' ? (
                    <DayView
                        appointments={appointments}
                        getDoctorName={getDoctorName}
                        getPatientName={getPatientName}
                        getDoctorColor={getDoctorColor}
                        getStatusColor={getStatusColor}
                        getStatusVariant={getStatusVariant}
                        getStatusLabel={getStatusLabel}
                        onAppointmentClick={(appointment: any) => {
                            setSelectedAppointment(appointment);
                            setIsModalOpen(true);
                        }}
                    />
                ) : view === 'week' ? (
                    <WeekView
                        selectedDate={selectedDate}
                        appointments={appointments}
                        getDoctorName={getDoctorName}
                        getPatientName={getPatientName}
                        getDoctorColor={getDoctorColor}
                        getStatusColor={getStatusColor}
                        getStatusVariant={getStatusVariant}
                        getStatusLabel={getStatusLabel}
                        onDayClick={(date: Date) => {
                            setSelectedDate(date);
                            setView('day');
                        }}
                        onAppointmentClick={(appointment: any) => {
                            setSelectedAppointment(appointment);
                            setIsModalOpen(true);
                        }}
                    />
                ) : (
                    <MonthView
                        selectedDate={selectedDate}
                        appointments={appointments}
                        getDoctorColor={getDoctorColor}
                        getStatusColor={getStatusColor}
                        onDayClick={(date: Date) => {
                            setSelectedDate(date);
                            setView('day');
                        }}
                    />
                )}
            </div>

            {/* Appointment Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Consulta</DialogTitle>
                        <DialogDescription>
                            Visualize e gerencie as informações do agendamento
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Data e Hora</p>
                                <p className="font-semibold">
                                    {selectedAppointment.date?.toDate ? format(selectedAppointment.date.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '--'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Paciente</p>
                                <p className="font-semibold">{getPatientName(selectedAppointment.patientId)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Médico</p>
                                <p className="font-semibold">Dr(a). {getDoctorName(selectedAppointment.doctorId)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={getStatusVariant(selectedAppointment.status)}>
                                    {getStatusLabel(selectedAppointment.status)}
                                </Badge>
                            </div>

                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Observações</p>
                                    <p className="text-sm">{selectedAppointment.notes}</p>
                                </div>
                            )}

                            {canManageStatus && selectedAppointment.status !== 'cancelado' && selectedAppointment.status !== 'realizado' && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-3">Alterar Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAppointment.status === 'agendado' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    handleStatusChange(selectedAppointment.id, 'confirmado');
                                                    setIsModalOpen(false);
                                                }}
                                            >
                                                Confirmar
                                            </Button>
                                        )}
                                        {selectedAppointment.status === 'confirmado' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleStatusChange(selectedAppointment.id, 'realizado');
                                                        setIsModalOpen(false);
                                                    }}
                                                >
                                                    Realizado
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleStatusChange(selectedAppointment.id, 'no-show');
                                                        setIsModalOpen(false);
                                                    }}
                                                >
                                                    No-Show
                                                </Button>
                                            </>
                                        )}
                                        {(selectedAppointment.status === 'agendado' || selectedAppointment.status === 'confirmado') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja cancelar esta consulta?')) {
                                                        handleStatusChange(selectedAppointment.id, 'cancelado');
                                                        setIsModalOpen(false);
                                                    }
                                                }}
                                            >
                                                Cancelar Consulta
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                    }
                </DialogContent >
            </Dialog >
        </div >
    );
}

function DayView({ appointments, getDoctorName, getPatientName, getDoctorColor, getStatusColor, getStatusVariant, getStatusLabel, onAppointmentClick }: any) {
    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-center py-12">
                    Nenhuma consulta agendada para esta data.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {appointments.map((appointment: any) => (
                <Card
                    key={appointment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onAppointmentClick(appointment)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-2 h-16 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: getStatusColor(appointment.status) }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <span className="font-semibold">
                                            {appointment.date?.toDate ? format(appointment.date.toDate(), 'HH:mm') : '--:--'}
                                        </span>
                                    </div>
                                    <Badge variant={getStatusVariant(appointment.status)}>
                                        {getStatusLabel(appointment.status)}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        {getPatientName(appointment.patientId)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Dr(a). {getDoctorName(appointment.doctorId)}
                                    </p>
                                    {appointment.notes && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {appointment.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function WeekView({ selectedDate, appointments, getDoctorName, getPatientName, getDoctorColor, getStatusColor, getStatusVariant, getStatusLabel, onDayClick, onAppointmentClick }: any) {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) });

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {weekDays.map((day) => {
                    const dayAppointments = appointments.filter((apt: any) =>
                        apt.date?.toDate && isSameDay(apt.date.toDate(), day)
                    );

                    return (
                        <div key={day.toString()} className="bg-white min-h-[200px]">
                            <div
                                className="p-2 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => onDayClick(day)}
                            >
                                <p className="text-sm font-semibold text-center">
                                    {format(day, 'EEE', { locale: ptBR })}
                                </p>
                                <p className={`text-2xl font-bold text-center ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                                    {format(day, 'd')}
                                </p>
                            </div>
                            <div className="p-2 space-y-1">
                                {dayAppointments.map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow border"
                                        style={{
                                            backgroundColor: getStatusColor(apt.status) + '30',
                                            borderLeft: `4px solid ${getStatusColor(apt.status)}`,
                                            borderColor: getStatusColor(apt.status) + '40'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAppointmentClick(apt);
                                        }}
                                    >
                                        <p className="font-bold text-gray-900">
                                            {apt.date?.toDate ? format(apt.date.toDate(), 'HH:mm') : '--:--'}
                                        </p>
                                        <p className="truncate text-gray-700 font-medium">{getPatientName(apt.patientId)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MonthView({ selectedDate, appointments, getDoctorColor, getStatusColor, onDayClick }: any) {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="bg-gray-50 p-2 text-center">
                        <p className="text-sm font-semibold text-gray-700">{day}</p>
                    </div>
                ))}
                {calendarDays.map((day) => {
                    const dayAppointments = appointments.filter((apt: any) =>
                        apt.date?.toDate && isSameDay(apt.date.toDate(), day)
                    );
                    const isCurrentMonth = isSameMonth(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toString()}
                            className={`bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''}`}
                            onClick={() => onDayClick(day)}
                        >
                            <p className={`text-sm font-semibold mb-1 ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                {format(day, 'd')}
                            </p>
                            <div className="space-y-1">
                                {dayAppointments.slice(0, 3).map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="w-full h-1 rounded"
                                        style={{ backgroundColor: getStatusColor(apt.status) }}
                                    />
                                ))}
                                {dayAppointments.length > 3 && (
                                    <p className="text-xs text-gray-600">+{dayAppointments.length - 3}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
