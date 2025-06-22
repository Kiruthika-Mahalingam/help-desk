import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.query('SELECT NOW()');
      console.log('Database connection established');

      // Create tables
      await this.createTables();
      await this.seedInitialData();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createTablesQuery = `
      -- Employees table (mock AD data)
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        manager VARCHAR(255),
        location VARCHAR(255),
        title VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Tickets table
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
        urgency VARCHAR(20) NOT NULL DEFAULT 'Medium',
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        employee_id VARCHAR(10) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        employee_email VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        phone VARCHAR(20),
        assigned_to VARCHAR(255),
        resolution TEXT,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        author VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );

      -- System settings table
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_tickets_employee_id ON tickets(employee_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
      CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

      -- Create trigger to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
      CREATE TRIGGER update_tickets_updated_at
        BEFORE UPDATE ON tickets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await this.query(createTablesQuery);
    console.log('Database tables created successfully');
  }

  private async seedInitialData(): Promise<void> {
    // Check if employees already exist
    const existingEmployees = await this.query('SELECT COUNT(*) FROM employees');
    if (parseInt(existingEmployees.rows[0].count) > 0) {
      console.log('Initial data already exists, skipping seed');
      return;
    }

    console.log('Seeding initial data...');

    // Insert employees
    const employeesData = [
      ['EMP001', 'John Doe', 'john.doe@company.com', 'Information Technology', '+1-555-0101', 'Jane Smith', 'Building A, Floor 3', 'Software Developer'],
      ['EMP002', 'Jane Smith', 'jane.smith@company.com', 'Information Technology', '+1-555-0102', 'Bob Johnson', 'Building A, Floor 3', 'IT Manager'],
      ['EMP003', 'Bob Johnson', 'bob.johnson@company.com', 'Information Technology', '+1-555-0103', 'CEO', 'Building A, Floor 4', 'IT Director'],
      ['EMP004', 'Alice Brown', 'alice.brown@company.com', 'Human Resources', '+1-555-0201', 'Carol Wilson', 'Building B, Floor 2', 'HR Specialist'],
      ['EMP005', 'Carol Wilson', 'carol.wilson@company.com', 'Human Resources', '+1-555-0202', 'CEO', 'Building B, Floor 2', 'HR Manager'],
      ['EMP006', 'David Miller', 'david.miller@company.com', 'Finance', '+1-555-0301', 'Sarah Davis', 'Building C, Floor 1', 'Financial Analyst'],
      ['EMP007', 'Sarah Davis', 'sarah.davis@company.com', 'Finance', '+1-555-0302', 'CEO', 'Building C, Floor 1', 'Finance Manager'],
      ['EMP008', 'Michael Taylor', 'michael.taylor@company.com', 'Marketing', '+1-555-0401', 'Lisa Anderson', 'Building D, Floor 2', 'Marketing Specialist'],
      ['EMP009', 'Lisa Anderson', 'lisa.anderson@company.com', 'Marketing', '+1-555-0402', 'CEO', 'Building D, Floor 2', 'Marketing Manager'],
      ['EMP010', 'Robert Chen', 'robert.chen@company.com', 'Operations', '+1-555-0501', 'Jennifer Lee', 'Building E, Floor 1', 'Operations Coordinator']
    ];

    for (const employee of employeesData) {
      await this.query(
        'INSERT INTO employees (id, name, email, department, phone, manager, location, title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        employee
      );
    }

    // Insert sample tickets
    const sampleTickets = [
      {
        title: 'Computer won\'t start',
        description: 'My desktop computer won\'t turn on this morning. No lights or sounds when pressing power button.',
        category: 'Hardware Issues',
        priority: 'High',
        urgency: 'High',
        status: 'Open',
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        employee_email: 'john.doe@company.com',
        department: 'Information Technology',
        location: 'Building A, Floor 3, Desk 15',
        phone: '+1-555-0101'
      },
      {
        title: 'Email not syncing on mobile device',
        description: 'Unable to receive emails on my iPhone. Last sync was yesterday evening.',
        category: 'Email/Communication',
        priority: 'Medium',
        urgency: 'Medium',
        status: 'In Progress',
        employee_id: 'EMP004',
        employee_name: 'Alice Brown',
        employee_email: 'alice.brown@company.com',
        department: 'Human Resources',
        location: 'Building B, Floor 2',
        phone: '+1-555-0201',
        assigned_to: 'John Smith (IT)'
      },
      {
        title: 'Printer offline in accounting department',
        description: 'The main printer in accounting shows as offline. Cannot print invoices.',
        category: 'Printer/Peripherals',
        priority: 'Medium',
        urgency: 'High',
        status: 'Resolved',
        employee_id: 'EMP006',
        employee_name: 'David Miller',
        employee_email: 'david.miller@company.com',
        department: 'Finance',
        location: 'Building C, Floor 1',
        phone: '+1-555-0301',
        assigned_to: 'Sarah Johnson (IT)',
        resolution: 'Printer driver was corrupted. Reinstalled drivers and printer is now working normally.'
      }
    ];

    for (const ticket of sampleTickets) {
      const result = await this.query(
        `INSERT INTO tickets (title, description, category, priority, urgency, status, employee_id, 
         employee_name, employee_email, department, location, phone, assigned_to, resolution) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [ticket.title, ticket.description, ticket.category, ticket.priority, ticket.urgency,
         ticket.status, ticket.employee_id, ticket.employee_name, ticket.employee_email,
         ticket.department, ticket.location, ticket.phone, ticket.assigned_to, ticket.resolution]
      );

      // Add sample comments for some tickets
      if (ticket.status === 'In Progress' || ticket.status === 'Resolved') {
        await this.query(
          'INSERT INTO ticket_comments (ticket_id, author, comment) VALUES ($1, $2, $3)',
          [result.rows[0].id, ticket.assigned_to, 'Working on this issue now.']
        );
      }
    }

    // Insert default system settings
    const defaultSettings = [
      ['auto_assign', '{"enabled": true}'],
      ['escalation_enabled', '{"enabled": true}'],
      ['business_hours_only', '{"enabled": false}'],
      ['default_priority', '{"value": "Medium"}'],
      ['max_response_time', '{"hours": 24}'],
      ['notification_settings', '{"email_enabled": true, "sms_enabled": false, "slack_enabled": true}']
    ];

    for (const [key, value] of defaultSettings) {
      await this.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING',
        [key, value]
      );
    }

    console.log('Initial data seeded successfully');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();