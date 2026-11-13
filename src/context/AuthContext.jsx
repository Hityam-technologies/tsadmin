import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { restoreAdminSession, setSessionLostHandler, syncSessionFromStorage, USE_MOCK } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  const [isLoading, setIsLoading] = useState(false);
  // A saved sign-in is shown at once. The cookie refresh runs behind it.
  const [isRestoring, setIsRestoring] = useState(!USE_MOCK && !authService.getCurrentUser());

  useEffect(() => {
    let live = true;
    setSessionLostHandler(() => {
      if (live) setCurrentUser(null);
    });
    restoreAdminSession()
      .then((user) => {
        if (live && user) setCurrentUser(user);
      })
      .finally(() => {
        if (live) setIsRestoring(false);
      });

    // A sign-in or sign-out in one tab updates the others without a reload.
    const onStorage = (event) => {
      if (event.key && event.key !== 'tsadmin.session') return;
      if (!live) return;
      setCurrentUser(syncSessionFromStorage());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      live = false;
      setSessionLostHandler(null);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setCurrentUser(result.data?.user ? { ...result.data.user, role: result.data.user.role || 'admin' } : authService.getCurrentUser());
        return { success: true };
      }
      return { success: false, error: result.error?.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email);
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const isAdmin = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isRestoring,
        login,
        forgotPassword,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
