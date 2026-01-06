'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        href: string;
        icon?: LucideIcon;
    };
    backButton?: boolean;
}

export function PageHeader({ title, description, action, backButton = true }: PageHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        {description && (
                            <p className="text-sm text-gray-600">{description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {backButton && (
                            <Link href="/">
                                <Button variant="outline">Voltar</Button>
                            </Link>
                        )}
                        {action && (
                            <Link href={action.href}>
                                <Button>
                                    {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                                    {action.label}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
