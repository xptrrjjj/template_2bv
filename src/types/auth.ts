export interface User {
  id: string;
  name: string;
  email?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
}