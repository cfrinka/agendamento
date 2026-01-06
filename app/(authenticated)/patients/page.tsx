'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PatientsTable } from '@/components/patients/PatientsTable';

export default function PatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user?.clinicId) return;

        const q = query(
            collection(db, 'patients'),
            where('clinicId', '==', user.clinicId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const patientsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPatients(patientsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId]);

    if (!user) return null;

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Pacientes"
                description="Gerencie os pacientes da clínica"
                action={['admin', 'secretary'].includes(user.role) ? {
                    label: 'Novo Paciente',
                    href: '/patients/new',
                    icon: Plus
                } : undefined}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por nome, telefone ou email..."
                    />
                </div>

                {loading ? (
                    <LoadingState message="Carregando pacientes..." />
                ) : filteredPatients.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Nenhum paciente encontrado"
                        description={searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando pacientes à clínica'}
                        action={['admin', 'secretary'].includes(user.role) && !searchTerm ? {
                            label: 'Adicionar Primeiro Paciente',
                            href: '/patients/new'
                        } : undefined}
                    />
                ) : (
                    <PatientsTable patients={filteredPatients} />
                )}
            </div>
        </div>
    );
}
