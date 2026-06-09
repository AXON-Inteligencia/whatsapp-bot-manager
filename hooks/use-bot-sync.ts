import { useEffect, useState, useCallback, useRef } from 'react';
import { BotStatus } from '@/lib/types';

interface BotSyncState {
  status: BotStatus;
  qr: string | null;
  connectedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para sincronizar o status do bot em tempo real com o backend
 * Realiza polling a cada 3 segundos enquanto o bot está conectando
 */
export function useBotSync(botId: string | null, enabled: boolean = true) {
  const [syncState, setSyncState] = useState<BotSyncState>({
    status: 'offline',
    qr: null,
    connectedAt: null,
    isLoading: false,
    error: null,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBotStatus = useCallback(async () => {
    if (!botId || !enabled) return;

    try {
      setSyncState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/whatsapp/qr?botId=${botId}`, {
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar status do bot');
      }

      const data = await response.json();

      setSyncState({
        status: data.status || 'offline',
        qr: data.qr || null,
        connectedAt: data.connectedAt || null,
        isLoading: false,
        error: null,
      });

      // Se conectado, parar o polling
      if (data.status === 'online') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setSyncState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    }
  }, [botId, enabled]);

  // Iniciar polling quando o bot está conectando
  useEffect(() => {
    if (!enabled || !botId) return;

    // Fetch inicial
    fetchBotStatus();

    // Configurar polling
    pollingIntervalRef.current = setInterval(() => {
      fetchBotStatus();
    }, 3000); // Polling a cada 3 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [botId, enabled, fetchBotStatus]);

  return syncState;
}

/**
 * Hook para iniciar a conexão de um bot
 */
export function useConnectBot() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (botId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao conectar bot');
      }

      setIsConnecting(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao conectar';
      setError(errorMessage);
      setIsConnecting(false);
      throw err;
    }
  }, []);

  return { connect, isConnecting, error };
}

/**
 * Hook para desconectar um bot
 */
export function useDisconnectBot() {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(async (botId: string) => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/whatsapp/disconnect?botId=${botId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao desconectar bot');
      }

      setIsDisconnecting(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao desconectar';
      setError(errorMessage);
      setIsDisconnecting(false);
      throw err;
    }
  }, []);

  return { disconnect, isDisconnecting, error };
}
