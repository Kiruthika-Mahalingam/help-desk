import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    throw error.response?.data || error
  }
)

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  phone?: string
  manager?: string
  location?: string
  title?: string
}

export interface Ticket {
  id?: number
  title: string
  description: string
  category: string
  priority: 'Low' | 'Medium' | 'High'
  urgency: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  employee_id: string
  employee_name: string
  employee_email: string
  department: string
  location?: string
  phone?: string
  assigned_to?: string
  resolution?: string
  attachments?: string[]
  created_at?: string
  updated_at?: string
  comments?: Comment[]
}

export interface Comment {
  id?: number
  ticket_id: number
  author: string
  comment: string
  created_at?: string
}

export interface CreateTicketData {
  title: string
  description: string
  category: string
  priority: 'Low' | 'Medium' | 'High'
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical'
  location?: string
  phone?: string
  employee_id: string
}

export interface TicketFilters {
  status?: string
  priority?: string
  category?: string
  assigned_to?: string
  employee_id?: string
  search?: string
  limit?: number
  offset?: number
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  high_priority: number
  medium_priority: number
  low_priority: number
  unassigned: number
  by_category: Record<string, number>
  by_department: Record<string, number>
}

// Employee service
export const employeeService = {
  lookup: (identifier: string): Promise<Employee> =>
    api.get(`/employees/lookup/${encodeURIComponent(identifier)}`).then(res => res.data),
  
  search: (query: string, department?: string): Promise<Employee[]> =>
    api.get('/employees/search', { params: { q: query, department } }).then(res => res.data),
  
  getAll: (): Promise<Employee[]> =>
    api.get('/employees').then(res => res.data),
  
  getByDepartment: (department: string): Promise<Employee[]> =>
    api.get(`/employees/department/${encodeURIComponent(department)}`).then(res => res.data),
  
  getManager: (id: string): Promise<Employee | null> =>
    api.get(`/employees/${id}/manager`).then(res => res.data),
  
  validate: (id: string): Promise<{ valid: boolean }> =>
    api.get(`/employees/validate/${id}`).then(res => res.data),
}

// Ticket service
export const ticketService = {
  create: (data: CreateTicketData): Promise<Ticket> =>
    api.post('/tickets', data).then(res => res.data),
  
  getAll: (filters?: TicketFilters): Promise<Ticket[]> =>
    api.get('/tickets', { params: filters }).then(res => res.data),
  
  getById: (id: number): Promise<Ticket> =>
    api.get(`/tickets/${id}`).then(res => res.data),
  
  update: (id: number, updates: Partial<Ticket>): Promise<Ticket> =>
    api.put(`/tickets/${id}`, updates).then(res => res.data),
  
  addComment: (id: number, comment: { author: string; comment: string }): Promise<Comment> =>
    api.post(`/tickets/${id}/comments`, comment).then(res => res.data),
  
  getByEmployee: (employeeId: string, filters?: { status?: string; priority?: string }): Promise<Ticket[]> =>
    api.get(`/tickets/employee/${employeeId}`, { params: filters }).then(res => res.data),
  
  getRecent: (limit?: number): Promise<Ticket[]> =>
    api.get('/tickets/recent', { params: { limit: limit || 10 } }).then(res => res.data),
  
  close: (id: number, resolution: string): Promise<Ticket> =>
    api.post(`/tickets/${id}/close`, { resolution }).then(res => res.data),
  
  reopen: (id: number, reason: string, author: string): Promise<Ticket> =>
    api.post(`/tickets/${id}/reopen`, { reason, author }).then(res => res.data),
  
  getStats: (timeframe?: string): Promise<TicketStats> =>
    api.get('/admin/stats', { params: { timeframe } }).then(res => res.data),
}

// Admin service
export const adminService = {
  getStats: (timeframe?: string): Promise<TicketStats> =>
    api.get('/admin/stats', { params: { timeframe } }).then(res => res.data),
  
  getTeamPerformance: (): Promise<any[]> =>
    api.get('/admin/team/performance').then(res => res.data),
  
  getTrends: (days?: number): Promise<any[]> =>
    api.get('/admin/trends', { params: { days } }).then(res => res.data),
  
  getSettings: (): Promise<Record<string, any>> =>
    api.get('/admin/settings').then(res => res.data),
  
  updateSetting: (key: string, value: any): Promise<any> =>
    api.put(`/admin/settings/${key}`, { value }).then(res => res.data),
  
  bulkAssign: (ticketIds: number[], assignedTo: string): Promise<Ticket[]> =>
    api.post('/admin/tickets/bulk-assign', { ticket_ids: ticketIds, assigned_to: assignedTo }).then(res => res.data),
  
  autoAssign: (): Promise<any> =>
    api.post('/admin/tickets/auto-assign').then(res => res.data),
  
  generateReport: (params: {
    type: string
    start_date?: string
    end_date?: string
    filters?: any
  }): Promise<any> =>
    api.post('/admin/reports/generate', params).then(res => res.data),
}

export default api