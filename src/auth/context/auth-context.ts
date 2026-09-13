import { createContext, useContext } from 'react';
import {
  AuthModel,
  SessionItem,
  UserModel,
  UserProfile,
} from '@/auth/lib/models';

export interface AuthContextType {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  user?: UserModel;
  setUser: React.Dispatch<React.SetStateAction<UserModel | undefined>>;
  profile: UserProfile | null;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  login: (
    username: string,
    password: string,
    audience?: 'web' | 'extension',
  ) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<number>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  verify: () => Promise<void>;
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getSessions: () => Promise<SessionItem[]>;

  // Backward compatibility fields for legacy components
  auth?: AuthModel;
  saveAuth?: (auth: AuthModel | undefined) => void;
  register?: (
    email: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  requestPasswordReset?: (email: string) => Promise<void>;
  resetPassword?: (
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  resendVerificationEmail?: (email: string) => Promise<void>;
  getUser?: () => Promise<UserModel | null>;
  updateProfile?: (userData: Partial<UserModel>) => Promise<UserModel>;
}

export const AuthContext = createContext<AuthContextType>({
  loading: true,
  setLoading: () => {},
  isAuthenticated: false,
  user: undefined,
  setUser: () => {},
  profile: null,
  roles: [],
  permissions: [],
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
  logoutAll: async () => 0,
  changePassword: async () => {},
  refreshSession: async () => {},
  refreshProfile: async () => null,
  verify: async () => {},
  can: () => false,
  hasRole: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  getSessions: async () => [],
});

export function useAuth() {
  return useContext(AuthContext);
}
