const ASAAS_BASE_URL = process.env.ASAAS_ENVIRONMENT === 'sandbox' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3';

async function asaasFetch(path: string, options: RequestInit = {}) {
  const url = `${ASAAS_BASE_URL}${path}`;
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error("Asaas API Key não configurada no ambiente.");
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const start = Date.now();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal as any,
      });

      console.log(`[Asaas] ${options.method || 'GET'} ${path} → ${response.status} (${Date.now() - start}ms)`);

      if (response.ok) {
        clearTimeout(timeoutId);
        return await response.json();
      }

      if (response.status >= 500 && attempt < maxRetries - 1) {
        // Retry with exponential backoff (1s, 2s)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        attempt++;
        continue;
      }

      clearTimeout(timeoutId);
      const errorData = await response.text();
      throw new Error(`Asaas API Error ${response.status}: ${errorData}`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Asaas API Timeout após 10s: ${path}`);
      }
      if (attempt >= maxRetries - 1) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
}

export async function findOrCreateCustomer(
  supabaseUserId: string, 
  name: string, 
  email: string, 
  cpfCnpj?: string
): Promise<string> {
  // Nota: A busca no Supabase é delegada para o route handler. 
  // Aqui assumimos que se foi chamado, é porque o cliente não tem ou precisa criar.
  
  // Buscar se o e-mail já existe no Asaas para evitar duplicidade na própria plataforma
  const searchRes = await asaasFetch(`/customers?email=${encodeURIComponent(email)}`);
  
  if (searchRes && searchRes.data && searchRes.data.length > 0) {
    return searchRes.data[0].id;
  }

  // Criar novo
  const createRes = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      cpfCnpj,
      externalReference: supabaseUserId
    })
  });

  return createRes.id;
}

export async function createPaymentLink(customerId: string, planName: string, value: number): Promise<string> {
  const response = await asaasFetch('/paymentLinks', {
    method: 'POST',
    body: JSON.stringify({
      billingType: 'UNDEFINED',
      chargeType: 'RECURRENT',
      name: `Assinatura AxonFlow - ${planName}`,
      description: `Assinatura mensal do plano ${planName}`,
      value,
      dueDateLimitDays: 3,
      maxInstallmentCount: 1,
      endDate: null,
      subscriptionCycle: 'MONTHLY'
    })
  });

  return response.url;
}
