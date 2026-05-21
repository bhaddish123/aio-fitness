import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook for accessing auth state and actions.
 * Returns: { isAuthenticated, isLoading, login, logout }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
