import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DoctorCardProps {
    doctor: {
        id: string;
        name: string;
        crm: string;
        specialties?: string[];
        color?: string;
        active: boolean;
    };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: doctor.color || '#3B82F6' }}
                    >
                        {doctor.name.charAt(0)}
                    </div>
                    <Badge variant={doctor.active ? "default" : "secondary"}>
                        {doctor.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {doctor.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{doctor.crm}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                    {doctor.specialties?.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                        </Badge>
                    ))}
                </div>
                <Link href={`/doctors/${doctor.id}`} className="block">
                    <Button variant="outline" className="w-full">
                        Ver Detalhes
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
