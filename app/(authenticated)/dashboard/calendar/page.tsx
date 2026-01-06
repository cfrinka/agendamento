'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCalendarAppointments } from '@/lib/hooks/useCalendar';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week'>('day');
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

    const { appointments, loading, error } = useCalendarAppointments(
        user?.clinicId || '',
        selectedDate,
        selectedDoctor
    );

    if (!user) return null;

    const canCreateAppointment = ['admin', 'secretary'].includes(user.role);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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

                    {/* Controls */}
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
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
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
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                Dia
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                Semana
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Carregando agenda...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">Erro ao carregar agenda: {error.message}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="bg-white rounded-lg shadow">
                        {view === 'day' ? (
                            <DayView appointments={appointments} date={selectedDate} />
                        ) : (
                            <WeekView appointments={appointments} startDate={startOfWeek(selectedDate)} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function DayView({ appointments, date }: { appointments: any[]; date: Date }) {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h às 20h

    return (
        <div className="divide-y divide-gray-200">
            {hours.map((hour) => {
                const hourAppointments = appointments.filter((apt) => {
                    const aptHour = apt.date.getHours();
                    return aptHour === hour;
                });

                return (
                    <div key={hour} className="flex">
                        <div className="w-20 flex-shrink-0 p-4 text-sm text-gray-500 font-medium">
                            {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 p-2 min-h-[80px]">
                            {hourAppointments.length > 0 ? (
                                <div className="space-y-2">
                                    {hourAppointments.map((apt) => (
                                        <AppointmentCard key={apt.id} appointment={apt} />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Sem consultas
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WeekView({ appointments, startDate }: { appointments: any[]; startDate: Date }) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
        <div className="grid grid-cols-7 divide-x divide-gray-200">
            {days.map((day) => {
                const dayAppointments = appointments.filter((apt) => {
                    return format(apt.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                });

                return (
                    <div key={day.toISOString()} className="min-h-[400px]">
                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="text-center">
                                <div className="text-xs text-gray-600 uppercase">
                                    {format(day, 'EEE', { locale: ptBR })}
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {format(day, 'd')}
                                </div>
                            </div>
                        </div>
                        <div className="p-2 space-y-2">
                            {dayAppointments.map((apt) => (
                                <AppointmentCard key={apt.id} appointment={apt} compact />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AppointmentCard({ appointment, compact = false }: { appointment: any; compact?: boolean }) {
    const statusColors = {
        agendado: 'bg-blue-100 text-blue-800 border-blue-200',
        confirmado: 'bg-green-100 text-green-800 border-green-200',
        atendido: 'bg-gray-100 text-gray-800 border-gray-200',
        falta: 'bg-red-100 text-red-800 border-red-200',
        cancelado: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.agendado;

    return (
        <div
            className={`border-l-4 p-3 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${statusColor}`}
            style={{ borderLeftColor: appointment.doctorColor }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                        {appointment.patientName}
                    </div>
                    {!compact && (
                        <>
                            <div className="text-xs text-gray-600 mt-1">
                                {appointment.doctorName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {format(appointment.date, 'HH:mm')} - {format(appointment.endDate, 'HH:mm')}
                            </div>
                            {appointment.convenioName && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {appointment.convenioName}
                                </div>
                            )}
                        </>
                    )}
                    {compact && (
                        <div className="text-xs text-gray-600 mt-1">
                            {format(appointment.date, 'HH:mm')}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/50">
                        {appointment.type === 'particular' ? 'Part.' : 'Conv.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
