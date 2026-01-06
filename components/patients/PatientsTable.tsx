import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
    active: boolean;
}

interface PatientsTableProps {
    patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map((patient) => (
                        <TableRow key={patient.id}>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>{patient.phone}</TableCell>
                            <TableCell>{patient.email || '-'}</TableCell>
                            <TableCell>
                                <Badge variant={patient.active ? "default" : "secondary"}>
                                    {patient.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/patients/${patient.id}`}>
                                    <Button variant="ghost" size="sm">
                                        Ver Detalhes
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
