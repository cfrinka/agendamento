import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Stethoscope } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <Card className="max-w-2xl w-full">
                <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="text-9xl font-bold text-primary/20">404</div>
                                <Stethoscope className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-foreground">
                                Página Não Encontrada
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Desculpe, não conseguimos encontrar a página que você está procurando.
                            </p>
                            <p className="text-muted-foreground">
                                A página pode ter sido movida, excluída ou nunca existiu.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Button
                                onClick={() => window.history.back()}
                                variant="outline"
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                            <Link href="/">
                                <Button className="gap-2 w-full sm:w-auto">
                                    <Home className="w-4 h-4" />
                                    Ir para o Dashboard
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-8 border-t mt-8">
                            <p className="text-sm text-muted-foreground">
                                Se você acredita que isso é um erro, entre em contato com o suporte.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
