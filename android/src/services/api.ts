import { API_BASE_URL } from '../config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const rawText = await response.text();
  let data: any = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { mensagem: rawText };
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.mensagem || data?.erro || 'Erro na requisição', response.status);
  }
  return data as T;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    username: string;
    nome: string;
    email: string;
    role_name: string;
    role_level: number;
  };
}
