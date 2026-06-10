import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redireciona o acesso principal direto para o dashboard
  redirect('/dashboard')
}
