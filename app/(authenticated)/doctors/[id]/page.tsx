'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';

export default function DoctorDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        crm: '',
        specialties: '',
        phone: '',
        email: '',
        color: '#3B82F6',
        active: true,
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

    useEffect(() => {
        const fetchDoctor = async () => {
            if (!params.id) return;

            try {
                const docRef = doc(db, 'doctors', params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setDoctor(data);
                    setFormData({
                        name: data.name || '',
                        crm: data.crm || '',
                        specialties: data.specialties?.join(', ') || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        color: data.color || '#3B82F6',
                        active: data.active ?? true,
                        address: data.address || {
                            cep: '',
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            city: '',
                            state: ''
                        }
                    });
                } else {
                    router.push('/doctors');
                }
            } catch (error) {
                console.error('Error fetching doctor:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [params.id, router]);

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
                            number: formData.address.number,
                            complement: data.complemento || formData.address.complement,
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

    const handleSave = async () => {
        if (!user || !params.id) return;
        setSaving(true);

        try {
            await updateDoc(doc(db, 'doctors', params.id as string), {
                ...formData,
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
                updatedAt: new Date()
            });

            const docRef = doc(db, 'doctors', params.id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDoctor({ id: docSnap.id, ...docSnap.data() });
            }

            setEditing(false);
        } catch (error) {
            console.error('Error updating doctor:', error);
            alert('Erro ao atualizar médico. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !params.id || !confirm('Tem certeza que deseja excluir este médico?')) return;

        try {
            await deleteDoc(doc(db, 'doctors', params.id as string));
            router.push('/doctors');
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert('Erro ao excluir médico. Tente novamente.');
        }
    };

    if (!user) return null;
    if (loading) return <LoadingState message="Carregando detalhes do médico..." />;
    if (!doctor) return null;

    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title={editing ? 'Editar Médico' : doctor.name}
                description={editing ? 'Atualize as informações do médico' : doctor.crm}
                backButton={true}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Informações do Médico</CardTitle>
                            {isAdmin && !editing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setEditing(true)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            )}
                            {editing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setEditing(false)}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {editing ? (
                            <>
                                <div>
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="crm">CRM</Label>
                                    <Input
                                        id="crm"
                                        value={formData.crm}
                                        onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                                    <Input
                                        id="specialties"
                                        value={formData.specialties}
                                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="color">Cor do Avatar</Label>
                                    <Input
                                        id="color"
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="active">Médico ativo</Label>
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-lg font-semibold mb-4">Endereço</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="cep">CEP</Label>
                                            <div className="relative">
                                                <Input
                                                    id="cep"
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

                                        <div>
                                            <Label htmlFor="state">Estado</Label>
                                            <Input
                                                id="state"
                                                value={formData.address.state}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, state: e.target.value }
                                                })}
                                                placeholder="SP"
                                                maxLength={2}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label htmlFor="street">Logradouro</Label>
                                            <Input
                                                id="street"
                                                value={formData.address.street}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, street: e.target.value }
                                                })}
                                                placeholder="Rua, Avenida, etc."
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="number">Número</Label>
                                            <Input
                                                id="number"
                                                value={formData.address.number}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, number: e.target.value }
                                                })}
                                                placeholder="123"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="complement">Complemento</Label>
                                            <Input
                                                id="complement"
                                                value={formData.address.complement}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, complement: e.target.value }
                                                })}
                                                placeholder="Sala, Andar, etc."
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="neighborhood">Bairro</Label>
                                            <Input
                                                id="neighborhood"
                                                value={formData.address.neighborhood}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, neighborhood: e.target.value }
                                                })}
                                                placeholder="Centro"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="city">Cidade</Label>
                                            <Input
                                                id="city"
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
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                                        style={{ backgroundColor: doctor.color || '#3B82F6' }}
                                    >
                                        {doctor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{doctor.name}</h2>
                                        <p className="text-muted-foreground">{doctor.crm}</p>
                                        <Badge variant={doctor.active ? "default" : "secondary"} className="mt-2">
                                            {doctor.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label className="text-muted-foreground">Especialidades</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {doctor.specialties?.map((specialty: string, index: number) => (
                                                <Badge key={index} variant="outline">
                                                    {specialty}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {doctor.phone && (
                                        <div>
                                            <Label className="text-muted-foreground">Telefone</Label>
                                            <p className="mt-2">{doctor.phone}</p>
                                        </div>
                                    )}

                                    {doctor.email && (
                                        <div>
                                            <Label className="text-muted-foreground">Email</Label>
                                            <p className="mt-2">{doctor.email}</p>
                                        </div>
                                    )}
                                </div>

                                {doctor.address && (doctor.address.street || doctor.address.cep) && (
                                    <div className="border-t pt-6 mt-6">
                                        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {doctor.address.cep && (
                                                <div>
                                                    <Label className="text-muted-foreground">CEP</Label>
                                                    <p className="mt-2">{doctor.address.cep}</p>
                                                </div>
                                            )}
                                            {doctor.address.street && (
                                                <div className="md:col-span-2">
                                                    <Label className="text-muted-foreground">Endereço</Label>
                                                    <p className="mt-2">
                                                        {doctor.address.street}
                                                        {doctor.address.number && `, ${doctor.address.number}`}
                                                        {doctor.address.complement && ` - ${doctor.address.complement}`}
                                                    </p>
                                                </div>
                                            )}
                                            {doctor.address.neighborhood && (
                                                <div>
                                                    <Label className="text-muted-foreground">Bairro</Label>
                                                    <p className="mt-2">{doctor.address.neighborhood}</p>
                                                </div>
                                            )}
                                            {doctor.address.city && (
                                                <div>
                                                    <Label className="text-muted-foreground">Cidade</Label>
                                                    <p className="mt-2">{doctor.address.city} - {doctor.address.state}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
