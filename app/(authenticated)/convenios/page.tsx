'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConvenioCard } from '@/components/convenios/ConvenioCard';

export default function ConveniosPage() {
    const { user } = useAuth();
    const [convenios, setConvenios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user?.clinicId) return;

        const q = query(
            collection(db, 'convenios'),
            where('clinicId', '==', user.clinicId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const conveniosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConvenios(conveniosData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.clinicId]);

    if (!user) return null;

    const filteredConvenios = convenios.filter(convenio =>
        convenio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        convenio.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Convênios"
                description="Gerencie os planos de saúde aceitos"
                action={user.role === 'admin' ? {
                    label: 'Novo Convênio',
                    href: '/convenios/new',
                    icon: Plus
                } : undefined}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por nome ou código..."
                    />
                </div>

                {loading ? (
                    <LoadingState message="Carregando convênios..." />
                ) : filteredConvenios.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Nenhum convênio encontrado"
                        description={searchTerm ? 'Tente buscar com outros termos' : 'Comece adicionando convênios aceitos pela clínica'}
                        action={user.role === 'admin' && !searchTerm ? {
                            label: 'Adicionar Primeiro Convênio',
                            href: '/convenios/new'
                        } : undefined}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConvenios.map((convenio) => (
                            <ConvenioCard key={convenio.id} convenio={convenio} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
