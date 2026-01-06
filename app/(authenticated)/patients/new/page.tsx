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

export default function NewPatientPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        cpf: '',
        address: {
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: ''
        }
    });

    if (!user || !['admin', 'secretary'].includes(user.role)) {
        router.push('/patients');
        return null;
    }

    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');

        setFormData({
            ...formData,
            address: { ...formData.address, cep }
        });

        if (cleanCep.length === 8) {
            setLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormData({
                        ...formData,
                        address: {
                            cep,
                            street: data.logradouro || '',
                            number: '',
                            complement: data.complemento || '',
                            neighborhood: data.bairro || '',
                            city: data.localidade || '',
                            state: data.uf || ''
                        }
                    });
                } else {
                    alert('CEP não encontrado');
                }
            } catch (error) {
                console.error('Error fetching CEP:', error);
                alert('Erro ao buscar CEP. Tente novamente.');
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'patients'), {
                ...formData,
                clinicId: user.clinicId,
                active: true,
                consent: {
                    dataStorage: true,
                    whatsappNotifications: true,
                    consentDate: new Date()
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            router.push('/patients');
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Erro ao criar paciente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Novo Paciente"
                description="Adicione um novo paciente à clínica"
                backButton={true}
            />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    required
                                    className="w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Maria Santos"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    className="w-full"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(11) 98765-4321"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="maria.santos@email.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    className="w-full"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-4">Endereço</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cep">CEP</Label>
                                        <div className="relative">
                                            <Input
                                                id="cep"
                                                className="w-full"
                                                value={formData.address.cep}
                                                onChange={(e) => handleCepChange(e.target.value)}
                                                placeholder="00000-000"
                                                maxLength={9}
                                            />
                                            {loadingCep && (
                                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">Estado</Label>
                                        <Input
                                            id="state"
                                            className="w-full"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, state: e.target.value }
                                            })}
                                            placeholder="SP"
                                            maxLength={2}
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="street">Logradouro</Label>
                                        <Input
                                            id="street"
                                            className="w-full"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, street: e.target.value }
                                            })}
                                            placeholder="Rua, Avenida, etc."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="number">Número</Label>
                                        <Input
                                            id="number"
                                            className="w-full"
                                            value={formData.address.number}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, number: e.target.value }
                                            })}
                                            placeholder="123"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="complement">Complemento</Label>
                                        <Input
                                            id="complement"
                                            className="w-full"
                                            value={formData.address.complement}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, complement: e.target.value }
                                            })}
                                            placeholder="Apto, Bloco, etc."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="neighborhood">Bairro</Label>
                                        <Input
                                            id="neighborhood"
                                            className="w-full"
                                            value={formData.address.neighborhood}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, neighborhood: e.target.value }
                                            })}
                                            placeholder="Centro"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input
                                            id="city"
                                            className="w-full"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, city: e.target.value }
                                            })}
                                            placeholder="São Paulo"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push('/patients')}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Paciente
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
