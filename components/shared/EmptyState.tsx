import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        href: string;
    };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
            <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{description}</p>
            {action && (
                <Link href={action.href}>
                    <Button>{action.label}</Button>
                </Link>
            )}
        </div>
    );
}
