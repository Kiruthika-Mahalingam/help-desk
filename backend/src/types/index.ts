export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  manager?: string;
  location?: string;
  title?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Ticket {
  id?: number;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  employee_id: string;
  employee_name: string;
  employee_email: string;
  department: string;
  location?: string;
  phone?: string;
  assigned_to?: string;
  resolution?: string;
  attachments?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface TicketComment {
  id?: number;
  ticket_id: number;
  author: string;
  comment: string;
  created_at?: Date;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  phone?: string;
  employee_id: string;
}

export interface UpdateTicketRequest {
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_to?: string;
  resolution?: string;
  priority?: 'Low' | 'Medium' | 'High';
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
  employee_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  unassigned: number;
  by_category: Record<string, number>;
  by_department: Record<string, number>;
}

export interface SystemSettings {
  auto_assign: boolean;
  escalation_enabled: boolean;
  business_hours_only: boolean;
  default_priority: string;
  max_response_time: number;
  notification_settings: {
    email_enabled: boolean;
    sms_enabled: boolean;
    slack_enabled: boolean;
  };
}