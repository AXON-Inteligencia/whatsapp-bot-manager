"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Edit2, Plus, X, Check } from "lucide-react"

const AUTH_KEY = "whatsapp-admin-auth"

interface AppUser {
  id: string
  name: string
  email: string
  role: string
  plan?: string
  paymentStatus?: string
}

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  activeBots: number
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [plan, setPlan] = useState("starter")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("user")
  const [editPlan, setEditPlan] = useState("starter")
  const [editPassword, setEditPassword] = useState("")
  const [editPaymentStatus, setEditPaymentStatus] = useState("pending")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeSubscriptions: 0, activeBots: 0 })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/login")
        }
        return
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Erro ao buscar usuários:", err)
    }
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Todos os campos são obrigatórios.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, plan, paymentStatus: "paid" }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || "Erro ao criar usuário.")
        setLoading(false)
        return
      }

      setName("")
      setEmail("")
      setPassword("")
      setRole("user")
      setPlan("starter")
      setMessage("✓ Usuário criado com sucesso!")
      setTimeout(() => setMessage(null), 3000)
      fetchUsers()
    } catch (err) {
      setError("Erro ao conectar ao servidor.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setError("Erro ao remover usuário.")
        setLoading(false)
        return
      }

      setMessage("✓ Usuário removido com sucesso!")
      setTimeout(() => setMessage(null), 3000)
      setDeleteConfirmId(null)
      fetchUsers()
    } catch (err) {
      setError("Erro ao conectar ao servidor.")
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (user: AppUser) => {
    setEditingId(user.id)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditPlan(user.plan || "free")
    setEditPaymentStatus(user.paymentStatus || "pending")
    setEditPassword("")
  }

  const handleUpdateUser = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      setError("Nome e email são obrigatórios.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName,
          email: editEmail,
          role: editRole,
          plan: editPlan,
          paymentStatus: editPaymentStatus,
          ...(editPassword && { password: editPassword }),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || "Erro ao atualizar usuário.")
        setLoading(false)
        return
      }

      setMessage("✓ Usuário atualizado com sucesso!")
      setTimeout(() => setMessage(null), 3000)
      setEditingId(null)
      fetchUsers()
    } catch (err) {
      setError("Erro ao conectar ao servidor.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem(AUTH_KEY)
    router.push("/login")
  }

  return (
    <DashboardLayout
      title="Administração"
      description="Painel de controle administrativo para gerenciar usuários da plataforma."
    >
      <div className="flex flex-col gap-8">
        {/* Header com Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Gerenciamento de Usuários
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione, edite ou remova usuários da plataforma
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50"
          >
            Sair
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total de Usuários (Clientes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">Registrados na plataforma</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Assinaturas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{stats.activeSubscriptions}</div>
              <p className="text-xs text-emerald-600 mt-1">Planos com pagamento em dia</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Bots em Operação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.activeBots}</div>
              <p className="text-xs text-purple-600 mt-1">Instâncias ativas conectadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <div className="text-red-500 mt-0.5">⚠</div>
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <Check size={18} className="text-emerald-600" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Card de Criar Novo Usuário */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Plus size={20} className="text-emerald-600" />
              <CardTitle className="text-emerald-900">Adicionar Novo Usuário</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:items-end">
              <div>
                <Label htmlFor="user-name" className="text-sm font-semibold text-slate-700">
                  Nome
                </Label>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="mt-1.5 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="user-email" className="text-sm font-semibold text-slate-700">
                  Email
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="mt-1.5 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="user-password" className="text-sm font-semibold text-slate-700">
                  Senha
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha segura"
                  className="mt-1.5 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="user-role" className="text-sm font-semibold text-slate-700">
                  Função
                </Label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <Label htmlFor="user-plan" className="text-sm font-semibold text-slate-700">
                  Plano
                </Label>
                <select
                  id="user-plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full lg:w-auto"
              >
                {loading ? "Criando..." : "Criar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card de Usuários Cadastrados */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Usuários Cadastrados ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Plano Atual</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Função</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">{user.name}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{user.email}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase text-slate-700 bg-slate-100 px-2 py-1 rounded w-max">
                              {user.plan || "Free"}
                            </span>
                            <span className={`text-[10px] uppercase font-bold w-max ${user.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {user.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role === "admin" ? "👑 Admin" : "👤 Usuário"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edição */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white">
              <CardHeader className="border-b border-slate-200">
                <CardTitle>Editar Usuário</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Nome</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 border-slate-300 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1.5 border-slate-300 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Função</Label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-emerald-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Plano</Label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-emerald-500"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Status do Pagamento</Label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-emerald-500"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Nova Senha (deixe em branco para manter)
                  </Label>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Deixe em branco para manter a senha"
                    className="mt-1.5 border-slate-300 focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setEditingId(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white">
              <CardHeader className="border-b border-red-200">
                <CardTitle className="text-red-600">Confirmar Exclusão</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-slate-700 mb-6">
                  Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setDeleteConfirmId(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(deleteConfirmId)}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? "Removendo..." : "Remover"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
