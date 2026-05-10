"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(result.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">
      {/* Imagem de Fundo Elegante */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-logo.png"
          alt="Background"
          fill
          className="object-cover opacity-20 blur-sm scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-emerald-50/60" />
      </div>

      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center p-10 border border-white relative z-10">
        <div className="mb-8 relative w-32 h-32 transform transition-transform hover:scale-110 duration-500">
          <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
          <Image
            src="/login-logo.png"
            alt="Axon Inteligência Logo"
            fill
            className="object-contain relative z-10"
            priority
          />
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 text-emerald-700">AxonFlow</h1>
          <p className="text-slate-500 font-medium">Automação Inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">E-mail de Acesso</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="admin@axoninteligencia.com.br"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Sua Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm py-3 px-4 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Acessar Dashboard"
            )}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button 
            type="button"
            onClick={() => router.push("/setup")}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold transition-colors"
          >
            Configurar acesso de administrador?
          </button>
          <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Powered by Axon Inteligência
          </div>
        </div>
      </div>
    </div>
  );
}
