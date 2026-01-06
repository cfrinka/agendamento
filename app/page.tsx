'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Calendar, Users, Stethoscope, FileText, Settings, LogOut, Database, CheckCircle, XCircle, Loader2, UserPlus, Wrench } from 'lucide-react';
import { demoDataService } from '@/lib/services/demoDataService';
import { fixPatientProfile } from '@/lib/fixPatientProfile';
import { AppHeader } from '@/components/shared/AppHeader';

export default function Home() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [sampleUsersLoading, setSampleUsersLoading] = useState(false);
  const [sampleUsersResult, setSampleUsersResult] = useState<any>(null);
  const [fixingPatient, setFixingPatient] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleCreateDemoData = async () => {
    if (!firebaseUser) return;

    setDemoLoading(true);
    setDemoResult(null);

    try {
      const results = await demoDataService.createAllDemoData(firebaseUser.uid);
      setDemoResult(results);

      if (results.success) {
        // Reload page to update user role
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      setDemoResult({ success: false, error: error.message });
    } finally {
      setDemoLoading(false);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sample Users Result */}
        {sampleUsersResult && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${sampleUsersResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start gap-3">
              {sampleUsersResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${sampleUsersResult.success ? 'text-green-900' : 'text-yellow-900'}`}>
                  {sampleUsersResult.message}
                </h3>
                {sampleUsersResult.results && (
                  <div className="space-y-2 text-sm">
                    {sampleUsersResult.results.admin && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Admin:</span>
                        <code className="bg-white px-2 py-1 rounded">admin@admin.com</code>
                      </div>
                    )}
                    {sampleUsersResult.results.secretary && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Secretary:</span>
                        <code className="bg-white px-2 py-1 rounded">secretary@secretary.com</code>
                      </div>
                    )}
                    {sampleUsersResult.results.doctor && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Doctor:</span>
                        <code className="bg-white px-2 py-1 rounded">doctor@doctor.com</code>
                      </div>
                    )}
                    {sampleUsersResult.results.patient && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Patient:</span>
                        <code className="bg-white px-2 py-1 rounded">patient@patient.com</code>
                      </div>
                    )}
                    {sampleUsersResult.results.errors && sampleUsersResult.results.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="font-medium text-yellow-900 mb-1">Avisos:</p>
                        {sampleUsersResult.results.errors.map((error: string, idx: number) => (
                          <p key={idx} className="text-yellow-800 text-xs">{error}</p>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600">
                        <strong>Senha para todos:</strong> <code className="bg-white px-2 py-1 rounded">Testp@ss123</code>
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSampleUsersResult(null)}
                  className="mt-3 text-sm underline hover:no-underline"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

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
          icon={<Calendar className="w-8 h-8 text-blue-600" />}
          title="Agendar Consulta"
          description="Criar nova consulta"
          href="/book"
          color="blue"
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
