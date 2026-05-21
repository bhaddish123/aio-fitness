import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if a token already exists in localStorage
  useEffect(() => {
    const tokenPresent = authService.isTokenPresent();
    setIsAuthenticated(tokenPresent);
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    await authService.login(username, password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
