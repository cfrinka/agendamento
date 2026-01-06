'use client';

import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogOut, UserPlus, Wrench, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createSampleUsers } from '@/lib/createSampleUsers';
import { fixPatientProfile } from '@/lib/fixPatientProfile';

export function AppHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const [sampleUsersLoading, setSampleUsersLoading] = useState(false);
    const [fixingPatient, setFixingPatient] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleCreateSampleUsers = async () => {
        if (!user?.clinicId) {
            alert('Você precisa estar associado a uma clínica primeiro!');
            return;
        }

        if (!confirm('Isso criará 4 usuários de exemplo:\n\n- admin@admin.com\n- secretary@secretary.com\n- doctor@doctor.com\n- patient@patient.com\n\nSenha para todos: Testp@ss123\n\nContinuar?')) {
            return;
        }

        setSampleUsersLoading(true);

        try {
            await createSampleUsers(user.clinicId);
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setSampleUsersLoading(false);
        }
    };

    const handleFixPatientProfile = async () => {
        if (!user?.id || !user?.clinicId || !user?.email || !user?.name) {
            alert('Dados do usuário incompletos');
            return;
        }

        if (!confirm('Isso criará um perfil de paciente e vinculará à sua conta. Continuar?')) {
            return;
        }

        setFixingPatient(true);

        try {
            const result = await fixPatientProfile(user.id, user.clinicId, user.email, user.name);
            if (result.success) {
                alert(`Perfil de paciente criado com sucesso!\n\nPatient ID: ${result.patientId}\n\nRecarregando página...`);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Erro ao corrigir perfil: ${error.message}`);
        } finally {
            setFixingPatient(false);
        }
    };

    const getRoleLabel = (role: string): string => {
        const labels: Record<string, string> = {
            admin: 'Administrador',
            secretary: 'Secretária',
            doctor: 'Médico',
            patient: 'Paciente',
        };
        return labels[role] || role;
    };

    if (!user) return null;

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                            <span className="text-3xl">🏥</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Agendamento Médico
                            </h1>
                            <p className="text-md text-blue-100 font-semibold">
                                Bem-vindo(a), <span className="font-bold">{user.name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium border border-white/30">
                            {getRoleLabel(user.role)}
                        </span>
                        {user.role === 'patient' && !user.patientId && (
                            <button
                                onClick={handleFixPatientProfile}
                                disabled={fixingPatient}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-all border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {fixingPatient ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Wrench className="w-4 h-4" />
                                )}
                                Corrigir Perfil
                            </button>
                        )}
                        {user.role === 'admin' && (
                            <button
                                onClick={handleCreateSampleUsers}
                                disabled={sampleUsersLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-all border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sampleUsersLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                                Criar Usuários Exemplo
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium shadow-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
