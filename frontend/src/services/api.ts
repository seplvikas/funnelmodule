import axios from 'axios';
import { logAuthDebug } from '../utils/authDebug';

// Prefer same-origin /api; fall back to localhost for dev without env override
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5001/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // Let browser/axios set multipart boundary automatically
    delete config.headers['Content-Type'];
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (config.url?.includes('/auth/azure-callback')) {
    logAuthDebug('api-auth-request', {
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: `${config.baseURL}${config.url}`,
      hasAuthHeader: Boolean(token),
    });
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.url?.includes('/auth/azure-callback')) {
      logAuthDebug('api-auth-error', {
        status: error.response?.status || null,
        message: error.message || null,
        responseError: error.response?.data?.error || null,
        responseCode: error.response?.data?.code || null,
      });
    }
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on the login page
      // and if the error is from an authenticated endpoint
      const currentPath = window.location.pathname;
      const isOnLoginPage = currentPath === '/login';
      
      if (!isOnLoginPage) {
        // Clear auth tokens only on 401 from protected endpoints
        const endpoint = error.config?.url || '';
        const isPublicLetterEndpoint = endpoint.includes('/letters/qr/verify/');
        const isAuthEndpoint = !isPublicLetterEndpoint && (endpoint.includes('/admin') || endpoint.includes('/products') || 
                               endpoint.includes('/tasks') || endpoint.includes('/notifications') ||
                               endpoint.includes('/emd') || endpoint.includes('/epbg') ||
                   endpoint.includes('/letters'));
        
        if (isAuthEndpoint) {
          console.warn('[API] 401 Unauthorized on protected endpoint, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  azureCallback: (data: any) => apiClient.post('/auth/azure-callback', data),
  demoLogin: (email: string, password: string) => apiClient.post('/auth/demo-login', { email, password }),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

export const productsApi = {
  getAll: (filter?: string, search?: string) =>
    apiClient.get('/products', { params: { filter, search } }),
  getOne: (id: number) => apiClient.get(`/products/${id}`),
  create: (product: any) => apiClient.post('/products', product),
  update: (id: number, product: any) => apiClient.put(`/products/${id}`, product),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
  getDashboardStats: () => apiClient.get('/products/dashboard-stats'),
};

export const tasksApi = {
  list: () => apiClient.get('/tasks'),
  listAll: () => apiClient.get('/tasks/all'),
  get: (id: number) => apiClient.get(`/tasks/${id}`),
  create: (task: any) => apiClient.post('/tasks', task),
  update: (id: number, task: any) => apiClient.put(`/tasks/${id}`, task),
  delete: (id: number) => apiClient.delete(`/tasks/${id}`),
  notifications: () => apiClient.get('/tasks/notifications/all'),
};

export const notificationsApi = {
  getAll: () => apiClient.get('/notifications'),
  getUnseenCount: () => apiClient.get('/notifications/unseen'),
  markAsRead: (id: number, type: 'task' | 'product') =>
    apiClient.post(`/notifications/${id}/read?type=${type}`),
  markAllAsRead: () => apiClient.post('/notifications/read-all'),
  deleteNotification: (id: number, type: 'task' | 'product') =>
    apiClient.delete(`/notifications/${id}?type=${type}`),
};

export const adminApi = {
  getStatus: () => apiClient.get('/admin/status'),
  listUsers: () => apiClient.get('/admin/users'),
  getUser: (id: number) => apiClient.get(`/admin/users/${id}`),
  updateUserPermissions: (id: number, permissions: any) =>
    apiClient.put(`/admin/users/${id}/permissions`, permissions),
  syncAzureUsers: () => apiClient.post('/admin/sync-azure-users'),
  // Organization hierarchy
  getADUsers: () => apiClient.get('/admin/ad-users'),
  getOrgStructure: () => apiClient.get('/admin/org-structure'),
  saveOrgStructure: (orgStructure: any) => apiClient.post('/admin/org-structure/save', { orgStructure }),
  addUserToOrgNode: (nodeId: string, userId: string, email: string, name: string) =>
    apiClient.post(`/admin/org-structure/${nodeId}/users`, { userId, email, name }),
  removeUserFromOrgNode: (nodeId: string, userId: string) =>
    apiClient.delete(`/admin/org-structure/${nodeId}/users/${userId}`),
  addOrgNode: (parentNodeId: string, roleName: string, roleType?: string) =>
    apiClient.post(`/admin/org-structure/${parentNodeId}/nodes`, { roleName, roleType }),
};

export const usersApi = {
  searchAD: (query: string) => apiClient.get('/users/search', { params: { query } }),
  listAll: () => apiClient.get('/admin/users'),
};

export const emdApi = {
  // EMD endpoints
  listEMDs: () => apiClient.get('/emd'),
  getEMD: (id: number) => apiClient.get(`/emd/${id}`),
  createEMD: (data: any) => apiClient.post('/emd', data),
  updateEMD: (id: number, data: any) => apiClient.put(`/emd/${id}`, data),
  deleteEMD: (id: number) => apiClient.delete(`/emd/${id}`),
  getEMDDashboard: () => apiClient.get('/emd/dashboard'),
  
  // ePBG endpoints
  listEPBGs: () => apiClient.get('/emd/epbg'),
  getEPBG: (id: number) => apiClient.get(`/emd/epbg/${id}`),
  createEPBG: (data: any) => apiClient.post('/emd/epbg', data),
  updateEPBG: (id: number, data: any) => apiClient.put(`/emd/epbg/${id}`, data),
  deleteEPBG: (id: number) => apiClient.delete(`/emd/epbg/${id}`),
  getEPBGDashboard: () => apiClient.get('/emd/epbg/dashboard'),
};

export const seplApi = {
  listOpportunities: (stage?: string, status?: string) =>
    apiClient.get('/sepl', { params: { stage, status } }),
  getOpportunity: (id: number) => apiClient.get(`/sepl/${id}`),
  createOpportunity: (data: any) => apiClient.post('/sepl', data),
  updateOpportunity: (id: number, data: any) => apiClient.put(`/sepl/${id}`, data),
  deleteOpportunity: (id: number) => apiClient.delete(`/sepl/${id}`),
  moveStage: (id: number, data: any) => apiClient.post(`/sepl/${id}/move`, data),
  getDashboard: (params?: any) => apiClient.get('/sepl/dashboard', { params }),
  getOwnerStats: (params?: any) => apiClient.get('/sepl/owner-stats', { params }),
  export: (params?: any) => apiClient.get('/sepl/export', { params }),
  bulkUploadOpportunities: (opportunities: any[]) => apiClient.post('/sepl/bulk-upload', { opportunities }),
  
  // OEM endpoints
  listOEMs: () => apiClient.get('/sepl/oems'),
  createOEM: (data: any) => apiClient.post('/sepl/oems', data),
  updateOEM: (id: number, data: any) => apiClient.put(`/sepl/oems/${id}`, data),
  deleteOEM: (id: number) => apiClient.delete(`/sepl/oems/${id}`),
  
  // Customer endpoints
  listCustomers: () => apiClient.get('/sepl/customers'),
  createCustomer: (data: any) => apiClient.post('/sepl/customers', data),
  updateCustomer: (id: number, data: any) => apiClient.put(`/sepl/customers/${id}`, data),
  deleteCustomer: (id: number) => apiClient.delete(`/sepl/customers/${id}`),
  
  // Product endpoints
  listProducts: () => apiClient.get('/sepl/products'),
  createProduct: (data: any) => apiClient.post('/sepl/products', data),
  updateProduct: (id: number, data: any) => apiClient.put(`/sepl/products/${id}`, data),
  deleteProduct: (id: number) => apiClient.delete(`/sepl/products/${id}`),
  
  // OIC endpoints
  listOICs: () => apiClient.get('/sepl/oics'),
  createOIC: (data: any) => apiClient.post('/sepl/oics', data),
  updateOIC: (id: number, data: any) => apiClient.put(`/sepl/oics/${id}`, data),
  deleteOIC: (id: number) => apiClient.delete(`/sepl/oics/${id}`),
};

export const hrApi = {
  listApplicants: () => apiClient.get('/hr/applicants'),
  listDeletedApplicants: () => apiClient.get('/hr/applicants/deleted'),
  createApplicant: (formData: FormData) =>
    apiClient.post('/hr/applicants', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateApplicant: (id: string | number, payload: any) => apiClient.put(`/hr/applicants/${id}`, payload),
  deleteApplicant: (id: string | number) => apiClient.delete(`/hr/applicants/${id}`),
  restoreApplicant: (id: string | number) => apiClient.post(`/hr/applicants/${id}/restore`),
  permanentlyDeleteApplicant: (id: string | number) => apiClient.delete(`/hr/applicants/${id}/permanent`),
  downloadApplicantCV: (id: string | number) =>
    apiClient.get(`/hr/applicants/${id}/cv`, { responseType: 'blob' }),
  previewApplicantCV: (id: string | number) =>
    apiClient.get(`/hr/applicants/${id}/cv/preview`, { responseType: 'blob' }),
  uploadApplicantCV: (id: string | number, formData: FormData) =>
    apiClient.post(`/hr/applicants/${id}/cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listApplicantActivity: (id: string | number) => apiClient.get(`/hr/applicants/${id}/activity`),
  addApplicantRemark: (id: string | number, remark: string) =>
    apiClient.post(`/hr/applicants/${id}/activity`, { remark }),

  listPositions: () => apiClient.get('/hr/positions'),
  createPosition: (payload: FormData | Record<string, any>) => {
    if (payload instanceof FormData) {
      return apiClient.post('/hr/positions', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post('/hr/positions', payload);
  },
  uploadPositionJD: (id: string | number, formData: FormData) =>
    apiClient.post(`/hr/positions/${id}/jd`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  previewPositionJD: (id: string | number) =>
    apiClient.get(`/hr/positions/${id}/jd/preview`, { responseType: 'blob' }),
  deletePosition: (id: string | number) => apiClient.delete(`/hr/positions/${id}`),
};

export const lettersApi = {
  getTemplate: () => apiClient.get('/letters/template'),
  listTemplates: () => apiClient.get('/letters/templates'),
  getTemplateById: (templateId: number | string) => apiClient.get(`/letters/templates/${templateId}`),
  createTemplate: (payload: any) => apiClient.post('/letters/templates', payload),
  updateTemplate: (templateId: number | string, payload: any) => apiClient.put(`/letters/templates/${templateId}`, payload),
  getStats: () => apiClient.get('/letters/stats'),
  list: (params?: any) => apiClient.get('/letters', { params }),
  checkName: (params: { fileName?: string; templateName?: string; excludeId?: number | string }) =>
    apiClient.get('/letters/check-name', { params }),
  get: (id: number | string) => apiClient.get(`/letters/${id}`),
  create: (payload: any) => apiClient.post('/letters', payload),
  update: (id: number | string, payload: any) => apiClient.put(`/letters/${id}`, payload),
  uploadMappedPdf: (id: number | string, file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return apiClient.post(`/letters/${id}/mapped-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listUploads: (id: number | string) => apiClient.get(`/letters/${id}/uploads`),
  downloadUpload: (id: number | string, uploadId: number | string) => apiClient.get(`/letters/${id}/uploads/${uploadId}`, { responseType: 'blob' }),
  downloadMappedPdf: (id: number | string) => apiClient.get(`/letters/${id}/mapped-pdf`, { responseType: 'blob' }),
  delete: (id: number | string) => apiClient.delete(`/letters/${id}`),
  downloadDocx: (id: number | string) => apiClient.get(`/letters/${id}/download/docx`, { responseType: 'blob' }),
  listSignatoryOptions: () => apiClient.get('/letters/signatory-options'),
  listPendingApproval: (params?: { filter?: 'pending_with_you' | 'requested_by_you' | 'rejected_letters' }) =>
    apiClient.get('/letters/pending-approval', { params }),
  approve: (id: number | string) => apiClient.post(`/letters/${id}/approve`),
  reject: (id: number | string, payload: { remark: string }) => apiClient.post(`/letters/${id}/reject`, payload),
  getAuditLogs: (id: number | string) => apiClient.get(`/letters/${id}/audit-logs`),
  listRoleAssignments: () => apiClient.get('/letters/admin/roles'),
  updateRoleAssignment: (userId: number | string, payload: { is_admin?: boolean; is_authorized_signatory?: boolean }) =>
    apiClient.put(`/letters/admin/roles/${userId}`, payload),
  listAuthorizedSignatories: () => apiClient.get('/letters/admin/signatories'),
  listSignatureManagementUsers: () => apiClient.get('/letters/admin/signature-management-users'),
  getSignatorySignature: (userId: number | string) => apiClient.get(`/letters/admin/signatories/${userId}/signature`),
  saveSignatorySignature: (userId: number | string, payload: {
    signer_name: string;
    designation: string;
    details_text: string;
    signature_html: string;
  }) => apiClient.post(`/letters/admin/signatories/${userId}/signature`, payload),
  deleteSignatorySignature: (userId: number | string) => apiClient.delete(`/letters/admin/signatories/${userId}/signature`),
  verifyQRToken: (token: string) => apiClient.get(`/letters/qr/verify/${token}`),
  getAccessLogs: (letterId: number | string) => apiClient.get(`/letters/${letterId}/access-logs`),
};

// Portal-specific notifications
export const portalNotificationsApi = {
  getNotifications: (portal: string) => apiClient.get(`/portal-notifications/${portal}`),
  getUnseenCount: (portal: string) => apiClient.get(`/portal-notifications/${portal}/unseen`),
  markAsRead: (portal: string, id: number) => apiClient.post(`/portal-notifications/${portal}/${id}/read`),
  markAllAsRead: (portal: string) => apiClient.post(`/portal-notifications/${portal}/read-all`),
  delete: (portal: string, id: number) => apiClient.delete(`/portal-notifications/${portal}/${id}`),
};
