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

export default function ConvenioDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [convenio, setConvenio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        active: true
    });

    useEffect(() => {
        const fetchConvenio = async () => {
            if (!params.id) return;

            try {
                const docRef = doc(db, 'convenios', params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setConvenio(data);
                    setFormData({
                        name: data.name || '',
                        code: data.code || '',
                        active: data.active ?? true
                    });
                } else {
                    router.push('/convenios');
                }
            } catch (error) {
                console.error('Error fetching convenio:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConvenio();
    }, [params.id, router]);

    const handleSave = async () => {
        if (!user || !params.id) return;
        setSaving(true);

        try {
            await updateDoc(doc(db, 'convenios', params.id as string), {
                ...formData,
                updatedAt: new Date()
            });

            const docRef = doc(db, 'convenios', params.id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConvenio({ id: docSnap.id, ...docSnap.data() });
            }

            setEditing(false);
        } catch (error) {
            console.error('Error updating convenio:', error);
            alert('Erro ao atualizar convênio. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !params.id || !confirm('Tem certeza que deseja excluir este convênio?')) return;

        try {
            await deleteDoc(doc(db, 'convenios', params.id as string));
            router.push('/convenios');
        } catch (error) {
            console.error('Error deleting convenio:', error);
            alert('Erro ao excluir convênio. Tente novamente.');
        }
    };

    if (!user) return null;
    if (loading) return <LoadingState message="Carregando detalhes do convênio..." />;
    if (!convenio) return null;

    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title={editing ? 'Editar Convênio' : convenio.name}
                description={editing ? 'Atualize as informações do convênio' : convenio.code ? `Código: ${convenio.code}` : ''}
                backButton={true}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Informações do Convênio</CardTitle>
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
                                    <Label htmlFor="name">Nome do Convênio</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="code">Código</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                                    <Label htmlFor="active">Convênio ativo</Label>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{convenio.name}</h2>
                                    <Badge variant={convenio.active ? "default" : "secondary"}>
                                        {convenio.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>

                                {convenio.code && (
                                    <div>
                                        <Label className="text-muted-foreground">Código</Label>
                                        <p className="mt-2 text-lg">{convenio.code}</p>
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
