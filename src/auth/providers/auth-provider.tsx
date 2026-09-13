import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AuthContext } from '@/auth/context/auth-context';
import {
  AuthModel,
  SessionItem,
  UserModel,
  UserProfile,
} from '@/auth/lib/models';
import { authService } from '@/auth/services/auth-service';
import { tokenStore } from '@/auth/services/token-store';
import { setAuthCallbacks } from '@/lib/axios.config';

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserModel | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const initStarted = useRef(false);

  const isAdmin = roles.includes('admin') || user?.is_admin === true;

  // Helper to schedule silent refresh
  const scheduleRefresh = useCallback((expiresIn: number) => {
    tokenStore.scheduleSilentRefresh(expiresIn, async () => {
      try {
        const response = await authService.refresh();
        scheduleRefresh(response.expiresIn);
      } catch (error) {
        console.warn('Scheduled silent refresh failed:', error);
        tokenStore.clear();
        setIsAuthenticated(false);
        setUser(undefined);
        setProfile(null);
        setRoles([]);
        setPermissions([]);
      }
    });
  }, []);

  // Sync user and profile details from backend
  const syncSession = useCallback(async () => {
    try {
      const me = await authService.getMe();
      setRoles(me.roles || []);
      setPermissions(me.permissions || []);

      const userModel: UserModel = {
        id: me.id,
        username: me.username,
        fullName: me.username,
        fullname: me.username,
        roles: me.roles,
        permissions: me.permissions,
        is_admin: me.roles?.includes('admin'),
      };

      // Also try fetching profile in background to get fullName & email
      try {
        const userProfile = await authService.getProfile();
        setProfile(userProfile);
        userModel.email = userProfile.email || undefined;
        userModel.fullName = userProfile.fullName || me.username;
        userModel.fullname = userProfile.fullName || me.username;
      } catch {
        // Ignore profile fetch failure if minimal permissions
      }

      setUser(userModel);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Session sync error:', error);
    }
  }, []);

  // Initialize app: Restore session via POST /auth/refresh on reload / startup
  const verify = useCallback(async () => {
    try {
      const refreshRes = await authService.refresh();
      scheduleRefresh(refreshRes.expiresIn);
      await syncSession();
    } catch {
      // 401: Unauthenticated -> clear in-memory state
      tokenStore.clear();
      setIsAuthenticated(false);
      setUser(undefined);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [scheduleRefresh, syncSession]);

  useEffect(() => {
    // Setup Axios interceptor callbacks
    setAuthCallbacks({
      onAuthFailure: () => {
        tokenStore.clear();
        setIsAuthenticated(false);
        setUser(undefined);
        setProfile(null);
        setRoles([]);
        setPermissions([]);
      },
      onRefreshSuccess: (_newAccessToken, expiresIn) => {
        scheduleRefresh(expiresIn);
      },
    });

    if (!initStarted.current) {
      initStarted.current = true;
      void verify();
    }
  }, [verify, scheduleRefresh]);

  const login = async (
    username: string,
    password: string,
    audience?: 'web' | 'extension',
  ) => {
    try {
      setLoading(true);
      const res = await authService.login({
        username,
        password,
        audience: audience || 'web',
      });

      scheduleRefresh(res.expiresIn);

      const userModel: UserModel = {
        id: res.user.id,
        username: res.user.username,
        fullName: res.user.fullName,
        fullname: res.user.fullName,
        email: res.user.email,
        roles: res.roles || [],
        permissions: res.permissions || [],
        is_admin: res.roles?.includes('admin'),
      };

      setUser(userModel);
      setRoles(res.roles || []);
      setPermissions(res.permissions || []);
      setIsAuthenticated(true);

      // Fetch profile in background
      try {
        const userProfile = await authService.getProfile();
        setProfile(userProfile);
        if (userProfile.email) {
          userModel.email = userProfile.email;
          setUser({ ...userModel });
        }
      } catch {
        // Optional
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      tokenStore.clear();
      setIsAuthenticated(false);
      setUser(undefined);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
    }
  };

  const logoutAll = async (): Promise<number> => {
    try {
      const res = await authService.logoutAll();
      await logout();
      return res.revoked;
    } catch {
      await logout();
      return 0;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    await authService.changePassword({ currentPassword, newPassword });
    // Keep current session alive as noted in PROMPT_FRONTEND.md
  };

  const refreshSession = async () => {
    await syncSession();
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    try {
      const p = await authService.getProfile();
      setProfile(p);
      return p;
    } catch {
      return null;
    }
  };

  const getSessions = async (): Promise<SessionItem[]> => {
    return await authService.getSessions();
  };

  // Permission & Role Check Helpers (Section 5)
  const can = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some((p) => permissions.includes(p)),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => perms.every((p) => permissions.includes(p)),
    [permissions],
  );

  const legacyAuth: AuthModel | undefined = isAuthenticated
    ? {
        access_token: tokenStore.getAccessToken() || '',
      }
    : undefined;

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        isAuthenticated,
        user,
        setUser,
        profile,
        roles,
        permissions,
        isAdmin,
        login,
        logout,
        logoutAll,
        changePassword,
        refreshSession,
        refreshProfile,
        verify,
        can,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        getSessions,
        auth: legacyAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
