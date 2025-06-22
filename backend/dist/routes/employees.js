"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Get employee by ID or email
router.get('/lookup/:identifier', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { identifier } = req.params;
    let query = 'SELECT * FROM employees WHERE id = $1 OR email = $1';
    let params = [identifier];
    // If identifier doesn't look like an email or employee ID, search by name
    if (!identifier.includes('@') && !identifier.startsWith('EMP')) {
        query = 'SELECT * FROM employees WHERE LOWER(name) LIKE LOWER($1)';
        params = [`%${identifier}%`];
    }
    const result = await database_1.db.query(query, params);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Employee not found', 404);
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
// Search employees
router.get('/search', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { q, department } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    let paramCount = 0;
    if (q) {
        paramCount++;
        query += ` AND (LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(email) LIKE LOWER($${paramCount}) OR LOWER(title) LIKE LOWER($${paramCount}))`;
        params.push(`%${q}%`);
    }
    if (department) {
        paramCount++;
        query += ` AND LOWER(department) = LOWER($${paramCount})`;
        params.push(department);
    }
    query += ' ORDER BY name LIMIT 50';
    const result = await database_1.db.query(query, params);
    res.json({
        success: true,
        data: result.rows
    });
}));
// Get all employees
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await database_1.db.query('SELECT * FROM employees ORDER BY name');
    res.json({
        success: true,
        data: result.rows
    });
}));
// Get employees by department
router.get('/department/:department', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { department } = req.params;
    const result = await database_1.db.query('SELECT * FROM employees WHERE LOWER(department) = LOWER($1) ORDER BY name', [department]);
    res.json({
        success: true,
        data: result.rows
    });
}));
// Get employee's manager
router.get('/:id/manager', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const employeeResult = await database_1.db.query('SELECT manager FROM employees WHERE id = $1', [id]);
    if (employeeResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Employee not found', 404);
    }
    const managerName = employeeResult.rows[0].manager;
    if (!managerName || managerName === 'CEO') {
        return res.json({
            success: true,
            data: null
        });
    }
    const managerResult = await database_1.db.query('SELECT * FROM employees WHERE name = $1', [managerName]);
    res.json({
        success: true,
        data: managerResult.rows[0] || null
    });
}));
// Validate employee ID
router.get('/validate/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await database_1.db.query('SELECT id FROM employees WHERE id = $1', [id]);
    res.json({
        success: true,
        valid: result.rows.length > 0
    });
}));
exports.default = router;
//# sourceMappingURL=employees.js.map