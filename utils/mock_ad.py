"""
Mock Active Directory integration for employee lookup
"""

class MockActiveDirectory:
    def __init__(self):
        # Mock employee database
        self.employees = {
            'EMP001': {
                'employee_id': 'EMP001',
                'name': 'John Doe',
                'email': 'john.doe@company.com',
                'department': 'Information Technology',
                'phone': '+1-555-0101',
                'manager': 'Jane Smith',
                'location': 'Building A, Floor 3',
                'title': 'Software Developer'
            },
            'EMP002': {
                'employee_id': 'EMP002',
                'name': 'Jane Smith',
                'email': 'jane.smith@company.com',
                'department': 'Information Technology',
                'phone': '+1-555-0102',
                'manager': 'Bob Johnson',
                'location': 'Building A, Floor 3',
                'title': 'IT Manager'
            },
            'EMP003': {
                'employee_id': 'EMP003',
                'name': 'Bob Johnson',
                'email': 'bob.johnson@company.com',
                'department': 'Information Technology',
                'phone': '+1-555-0103',
                'manager': 'CEO',
                'location': 'Building A, Floor 4',
                'title': 'IT Director'
            },
            'EMP004': {
                'employee_id': 'EMP004',
                'name': 'Alice Brown',
                'email': 'alice.brown@company.com',
                'department': 'Human Resources',
                'phone': '+1-555-0201',
                'manager': 'Carol Wilson',
                'location': 'Building B, Floor 2',
                'title': 'HR Specialist'
            },
            'EMP005': {
                'employee_id': 'EMP005',
                'name': 'Carol Wilson',
                'email': 'carol.wilson@company.com',
                'department': 'Human Resources',
                'phone': '+1-555-0202',
                'manager': 'CEO',
                'location': 'Building B, Floor 2',
                'title': 'HR Manager'
            },
            'EMP006': {
                'employee_id': 'EMP006',
                'name': 'David Miller',
                'email': 'david.miller@company.com',
                'department': 'Finance',
                'phone': '+1-555-0301',
                'manager': 'Sarah Davis',
                'location': 'Building C, Floor 1',
                'title': 'Financial Analyst'
            },
            'EMP007': {
                'employee_id': 'EMP007',
                'name': 'Sarah Davis',
                'email': 'sarah.davis@company.com',
                'department': 'Finance',
                'phone': '+1-555-0302',
                'manager': 'CEO',
                'location': 'Building C, Floor 1',
                'title': 'Finance Manager'
            },
            'EMP008': {
                'employee_id': 'EMP008',
                'name': 'Michael Taylor',
                'email': 'michael.taylor@company.com',
                'department': 'Marketing',
                'phone': '+1-555-0401',
                'manager': 'Lisa Anderson',
                'location': 'Building D, Floor 2',
                'title': 'Marketing Specialist'
            },
            'EMP009': {
                'employee_id': 'EMP009',
                'name': 'Lisa Anderson',
                'email': 'lisa.anderson@company.com',
                'department': 'Marketing',
                'phone': '+1-555-0402',
                'manager': 'CEO',
                'location': 'Building D, Floor 2',
                'title': 'Marketing Manager'
            },
            'EMP010': {
                'employee_id': 'EMP010',
                'name': 'Robert Chen',
                'email': 'robert.chen@company.com',
                'department': 'Operations',
                'phone': '+1-555-0501',
                'manager': 'Jennifer Lee',
                'location': 'Building E, Floor 1',
                'title': 'Operations Coordinator'
            }
        }
        
        # Create email-to-employee mapping for quick lookup
        self.email_mapping = {}
        for emp_id, emp_data in self.employees.items():
            self.email_mapping[emp_data['email']] = emp_id
    
    def get_employee(self, identifier):
        """
        Get employee information by employee ID or email
        
        Args:
            identifier (str): Employee ID or email address
            
        Returns:
            dict: Employee information or None if not found
        """
        # Try direct lookup by employee ID
        if identifier.upper() in self.employees:
            return self.employees[identifier.upper()]
        
        # Try lookup by email
        if identifier.lower() in self.email_mapping:
            emp_id = self.email_mapping[identifier.lower()]
            return self.employees[emp_id]
        
        # Try partial matching
        for emp_id, emp_data in self.employees.items():
            if (identifier.lower() in emp_data['name'].lower() or 
                identifier.lower() in emp_data['email'].lower()):
                return emp_data
        
        return None
    
    def get_all_employees(self):
        """
        Get all employees
        
        Returns:
            list: List of all employee records
        """
        return list(self.employees.values())
    
    def get_employees_by_department(self, department):
        """
        Get employees by department
        
        Args:
            department (str): Department name
            
        Returns:
            list: List of employees in the department
        """
        return [emp for emp in self.employees.values() 
                if emp['department'].lower() == department.lower()]
    
    def get_employee_manager(self, employee_id):
        """
        Get employee's manager information
        
        Args:
            employee_id (str): Employee ID
            
        Returns:
            dict: Manager information or None if not found
        """
        employee = self.get_employee(employee_id)
        if not employee:
            return None
        
        manager_name = employee['manager']
        
        # Find manager by name
        for emp in self.employees.values():
            if emp['name'] == manager_name:
                return emp
        
        return None
    
    def validate_employee(self, employee_id):
        """
        Validate if employee ID exists
        
        Args:
            employee_id (str): Employee ID to validate
            
        Returns:
            bool: True if employee exists, False otherwise
        """
        return employee_id.upper() in self.employees
    
    def search_employees(self, query):
        """
        Search employees by name, email, or department
        
        Args:
            query (str): Search query
            
        Returns:
            list: List of matching employees
        """
        query = query.lower()
        results = []
        
        for emp in self.employees.values():
            if (query in emp['name'].lower() or 
                query in emp['email'].lower() or 
                query in emp['department'].lower() or
                query in emp['title'].lower()):
                results.append(emp)
        
        return results
