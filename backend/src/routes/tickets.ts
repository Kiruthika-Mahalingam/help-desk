import express from 'express';
import { db } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { CreateTicketRequest, UpdateTicketRequest, TicketFilters } from '../types';

const router = express.Router();

// Create a new ticket
router.post('/', asyncHandler(async (req, res) => {
  const ticketData: CreateTicketRequest = req.body;
  
  // Validate employee exists
  const employeeResult = await db.query('SELECT * FROM employees WHERE id = $1', [ticketData.employee_id]);
  
  if (employeeResult.rows.length === 0) {
    throw createError('Employee not found', 404);
  }
  
  const employee = employeeResult.rows[0];
  
  const result = await db.query(`
    INSERT INTO tickets (title, description, category, priority, urgency, employee_id, 
                        employee_name, employee_email, department, location, phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    ticketData.title,
    ticketData.description,
    ticketData.category,
    ticketData.priority,
    ticketData.urgency || 'Medium',
    ticketData.employee_id,
    employee.name,
    employee.email,
    employee.department,
    ticketData.location || employee.location,
    ticketData.phone || employee.phone
  ]);
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

// Get all tickets with filters
router.get('/', asyncHandler(async (req, res) => {
  const filters: TicketFilters = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;
  
  // Apply filters
  if (filters.status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    params.push(filters.status);
  }
  
  if (filters.priority) {
    paramCount++;
    query += ` AND priority = $${paramCount}`;
    params.push(filters.priority);
  }
  
  if (filters.category) {
    paramCount++;
    query += ` AND category = $${paramCount}`;
    params.push(filters.category);
  }
  
  if (filters.assigned_to) {
    if (filters.assigned_to === 'unassigned') {
      query += ' AND assigned_to IS NULL';
    } else {
      paramCount++;
      query += ` AND assigned_to = $${paramCount}`;
      params.push(filters.assigned_to);
    }
  }
  
  if (filters.employee_id) {
    paramCount++;
    query += ` AND employee_id = $${paramCount}`;
    params.push(filters.employee_id);
  }
  
  if (filters.search) {
    paramCount++;
    query += ` AND (LOWER(title) LIKE LOWER($${paramCount}) OR LOWER(description) LIKE LOWER($${paramCount}) OR LOWER(employee_name) LIKE LOWER($${paramCount}))`;
    params.push(`%${filters.search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }
  
  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(filters.offset);
  }
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get ticket by ID  
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate that id is a number
  if (isNaN(parseInt(id))) {
    throw createError('Invalid ticket ID', 400);
  }
  
  const ticketResult = await db.query('SELECT * FROM tickets WHERE id = $1', [parseInt(id)]);
  
  if (ticketResult.rows.length === 0) {
    throw createError('Ticket not found', 404);
  }
  
  // Get comments for this ticket
  const commentsResult = await db.query(
    'SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC',
    [id]
  );
  
  const ticket = ticketResult.rows[0];
  ticket.comments = commentsResult.rows;
  
  res.json({
    success: true,
    data: ticket
  });
}));

// Update ticket
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates: UpdateTicketRequest = req.body;
  
  const setClause: string[] = [];
  const params: any[] = [];
  let paramCount = 0;
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      paramCount++;
      setClause.push(`${key} = $${paramCount}`);
      params.push(value);
    }
  });
  
  if (setClause.length === 0) {
    throw createError('No valid updates provided', 400);
  }
  
  paramCount++;
  params.push(id);
  
  const query = `UPDATE tickets SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const result = await db.query(query, params);
  
  if (result.rows.length === 0) {
    throw createError('Ticket not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Add comment to ticket
router.post('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { author, comment } = req.body;
  
  if (!author || !comment) {
    throw createError('Author and comment are required', 400);
  }
  
  // Verify ticket exists
  const ticketCheck = await db.query('SELECT id FROM tickets WHERE id = $1', [id]);
  if (ticketCheck.rows.length === 0) {
    throw createError('Ticket not found', 404);
  }
  
  const result = await db.query(
    'INSERT INTO ticket_comments (ticket_id, author, comment) VALUES ($1, $2, $3) RETURNING *',
    [id, author, comment]
  );
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

// Get tickets by employee
router.get('/employee/:employeeId', asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { status, priority } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE employee_id = $1';
  const params = [employeeId];
  let paramCount = 1;
  
  if (status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    params.push(status as string);
  }
  
  if (priority) {
    paramCount++;
    query += ` AND priority = $${paramCount}`;
    params.push(priority as string);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get recent tickets
router.get('/recent', asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  const result = await db.query(
    'SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Close ticket
router.post('/:id/close', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution } = req.body;
  
  if (!resolution) {
    throw createError('Resolution is required to close ticket', 400);
  }
  
  const result = await db.query(
    'UPDATE tickets SET status = $1, resolution = $2 WHERE id = $3 RETURNING *',
    ['Closed', resolution, id]
  );
  
  if (result.rows.length === 0) {
    throw createError('Ticket not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Reopen ticket
router.post('/:id/reopen', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, author } = req.body;
  
  if (!reason) {
    throw createError('Reason is required to reopen ticket', 400);
  }
  
  // Update ticket status
  const result = await db.query(
    'UPDATE tickets SET status = $1, assigned_to = NULL WHERE id = $2 RETURNING *',
    ['Open', id]
  );
  
  if (result.rows.length === 0) {
    throw createError('Ticket not found', 404);
  }
  
  // Add comment about reopening
  await db.query(
    'INSERT INTO ticket_comments (ticket_id, author, comment) VALUES ($1, $2, $3)',
    [id, author || 'System', `Ticket reopened. Reason: ${reason}`]
  );
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

export default router;