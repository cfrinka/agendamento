'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Login realizado com sucesso!');
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            toast.error(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src="/assets/logo.png"
                                alt="Clinix"
                                className="h-16 w-auto"
                            />
                        </div>
                        <p className="text-gray-600">Entre com suas credenciais</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-cyan-700 hover:to-teal-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/register" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                            Não tem uma conta? Cadastre-se
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Clinix - Sistema de Gestão de Consultas
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/user-not-found':
            return 'Usuário não encontrado';
        case 'auth/wrong-password':
            return 'Senha incorreta';
        case 'auth/invalid-email':
            return 'Email inválido';
        case 'auth/too-many-requests':
            return 'Muitas tentativas. Tente novamente mais tarde';
        case 'auth/invalid-credential':
            return 'Credenciais inválidas';
        default:
            return 'Erro ao fazer login. Tente novamente';
    }
}
