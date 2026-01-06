'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        consentData: false,
        consentWhatsApp: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (!formData.consentData) {
            setError('Você deve aceitar o armazenamento de dados');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await setDoc(doc(db, 'patients', userCredential.user.uid), {
                id: userCredential.user.uid,
                clinicId: 'demo_clinic',
                userId: userCredential.user.uid,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                consent: {
                    dataStorage: formData.consentData,
                    whatsappNotifications: formData.consentWhatsApp,
                    consentDate: Timestamp.now(),
                },
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                active: true,
            });

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                id: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                role: 'patient',
                clinicId: 'demo_clinic',
                patientId: userCredential.user.uid,
                active: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            router.push('/');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Criar Conta
                        </h1>
                        <p className="text-gray-600">Cadastre-se como paciente</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Completo *
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="João Silva"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="joao@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Telefone (WhatsApp) *
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="+5511999999999"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha *
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Senha *
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="Digite a senha novamente"
                            />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-200">
                            <div className="flex items-start">
                                <input
                                    id="consentData"
                                    type="checkbox"
                                    checked={formData.consentData}
                                    onChange={(e) => setFormData({ ...formData, consentData: e.target.checked })}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="consentData" className="ml-3 text-sm text-gray-700">
                                    Aceito o armazenamento dos meus dados conforme a LGPD *
                                </label>
                            </div>

                            <div className="flex items-start">
                                <input
                                    id="consentWhatsApp"
                                    type="checkbox"
                                    checked={formData.consentWhatsApp}
                                    onChange={(e) => setFormData({ ...formData, consentWhatsApp: e.target.checked })}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="consentWhatsApp" className="ml-3 text-sm text-gray-700">
                                    Aceito receber notificações via WhatsApp
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                            Já tem uma conta? Faça login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Este email já está em uso';
        case 'auth/invalid-email':
            return 'Email inválido';
        case 'auth/weak-password':
            return 'Senha muito fraca';
        default:
            return 'Erro ao criar conta. Tente novamente';
    }
}
