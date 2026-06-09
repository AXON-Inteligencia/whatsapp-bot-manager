"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useBotSync } from "@/hooks/use-bot-sync"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface QRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  botId: string | null
  onConnected?: () => void
}

export function QRDialog({ open, onOpenChange, botId, onConnected }: QRDialogProps) {
  const { status, qr, isLoading, error } = useBotSync(botId, open)
  const [hasConnected, setHasConnected] = useState(false)

  useEffect(() => {
    if (status === "online" && !hasConnected) {
      setHasConnected(true)
      toast.success("WhatsApp conectado com sucesso! 🎉")
      onConnected?.()
      
      // Fechar diálogo após 2 segundos
      setTimeout(() => {
        onOpenChange(false)
        setHasConnected(false)
      }, 2000)
    }
  }, [status, hasConnected, onOpenChange, onConnected])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-primary/20 bg-background/95 backdrop-blur-3xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-glow text-center">Conectar WhatsApp</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Escaneie o QR Code abaixo com o seu WhatsApp para conectar o bot instantaneamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-card relative overflow-hidden group">
          {/* Decorative background flare */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {status === "online" ? (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-success),0.3)]">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-bold text-success animate-pulse">Conectado com sucesso!</p>
            </div>
          ) : qr ? (
            <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20 animate-in fade-in zoom-in-95 duration-500">
              <QRCodeSVG
                value={qr}
                size={260}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-12">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                {isLoading ? "Gerando QR Code criptografado..." : "Aguardando sincronização..."}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-in slide-in-from-top-2">
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          </div>
        )}

        <DialogFooter className="sm:justify-center mt-4">
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-xs text-muted-foreground/70 text-center px-4">
              Abra o WhatsApp &gt; Configurações &gt; Dispositivos Conectados &gt; Conectar um dispositivo
            </p>
            {status !== "online" && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl border-white/10 hover:bg-white/5 transition-all"
              >
                Cancelar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
