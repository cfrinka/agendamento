'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { FileText, Calendar, TrendingUp, Users } from 'lucide-react';

export default function ReportsPage() {
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600 mb-4">Apenas administradores podem acessar relatórios</p>
                    <Link href="/">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Voltar ao Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                            <p className="text-sm text-gray-600">
                                Visualize métricas e estatísticas da clínica
                            </p>
                        </div>
                        <Link href="/">
                            <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                Voltar
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mês
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                {months.map((month, index) => (
                                    <option key={index} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ano
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                {[2024, 2025, 2026].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
                        <p className="text-sm text-gray-600">Total de Consultas</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0%</h3>
                        <p className="text-sm text-gray-600">Taxa de Comparecimento</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
                        <p className="text-sm text-gray-600">Novos Pacientes</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
                        <p className="text-sm text-gray-600">Consultas por Convênio</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Relatório Detalhado
                    </h2>
                    <p className="text-gray-600 text-center py-12">
                        Nenhum dado disponível para o período selecionado.
                    </p>
                </div>
            </div>
        </div>
    );
}
