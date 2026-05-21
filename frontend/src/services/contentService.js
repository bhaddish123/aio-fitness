import api from './api';
import { ENDPOINTS } from '../utils/constants';

const contentService = {
  /** GET /content — returns { key: value, ... } for all stored content */
  async getAllContent() {
    const response = await api.get(ENDPOINTS.CONTENT);
    return response.data;
  },

  /** PUT /admin/content/{key} — upserts a content item */
  async updateContent(key, value) {
    const response = await api.put(ENDPOINTS.ADMIN_CONTENT(key), { value });
    return response.data;
  },

  /** DELETE /admin/content/{key} — removes a content entry */
  async deleteContent(key) {
    await api.delete(ENDPOINTS.ADMIN_CONTENT(key));
  },
};

export default contentService;
