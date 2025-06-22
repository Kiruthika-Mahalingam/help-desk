"""
Simple in-memory database for storing tickets and system data
In a production environment, this would be replaced with a proper database
"""

import json
import os
from datetime import datetime

class Database:
    def __init__(self):
        self.data_file = "helpdesk_data.json"
        self.data = self.load_data()
    
    def load_data(self):
        """Load data from file or create initial structure"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        
        # Return default data structure with some sample tickets
        return {
            'tickets': [
                {
                    'id': '0001',
                    'title': 'Computer won\'t start',
                    'description': 'My desktop computer won\'t turn on this morning. No lights or sounds when pressing power button.',
                    'category': 'Hardware Issues',
                    'priority': 'High',
                    'urgency': 'High',
                    'status': 'Open',
                    'employee_id': 'EMP001',
                    'employee_name': 'John Doe',
                    'employee_email': 'john.doe@company.com',
                    'department': 'Information Technology',
                    'location': 'Building A, Floor 3, Desk 15',
                    'phone': '+1-555-0101',
                    'created_date': '2025-06-20 09:15:30',
                    'updated_date': '2025-06-20 09:15:30',
                    'assigned_to': None,
                    'resolution': '',
                    'attachments': [],
                    'comments': []
                },
                {
                    'id': '0002',
                    'title': 'Email not syncing on mobile device',
                    'description': 'Unable to receive emails on my iPhone. Last sync was yesterday evening.',
                    'category': 'Email/Communication',
                    'priority': 'Medium',
                    'urgency': 'Medium',
                    'status': 'In Progress',
                    'employee_id': 'EMP004',
                    'employee_name': 'Alice Brown',
                    'employee_email': 'alice.brown@company.com',
                    'department': 'Human Resources',
                    'location': 'Building B, Floor 2',
                    'phone': '+1-555-0201',
                    'created_date': '2025-06-19 14:30:15',
                    'updated_date': '2025-06-20 10:45:22',
                    'assigned_to': 'John Smith (IT)',
                    'resolution': '',
                    'attachments': [],
                    'comments': [
                        {
                            'author': 'John Smith (IT)',
                            'comment': 'Checking Exchange server settings. Will update shortly.',
                            'timestamp': '2025-06-20 10:45:22'
                        }
                    ]
                },
                {
                    'id': '0003',
                    'title': 'Printer offline in accounting department',
                    'description': 'The main printer in accounting shows as offline. Cannot print invoices.',
                    'category': 'Printer/Peripherals',
                    'priority': 'Medium',
                    'urgency': 'High',
                    'status': 'Resolved',
                    'employee_id': 'EMP006',
                    'employee_name': 'David Miller',
                    'employee_email': 'david.miller@company.com',
                    'department': 'Finance',
                    'location': 'Building C, Floor 1',
                    'phone': '+1-555-0301',
                    'created_date': '2025-06-18 11:20:45',
                    'updated_date': '2025-06-19 16:30:12',
                    'assigned_to': 'Sarah Johnson (IT)',
                    'resolution': 'Printer driver was corrupted. Reinstalled drivers and printer is now working normally.',
                    'attachments': [],
                    'comments': [
                        {
                            'author': 'Sarah Johnson (IT)',
                            'comment': 'Investigating printer connection issues.',
                            'timestamp': '2025-06-18 13:15:30'
                        },
                        {
                            'author': 'Sarah Johnson (IT)',
                            'comment': 'Found driver corruption. Reinstalling now.',
                            'timestamp': '2025-06-19 16:25:45'
                        }
                    ]
                },
                {
                    'id': '0004',
                    'title': 'VPN connection keeps dropping',
                    'description': 'VPN connection disconnects every 10-15 minutes when working from home.',
                    'category': 'Network/Connectivity',
                    'priority': 'Medium',
                    'urgency': 'Medium',
                    'status': 'Open',
                    'employee_id': 'EMP008',
                    'employee_name': 'Michael Taylor',
                    'employee_email': 'michael.taylor@company.com',
                    'department': 'Marketing',
                    'location': 'Remote - Home Office',
                    'phone': '+1-555-0401',
                    'created_date': '2025-06-21 08:45:10',
                    'updated_date': '2025-06-21 08:45:10',
                    'assigned_to': None,
                    'resolution': '',
                    'attachments': [],
                    'comments': []
                },
                {
                    'id': '0005',
                    'title': 'Need access to new project folder',
                    'description': 'Require access to the Project Phoenix shared folder for the new marketing campaign.',
                    'category': 'Security/Access',
                    'priority': 'Low',
                    'urgency': 'Low',
                    'status': 'Closed',
                    'employee_id': 'EMP008',
                    'employee_name': 'Michael Taylor',
                    'employee_email': 'michael.taylor@company.com',
                    'department': 'Marketing',
                    'location': 'Building D, Floor 2',
                    'phone': '+1-555-0401',
                    'created_date': '2025-06-17 13:20:35',
                    'updated_date': '2025-06-18 09:15:22',
                    'assigned_to': 'Mike Wilson (IT)',
                    'resolution': 'Access granted to Project Phoenix folder. User can now access all required documents.',
                    'attachments': [],
                    'comments': [
                        {
                            'author': 'Mike Wilson (IT)',
                            'comment': 'Verifying permissions with manager.',
                            'timestamp': '2025-06-17 15:30:12'
                        },
                        {
                            'author': 'Mike Wilson (IT)',
                            'comment': 'Approval received. Granting access now.',
                            'timestamp': '2025-06-18 09:10:45'
                        }
                    ]
                }
            ],
            'settings': {
                'auto_assign': True,
                'escalation_enabled': True,
                'business_hours_only': False,
                'default_priority': 'Medium',
                'max_response_time': 24,
                'notification_settings': {
                    'email_enabled': True,
                    'sms_enabled': False,
                    'slack_enabled': True
                }
            }
        }
    
    def save_data(self):
        """Save data to file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.data, f, indent=2)
        except IOError:
            pass  # Handle file write errors gracefully
    
    def get_tickets(self):
        """Get all tickets"""
        return self.data.get('tickets', [])
    
    def add_ticket(self, ticket):
        """Add a new ticket"""
        if 'tickets' not in self.data:
            self.data['tickets'] = []
        
        self.data['tickets'].append(ticket)
        self.save_data()
    
    def update_tickets(self, tickets):
        """Update all tickets"""
        self.data['tickets'] = tickets
        self.save_data()
    
    def get_settings(self):
        """Get system settings"""
        return self.data.get('settings', {})
    
    def update_settings(self, settings):
        """Update system settings"""
        self.data['settings'] = settings
        self.save_data()
    
    def backup_data(self):
        """Create a backup of current data"""
        backup_filename = f"helpdesk_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(backup_filename, 'w') as f:
                json.dump(self.data, f, indent=2)
            return backup_filename
        except IOError:
            return None
    
    def restore_data(self, backup_file):
        """Restore data from backup"""
        try:
            with open(backup_file, 'r') as f:
                self.data = json.load(f)
            self.save_data()
            return True
        except (IOError, json.JSONDecodeError):
            return False
    
    def clear_all_data(self):
        """Clear all data (use with caution)"""
        self.data = {
            'tickets': [],
            'settings': {
                'auto_assign': True,
                'escalation_enabled': True,
                'business_hours_only': False,
                'default_priority': 'Medium',
                'max_response_time': 24
            }
        }
        self.save_data()
    
    def get_statistics(self):
        """Get database statistics"""
        tickets = self.get_tickets()
        return {
            'total_tickets': len(tickets),
            'data_file_size': os.path.getsize(self.data_file) if os.path.exists(self.data_file) else 0,
            'last_modified': datetime.fromtimestamp(
                os.path.getmtime(self.data_file)
            ).strftime('%Y-%m-%d %H:%M:%S') if os.path.exists(self.data_file) else 'Never'
        }
