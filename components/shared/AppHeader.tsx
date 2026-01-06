'use client';

import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogOut, Wrench, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { fixPatientProfile } from '@/lib/fixPatientProfile';
import { toast } from 'sonner';

export function AppHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const [fixingPatient, setFixingPatient] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleFixPatientProfile = async () => {
        if (!user?.id || !user?.clinicId || !user?.email || !user?.name) {
            toast.error('Dados do usuário incompletos');
            return;
        }

        if (!confirm('Isso criará um perfil de paciente e vinculará à sua conta. Continuar?')) {
            return;
        }

        setFixingPatient(true);

        try {
            const result = await fixPatientProfile(user.id, user.clinicId, user.email, user.name);
            if (result.success) {
                toast.success(`Perfil de paciente criado com sucesso! ID: ${result.patientId}`);
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error(`Erro: ${result.error}`);
            }
        } catch (error: any) {
            toast.error(`Erro ao corrigir perfil: ${error.message}`);
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
        <header className="bg-gradient-to-r from-cyan-600 to-teal-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-5">
                    <div className="flex items-center gap-4">
                        <img
                            src="/assets/logo.png"
                            alt="Clinix"
                            className="h-12 w-auto"
                        />
                        <div>
                            <p className="text-md text-cyan-100 font-semibold">
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
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all font-medium shadow-sm"
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
