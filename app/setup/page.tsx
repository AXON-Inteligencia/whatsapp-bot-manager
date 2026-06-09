"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao configurar administrador.");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-10 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Configuração Inicial</h1>
          <p className="text-slate-500 text-sm mt-2">Defina seu e-mail e senha de administrador</p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center">
            <p className="font-bold text-lg mb-2">Sucesso!</p>
            <p>Administrador configurado. Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Novo E-mail ADM</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-green-500 outline-none transition-all"
                placeholder="ex: voce@axoninteligencia.com.br"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-green-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirme a Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-green-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Configurando..." : "Salvar Configurações"}
            </button>
            
            <button 
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              Voltar para o Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
