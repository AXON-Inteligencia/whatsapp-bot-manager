import { Suspense } from "react"
import BotsPageClient from "./page.client"

export const dynamic = 'force-dynamic'

export default function BotsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <BotsPageClient />
    </Suspense>
  )
}
