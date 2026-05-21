import api from './api';
import { ENDPOINTS } from '../utils/constants';

const authService = {
  /**
   * POST /admin/login
   * Returns { token } on success
   */
  async login(username, password) {
    const response = await api.post(ENDPOINTS.LOGIN, { username, password });
    const { token } = response.data;
    localStorage.setItem('authToken', token);
    return token;
  },

  logout() {
    localStorage.removeItem('authToken');
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isTokenPresent() {
    return !!localStorage.getItem('authToken');
  },
};

export default authService;
