import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ConvenioCardProps {
    convenio: {
        id: string;
        name: string;
        code?: string;
        active: boolean;
    };
}

export function ConvenioCard({ convenio }: ConvenioCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <Badge variant={convenio.active ? "default" : "secondary"}>
                        {convenio.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {convenio.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Código: {convenio.code || 'N/A'}
                </p>
                <Link href={`/convenios/${convenio.id}`} className="block">
                    <Button variant="outline" className="w-full">
                        Ver Detalhes
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
