'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { addToWaitlist } from '@/lib/actions/waitlist';

export default function NewWaitlistPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        patientId: '',
        specialty: '',
        doctorId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (!user?.clinicId) return;

        const fetchData = async () => {
            const patientsSnap = await getDocs(
                query(collection(db, 'patients'), where('clinicId', '==', user.clinicId), where('active', '==', true))
            );
            const patientsData = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatients(patientsData);

            const doctorsSnap = await getDocs(
                query(collection(db, 'doctors'), where('clinicId', '==', user.clinicId), where('active', '==', true))
            );
            const doctorsData = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDoctors(doctorsData);
        };

        fetchData();
    }, [user?.clinicId]);

    if (!user || !['admin', 'secretary'].includes(user.role)) {
        router.push('/waitlist');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.patientId || !formData.specialty || !formData.startDate || !formData.endDate) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                setLoading(false);
                return;
            }

            const result = await addToWaitlist({
                clinicId: user.clinicId,
                patientId: formData.patientId,
                specialty: formData.specialty,
                doctorId: formData.doctorId || undefined,
                preferredDateRange: {
                    start: new Date(formData.startDate),
                    end: new Date(formData.endDate)
                }
            });

            if (result.success) {
                router.push('/waitlist');
            } else {
                alert('Erro ao adicionar à lista de espera. Tente novamente.');
            }
        } catch (error) {
            console.error('Error adding to waitlist:', error);
            alert('Erro ao adicionar à lista de espera. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getSpecialties = () => {
        const specialtiesSet = new Set<string>();
        doctors.forEach(doctor => {
            doctor.specialties?.forEach((specialty: string) => {
                specialtiesSet.add(specialty);
            });
        });
        return Array.from(specialtiesSet).sort();
    };

    const specialties = getSpecialties();

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Adicionar à Lista de Espera"
                description="Adicione um paciente à lista de espera para ser notificado quando houver cancelamentos"
                backButton={true}
            />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="patientId">Paciente *</Label>
                                <select
                                    id="patientId"
                                    required
                                    value={formData.patientId}
                                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Selecione um paciente</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name} - {patient.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialty">Especialidade *</Label>
                                <select
                                    id="specialty"
                                    required
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Selecione uma especialidade</option>
                                    {specialties.map((specialty) => (
                                        <option key={specialty} value={specialty}>
                                            {specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="doctorId">Médico Preferido (Opcional)</Label>
                                <select
                                    id="doctorId"
                                    value={formData.doctorId}
                                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Qualquer médico da especialidade</option>
                                    {doctors
                                        .filter(doctor => doctor.specialties?.includes(formData.specialty))
                                        .map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                Dr(a). {doctor.name}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Se não especificar, o paciente será notificado para qualquer médico da especialidade
                                </p>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Período Preferido</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Data Inicial *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            required
                                            className="w-full"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Data Final *</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            required
                                            className="w-full"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    O paciente será notificado apenas de horários disponíveis dentro deste período
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push('/waitlist')}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Adicionar à Lista
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
