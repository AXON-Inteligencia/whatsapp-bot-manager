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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com o seu WhatsApp para conectar o bot.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
          {status === "online" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-600">Conectado com sucesso!</p>
            </div>
          ) : qr ? (
            <div className="p-4 bg-white rounded-xl shadow-sm border">
              <QRCodeSVG
                value={qr}
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Gerando QR Code..." : "Aguardando conexão..."}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-xs text-muted-foreground text-center">
              Abra o WhatsApp &gt; Configurações &gt; Dispositivos Conectados &gt; Conectar um dispositivo
            </p>
            {status !== "online" && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Fechar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
