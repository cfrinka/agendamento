'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function NewDoctorPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        crm: '',
        specialties: '',
        phone: '',
        email: '',
        password: '',
        color: '#3B82F6',
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

    if (!user || user.role !== 'admin') {
        router.push('/doctors');
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
            // 1. Create Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const authUserId = userCredential.user.uid;

            // 2. Create doctor document
            const doctorRef = await addDoc(collection(db, 'doctors'), {
                name: formData.name,
                crm: formData.crm,
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
                phone: formData.phone,
                email: formData.email,
                color: formData.color,
                address: formData.address,
                clinicId: user.clinicId,
                userId: authUserId,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: user.id
            });

            // 3. Create user document with doctorId reference
            await setDoc(doc(db, 'users', authUserId), {
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                role: 'doctor',
                clinicId: user.clinicId,
                doctorId: doctorRef.id,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            alert('Médico cadastrado com sucesso! Ele já pode fazer login com o email e senha fornecidos.');
            router.push('/doctors');
        } catch (error: any) {
            console.error('Error creating doctor:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('Este email já está em uso. Por favor, use outro email.');
            } else if (error.code === 'auth/weak-password') {
                alert('A senha deve ter pelo menos 6 caracteres.');
            } else {
                alert('Erro ao criar médico. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Novo Médico"
                description="Adicione um novo médico à clínica"
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
                                    placeholder="Dr. João Silva"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="crm">CRM</Label>
                                <Input
                                    id="crm"
                                    required
                                    className="w-full"
                                    value={formData.crm}
                                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                                    placeholder="CRM/SP 123456"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                                <Input
                                    id="specialties"
                                    required
                                    className="w-full"
                                    value={formData.specialties}
                                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                                    placeholder="Cardiologia, Clínica Geral"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
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
                                    required
                                    className="w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="joao.silva@clinica.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha (mínimo 6 caracteres)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Esta senha será usada pelo médico para fazer login no sistema
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Cor do Avatar</Label>
                                <Input
                                    id="color"
                                    type="color"
                                    className="w-full"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
                                            placeholder="Sala, Andar, etc."
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
                                    onClick={() => router.push('/doctors')}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Médico
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
