'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Calendar, Users, Stethoscope, FileText, Settings, LogOut } from 'lucide-react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                🏥 Agendamento Médico
                            </h1>
                            <p className="text-sm text-gray-600">
                                Bem-vindo, {user.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {getRoleLabel(user.role)}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Role-specific dashboard */}
                {user.role === 'admin' && <AdminDashboard />}
                {user.role === 'secretary' && <SecretaryDashboard />}
                {user.role === 'doctor' && <DoctorDashboard />}
                {user.role === 'patient' && <PatientDashboard />}
            </div>
        </div>
    );
}

function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Painel Administrativo
                </h2>
                <p className="text-gray-600">
                    Gerencie toda a clínica a partir daqui
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-blue-600" />}
                    title="Agenda"
                    description="Visualizar e gerenciar consultas"
                    href="/calendar"
                    color="blue"
                />
                <DashboardCard
                    icon={<Stethoscope className="w-8 h-8 text-green-600" />}
                    title="Médicos"
                    description="Gerenciar médicos e disponibilidade"
                    href="/doctors"
                    color="green"
                />
                <DashboardCard
                    icon={<Users className="w-8 h-8 text-purple-600" />}
                    title="Pacientes"
                    description="Gerenciar cadastro de pacientes"
                    href="/patients"
                    color="purple"
                />
                <DashboardCard
                    icon={<FileText className="w-8 h-8 text-orange-600" />}
                    title="Convênios"
                    description="Gerenciar planos de saúde"
                    href="/convenios"
                    color="orange"
                />
                <DashboardCard
                    icon={<FileText className="w-8 h-8 text-red-600" />}
                    title="Relatórios"
                    description="Visualizar métricas e estatísticas"
                    href="/reports"
                    color="red"
                />
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-gray-600" />}
                    title="Agendar Consulta"
                    description="Criar nova consulta"
                    href="/book"
                    color="gray"
                />
            </div>
        </div>
    );
}

function SecretaryDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Painel da Secretária
                </h2>
                <p className="text-gray-600">
                    Gerencie consultas e pacientes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-blue-600" />}
                    title="Agenda"
                    description="Visualizar e criar consultas"
                    href="/calendar"
                    color="blue"
                />
                <DashboardCard
                    icon={<Users className="w-8 h-8 text-purple-600" />}
                    title="Pacientes"
                    description="Gerenciar pacientes"
                    href="/patients"
                    color="purple"
                />
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-green-600" />}
                    title="Agendar Consulta"
                    description="Criar nova consulta"
                    href="/book"
                    color="green"
                />
            </div>
        </div>
    );
}

function DoctorDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Minha Agenda
                </h2>
                <p className="text-gray-600">
                    Visualize suas consultas
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-blue-600" />}
                    title="Agenda do Dia"
                    description="Ver consultas de hoje"
                    href="/calendar"
                    color="blue"
                />
                <DashboardCard
                    icon={<FileText className="w-8 h-8 text-gray-600" />}
                    title="Minhas Consultas"
                    description="Ver consultas agendadas"
                    href="/appointments"
                    color="gray"
                />
            </div>
        </div>
    );
}

function PatientDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Minhas Consultas
                </h2>
                <p className="text-gray-600">
                    Gerencie seus agendamentos
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                    icon={<Calendar className="w-8 h-8 text-blue-600" />}
                    title="Agendar Consulta"
                    description="Marcar nova consulta"
                    href="/book"
                    color="blue"
                />
                <DashboardCard
                    icon={<FileText className="w-8 h-8 text-purple-600" />}
                    title="Minhas Consultas"
                    description="Ver consultas agendadas"
                    href="/appointments"
                    color="purple"
                />
            </div>
        </div>
    );
}

function DashboardCard({
    icon,
    title,
    description,
    href,
    color
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: string;
}) {
    const colorClasses = {
        blue: 'hover:border-blue-300 hover:shadow-blue-100',
        green: 'hover:border-green-300 hover:shadow-green-100',
        purple: 'hover:border-purple-300 hover:shadow-purple-100',
        orange: 'hover:border-orange-300 hover:shadow-orange-100',
        red: 'hover:border-red-300 hover:shadow-red-100',
        gray: 'hover:border-gray-300 hover:shadow-gray-100',
    };

    return (
        <Link href={href}>
            <div className={`bg-white rounded-lg border-2 border-gray-200 p-6 transition-all cursor-pointer ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-lg`}>
                <div className="mb-4">{icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </Link>
    );
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        admin: 'Administrador',
        secretary: 'Secretária',
        doctor: 'Médico',
        patient: 'Paciente',
    };
    return labels[role] || role;
}
