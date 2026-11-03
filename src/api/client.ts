import axios from 'axios'
import { setupMockApi } from './mockApi'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
  setupMockApi(apiClient)
}
