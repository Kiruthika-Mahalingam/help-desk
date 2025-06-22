import express from 'express';
import { db } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { TicketStats } from '../types';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const { timeframe = 'all' } = req.query;
  
  let dateFilter = '';
  if (timeframe === '7d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  } else if (timeframe === '30d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  } else if (timeframe === '90d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
  }
  
  // Basic stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'Open') as open,
      COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'Resolved') as resolved,
      COUNT(*) FILTER (WHERE status = 'Closed') as closed,
      COUNT(*) FILTER (WHERE priority = 'High') as high_priority,
      COUNT(*) FILTER (WHERE priority = 'Medium') as medium_priority,
      COUNT(*) FILTER (WHERE priority = 'Low') as low_priority,
      COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned
    FROM tickets 
    WHERE 1=1 ${dateFilter}
  `;
  
  const statsResult = await db.query(statsQuery);
  const stats = statsResult.rows[0];
  
  // Category breakdown
  const categoryQuery = `
    SELECT category, COUNT(*) as count 
    FROM tickets 
    WHERE 1=1 ${dateFilter}
    GROUP BY category 
    ORDER BY count DESC
  `;
  
  const categoryResult = await db.query(categoryQuery);
  const byCategory: Record<string, number> = {};
  categoryResult.rows.forEach((row: any) => {
    byCategory[row.category] = parseInt(row.count);
  });
  
  // Department breakdown
  const departmentQuery = `
    SELECT department, COUNT(*) as count 
    FROM tickets 
    WHERE 1=1 ${dateFilter}
    GROUP BY department 
    ORDER BY count DESC
  `;
  
  const departmentResult = await db.query(departmentQuery);
  const byDepartment: Record<string, number> = {};
  departmentResult.rows.forEach((row: any) => {
    byDepartment[row.department] = parseInt(row.count);
  });
  
  const response: TicketStats = {
    total: parseInt(stats.total),
    open: parseInt(stats.open),
    in_progress: parseInt(stats.in_progress),
    resolved: parseInt(stats.resolved),
    closed: parseInt(stats.closed),
    high_priority: parseInt(stats.high_priority),
    medium_priority: parseInt(stats.medium_priority),
    low_priority: parseInt(stats.low_priority),
    unassigned: parseInt(stats.unassigned),
    by_category: byCategory,
    by_department: byDepartment
  };
  
  res.json({
    success: true,
    data: response
  });
}));

// Get team performance metrics
router.get('/team/performance', asyncHandler(async (req, res) => {
  const teamQuery = `
    SELECT 
      assigned_to as agent,
      COUNT(*) as total_assigned,
      COUNT(*) FILTER (WHERE status = 'Open') as open_tickets,
      COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_tickets,
      COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_tickets,
      COUNT(*) FILTER (WHERE status = 'Closed') as closed_tickets,
      COUNT(*) FILTER (WHERE status IN ('Resolved', 'Closed') AND updated_at >= NOW() - INTERVAL '7 days') as resolved_this_week
    FROM tickets 
    WHERE assigned_to IS NOT NULL
    GROUP BY assigned_to
    ORDER BY total_assigned DESC
  `;
  
  const result = await db.query(teamQuery);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get ticket trends
router.get('/trends', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const trendsQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as tickets_created,
      COUNT(*) FILTER (WHERE status IN ('Resolved', 'Closed')) as tickets_resolved
    FROM tickets 
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
  
  const result = await db.query(trendsQuery);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get system settings
router.get('/settings', asyncHandler(async (req, res) => {
  const result = await db.query('SELECT setting_key, setting_value FROM system_settings');
  
  const settings: Record<string, any> = {};
  result.rows.forEach((row: any) => {
    settings[row.setting_key] = row.setting_value;
  });
  
  res.json({
    success: true,
    data: settings
  });
}));

// Update system settings
router.put('/settings/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  const result = await db.query(
    `INSERT INTO system_settings (setting_key, setting_value) 
     VALUES ($1, $2) 
     ON CONFLICT (setting_key) 
     DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [key, JSON.stringify(value)]
  );
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Bulk assign tickets
router.post('/tickets/bulk-assign', asyncHandler(async (req, res) => {
  const { ticket_ids, assigned_to } = req.body;
  
  if (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
    throw createError('Valid ticket IDs array is required', 400);
  }
  
  if (!assigned_to) {
    throw createError('Assigned to is required', 400);
  }
  
  const placeholders = ticket_ids.map((_, index) => `$${index + 1}`).join(',');
  const query = `UPDATE tickets SET assigned_to = $${ticket_ids.length + 1} WHERE id IN (${placeholders}) RETURNING *`;
  
  const result = await db.query(query, [...ticket_ids, assigned_to]);
  
  res.json({
    success: true,
    data: result.rows,
    message: `${result.rows.length} tickets assigned to ${assigned_to}`
  });
}));

// Auto-assign unassigned tickets
router.post('/tickets/auto-assign', asyncHandler(async (req, res) => {
  const agents = ['John Smith (IT)', 'Sarah Johnson (IT)', 'Mike Wilson (IT)', 'Lisa Brown (IT)'];
  
  // Get unassigned tickets
  const unassignedResult = await db.query(
    'SELECT id FROM tickets WHERE assigned_to IS NULL AND status = $1 ORDER BY created_at ASC',
    ['Open']
  );
  
  const updates = [];
  
  for (let i = 0; i < unassignedResult.rows.length; i++) {
    const ticket = unassignedResult.rows[i];
    const agent = agents[i % agents.length]; // Round-robin assignment
    
    await db.query(
      'UPDATE tickets SET assigned_to = $1 WHERE id = $2',
      [agent, ticket.id]
    );
    
    updates.push({ ticket_id: ticket.id, assigned_to: agent });
  }
  
  res.json({
    success: true,
    data: updates,
    message: `${updates.length} tickets auto-assigned`
  });
}));

// Generate report
router.post('/reports/generate', asyncHandler(async (req, res) => {
  const { type, start_date, end_date, filters } = req.body;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;
  
  if (start_date) {
    paramCount++;
    query += ` AND created_at >= $${paramCount}`;
    params.push(start_date);
  }
  
  if (end_date) {
    paramCount++;
    query += ` AND created_at <= $${paramCount}`;
    params.push(end_date);
  }
  
  if (filters?.status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    params.push(filters.status);
  }
  
  if (filters?.priority) {
    paramCount++;
    query += ` AND priority = $${paramCount}`;
    params.push(filters.priority);
  }
  
  if (filters?.department) {
    paramCount++;
    query += ` AND department = $${paramCount}`;
    params.push(filters.department);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await db.query(query, params);
  
  const report = {
    type,
    generated_at: new Date().toISOString(),
    filters: { start_date, end_date, ...filters },
    summary: {
      total_tickets: result.rows.length,
      by_status: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      by_department: {} as Record<string, number>
    },
    tickets: result.rows
  };
  
  // Calculate summary statistics
  result.rows.forEach((ticket: any) => {
    // Status breakdown
    report.summary.by_status[ticket.status] = (report.summary.by_status[ticket.status] || 0) + 1;
    
    // Priority breakdown
    report.summary.by_priority[ticket.priority] = (report.summary.by_priority[ticket.priority] || 0) + 1;
    
    // Category breakdown
    report.summary.by_category[ticket.category] = (report.summary.by_category[ticket.category] || 0) + 1;
    
    // Department breakdown
    report.summary.by_department[ticket.department] = (report.summary.by_department[ticket.department] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: report
  });
}));

export default router;