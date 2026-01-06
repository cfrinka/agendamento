'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function BookAppointmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [convenios, setConvenios] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [appointmentType, setAppointmentType] = useState<'particular' | 'convenio'>('particular');
    const [selectedConvenio, setSelectedConvenio] = useState('');
    const [notes, setNotes] = useState('');
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.clinicId) return;

        const fetchData = async () => {
            const doctorsQuery = query(
                collection(db, 'doctors'),
                where('clinicId', '==', user.clinicId),
                where('active', '==', true)
            );
            const doctorsSnap = await getDocs(doctorsQuery);
            setDoctors(doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Only fetch patients if user is admin or secretary
            if (user.role === 'admin' || user.role === 'secretary') {
                const patientsQuery = query(
                    collection(db, 'patients'),
                    where('clinicId', '==', user.clinicId),
                    where('active', '==', true)
                );
                const patientsSnap = await getDocs(patientsQuery);
                setPatients(patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            const conveniosQuery = query(
                collection(db, 'convenios'),
                where('clinicId', '==', user.clinicId),
                where('active', '==', true)
            );
            const conveniosSnap = await getDocs(conveniosQuery);
            setConvenios(conveniosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchData();
    }, [user?.clinicId, user?.role]);

    useEffect(() => {
        if (!user?.patientId || user.role !== 'patient') return;

        // Auto-set patient ID for logged-in patients
        setSelectedPatient(user.patientId);
    }, [user?.patientId, user?.role]);

    // Fetch booked slots when doctor and date are selected
    useEffect(() => {
        if (!selectedDoctor || !selectedDate) {
            setBookedSlots([]);
            return;
        }

        const fetchBookedSlots = async () => {
            try {
                const startOfDay = new Date(`${selectedDate}T00:00:00`);
                const endOfDay = new Date(`${selectedDate}T23:59:59`);

                const appointmentsQuery = query(
                    collection(db, 'appointments'),
                    where('doctorId', '==', selectedDoctor),
                    where('date', '>=', startOfDay),
                    where('date', '<=', endOfDay)
                );

                const snapshot = await getDocs(appointmentsQuery);

                // Filter by status in memory instead of in query
                const slots = snapshot.docs
                    .filter(doc => {
                        const status = doc.data().status;
                        return ['agendado', 'confirmado', 'aguardando-confirmacao'].includes(status);
                    })
                    .map(doc => {
                        const data = doc.data();
                        const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
                        const hours = appointmentDate.getHours().toString().padStart(2, '0');
                        const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                    });

                setBookedSlots(slots);
            } catch (error: any) {
                console.error('Error fetching booked slots:', error);
                setBookedSlots([]);
            }
        };

        fetchBookedSlots();
    }, [selectedDoctor, selectedDate]);

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            return;
        }

        // Check if selected date is a weekend
        const appointmentDate = new Date(`${selectedDate}T${selectedTime}`);
        const dayOfWeek = appointmentDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            alert('Não é possível agendar consultas aos sábados e domingos.');
            return;
        }

        setLoading(true);

        try {
            const endDate = new Date(appointmentDate.getTime() + 30 * 60000);

            const appointmentData = {
                clinicId: user.clinicId,
                doctorId: selectedDoctor,
                patientId: selectedPatient,
                bookedBy: user.id,
                date: appointmentDate,
                endDate: endDate,
                duration: 30,
                type: appointmentType,
                convenioId: appointmentType === 'convenio' ? selectedConvenio : null,
                status: 'agendado',
                statusHistory: [{
                    status: 'agendado',
                    changedAt: new Date(),
                    changedBy: user.id
                }],
                confirmed: false,
                remindersSent: [],
                notes: notes,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1
            };

            await addDoc(collection(db, 'appointments'), appointmentData);
            router.push('/appointments');
        } catch (error: any) {
            console.error('Error creating appointment:', error);

            let errorMessage = 'Erro ao criar agendamento. ';
            if (error.code === 'permission-denied') {
                errorMessage += 'Permissão negada. Verifique suas credenciais.';
            } else {
                errorMessage += error.message || 'Tente novamente.';
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Agendar Consulta"
                description="Marque uma nova consulta"
                backButton={true}
            />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Only show patient selection for admin and secretary */}
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <div className="space-y-2">
                                    <Label htmlFor="patient">Paciente</Label>
                                    <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione um paciente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map((patient) => (
                                                <SelectItem key={patient.id} value={patient.id}>
                                                    {patient.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="doctor">Médico</Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um médico" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((doctor) => (
                                            <SelectItem key={doctor.id} value={doctor.id}>
                                                {doctor.name} - {doctor.crm}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Data</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    className="w-full"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const date = new Date(e.target.value + 'T00:00:00');
                                        const dayOfWeek = date.getDay();
                                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                                            alert('Não é possível agendar consultas aos sábados e domingos.');
                                            setSelectedDate('');
                                            return;
                                        }
                                        setSelectedDate(e.target.value);
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Agendamentos disponíveis apenas de segunda a sexta-feira
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">Horário</Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime} required>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um horário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generateTimeSlots()
                                            .filter(time => !bookedSlots.includes(time))
                                            .map((time) => (
                                                <SelectItem key={time} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        {generateTimeSlots().filter(time => !bookedSlots.includes(time)).length === 0 && (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                Nenhum horário disponível para esta data
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Consulta</Label>
                                <Select value={appointmentType} onValueChange={(value: any) => setAppointmentType(value)} required>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="particular">Particular</SelectItem>
                                        <SelectItem value="convenio">Convênio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {appointmentType === 'convenio' && (
                                <div className="space-y-2">
                                    <Label htmlFor="convenio">Convênio</Label>
                                    <Select value={selectedConvenio} onValueChange={setSelectedConvenio} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione um convênio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {convenios.map((convenio) => (
                                                <SelectItem key={convenio.id} value={convenio.id}>
                                                    {convenio.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações (opcional)</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    className="w-full"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Adicione informações relevantes sobre a consulta..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push('/')}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Agendamento
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
