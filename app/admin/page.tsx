"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AUTH_KEY = "whatsapp-admin-auth"

interface AppUser {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_KEY)
      if (!stored) {
        router.replace("/login")
        return
      }

      fetchUsers()
    }
  }, [router])

  const fetchUsers = async () => {
    const response = await fetch("/api/users")
    if (!response.ok) return
    const data = await response.json()
    setUsers(data)
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    const result = await response.json()
    if (!response.ok) {
      setError(result.error || "Erro ao criar usuário.")
      return
    }

    setName("")
    setEmail("")
    setPassword("")
    setMessage("Usuário criado com sucesso.")
    fetchUsers()
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    router.push("/login")
  }

  return (
    <DashboardLayout
      title="Admin"
      description="Área administrativa para gerenciar usuários da plataforma."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gerenciamento de usuários</h2>
            <p className="text-sm text-muted-foreground">Crie novos usuários e visualize a lista de contas cadastradas.</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="w-full sm:w-auto">
            Sair
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Adicionar novo usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid gap-4">
              <div>
                <Label htmlFor="user-name">Nome</Label>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="user-password">Senha</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Senha segura"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-success">{message}</p>}
              <Button type="submit" className="w-full sm:w-auto">
                Criar usuário
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Usuários cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex flex-col gap-1 py-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.role}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
