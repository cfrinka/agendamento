'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DoctorCard } from '@/components/doctors/DoctorCard';

export default function DoctorsPage() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user?.clinicId) return;

        const q = query(
            collection(db, 'doctors'),
            where('clinicId', '==', user.clinicId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const doctorsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDoctors(doctorsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId]);

    if (!user) return null;

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.crm.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Médicos"
                description="Gerencie os médicos da clínica"
                action={user.role === 'admin' ? {
                    label: 'Novo Médico',
                    href: '/doctors/new',
                    icon: Plus
                } : undefined}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por nome ou CRM..."
                    />
                </div>

                {loading ? (
                    <LoadingState message="Carregando médicos..." />
                ) : filteredDoctors.length === 0 ? (
                    <EmptyState
                        icon={Stethoscope}
                        title="Nenhum médico encontrado"
                        description={searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando médicos à clínica'}
                        action={user.role === 'admin' && !searchTerm ? {
                            label: 'Adicionar Primeiro Médico',
                            href: '/doctors/new'
                        } : undefined}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doctor) => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
