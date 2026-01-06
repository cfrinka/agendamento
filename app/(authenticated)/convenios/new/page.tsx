'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function NewConvenioPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: ''
    });

    if (!user || user.role !== 'admin') {
        router.push('/convenios');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'convenios'), {
                ...formData,
                clinicId: user.clinicId,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            router.push('/convenios');
        } catch (error) {
            console.error('Error creating convenio:', error);
            alert('Erro ao criar convênio. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Novo Convênio"
                description="Adicione um novo convênio aceito pela clínica"
                backButton={true}
            />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Convênio</Label>
                                <Input
                                    id="name"
                                    required
                                    className="w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Unimed, Amil, SulAmérica..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Código (opcional)</Label>
                                <Input
                                    id="code"
                                    className="w-full"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Código do convênio"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push('/convenios')}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Convênio
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
