"use client";

import { useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Users, ArrowRight } from 'lucide-react';

export default function TelegramScraperPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    // Simulação do backend para fins de visualização rápida
    setTimeout(() => {
      setResults([
        `https://t.me/joinchat/crypto_brasil_${Math.floor(Math.random() * 1000)}`,
        `https://t.me/joinchat/investimentos_oficial`,
        `https://t.me/marketing_digital_vip`,
        `https://t.me/joinchat/vendas_online_${Math.floor(Math.random() * 1000)}`,
        `https://t.me/empreendedorismo_br`,
      ]);
      setLoading(false);
    }, 2500);
  };

  return (
    <DashboardLayout
      title="Extrator de Grupos Telegram"
      description="Busque e extraia grupos do Telegram de qualquer nicho para a sua IA invadir e divulgar."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Busca */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Motor de Busca (Dorks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="keyword">Nicho ou Palavra-Chave</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Ex: Emagrecimento, Cripto, Vendas..."
                    className="mt-1 bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O sistema fará uma varredura profunda no Google e diretórios do Telegram buscando links de convite públicos.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !keyword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extraindo Grupos...
                    </>
                  ) : (
                    'Iniciar Varredura'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Grupos Encontrados ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum grupo extraído ainda.</p>
                  <p className="text-sm">Digite uma palavra-chave e inicie a varredura.</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-blue-400">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                  <p className="animate-pulse">Hackeando diretórios públicos...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors">
                      <div className="truncate pr-4 text-sm text-blue-400">
                        {link}
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 border-green-500/50 hover:bg-green-500/10 text-green-400">
                        Entrar com a IA <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-border mt-4">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Entrar em Todos (Modo Agressivo)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </DashboardLayout>
  );
}
