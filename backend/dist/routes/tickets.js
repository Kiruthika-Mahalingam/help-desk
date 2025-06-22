"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Create a new ticket
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ticketData = req.body;
    // Validate employee exists
    const employeeResult = await database_1.db.query('SELECT * FROM employees WHERE id = $1', [ticketData.employee_id]);
    if (employeeResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Employee not found', 404);
    }
    const employee = employeeResult.rows[0];
    const result = await database_1.db.query(`
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
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];
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
        }
        else {
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
    const result = await database_1.db.query(query, params);
    res.json({
        success: true,
        data: result.rows
    });
}));
// Get ticket by ID
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const ticketResult = await database_1.db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Ticket not found', 404);
    }
    // Get comments for this ticket
    const commentsResult = await database_1.db.query('SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
    const ticket = ticketResult.rows[0];
    ticket.comments = commentsResult.rows;
    res.json({
        success: true,
        data: ticket
    });
}));
// Update ticket
router.put('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const setClause = [];
    const params = [];
    let paramCount = 0;
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            paramCount++;
            setClause.push(`${key} = $${paramCount}`);
            params.push(value);
        }
    });
    if (setClause.length === 0) {
        throw (0, errorHandler_1.createError)('No valid updates provided', 400);
    }
    paramCount++;
    params.push(id);
    const query = `UPDATE tickets SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await database_1.db.query(query, params);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Ticket not found', 404);
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
// Add comment to ticket
router.post('/:id/comments', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { author, comment } = req.body;
    if (!author || !comment) {
        throw (0, errorHandler_1.createError)('Author and comment are required', 400);
    }
    // Verify ticket exists
    const ticketCheck = await database_1.db.query('SELECT id FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Ticket not found', 404);
    }
    const result = await database_1.db.query('INSERT INTO ticket_comments (ticket_id, author, comment) VALUES ($1, $2, $3) RETURNING *', [id, author, comment]);
    res.status(201).json({
        success: true,
        data: result.rows[0]
    });
}));
// Get tickets by employee
router.get('/employee/:employeeId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { employeeId } = req.params;
    const { status, priority } = req.query;
    let query = 'SELECT * FROM tickets WHERE employee_id = $1';
    const params = [employeeId];
    let paramCount = 1;
    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    if (priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        params.push(priority);
    }
    query += ' ORDER BY created_at DESC';
    const result = await database_1.db.query(query, params);
    res.json({
        success: true,
        data: result.rows
    });
}));
// Get recent tickets
router.get('/recent', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const result = await database_1.db.query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({
        success: true,
        data: result.rows
    });
}));
// Close ticket
router.post('/:id/close', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { resolution } = req.body;
    if (!resolution) {
        throw (0, errorHandler_1.createError)('Resolution is required to close ticket', 400);
    }
    const result = await database_1.db.query('UPDATE tickets SET status = $1, resolution = $2 WHERE id = $3 RETURNING *', ['Closed', resolution, id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Ticket not found', 404);
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
// Reopen ticket
router.post('/:id/reopen', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason, author } = req.body;
    if (!reason) {
        throw (0, errorHandler_1.createError)('Reason is required to reopen ticket', 400);
    }
    // Update ticket status
    const result = await database_1.db.query('UPDATE tickets SET status = $1, assigned_to = NULL WHERE id = $2 RETURNING *', ['Open', id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Ticket not found', 404);
    }
    // Add comment about reopening
    await database_1.db.query('INSERT INTO ticket_comments (ticket_id, author, comment) VALUES ($1, $2, $3)', [id, author || 'System', `Ticket reopened. Reason: ${reason}`]);
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
exports.default = router;
//# sourceMappingURL=tickets.js.map