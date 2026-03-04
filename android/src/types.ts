export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  role_name: string;
  role_level: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  initialized: boolean;
}
