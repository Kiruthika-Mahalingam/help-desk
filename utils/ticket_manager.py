"""
Ticket Management System
Handles all ticket operations including creation, updates, and retrieval
"""

from datetime import datetime
import uuid

class TicketManager:
    def __init__(self, database):
        self.db = database
    
    def create_ticket(self, ticket_data):
        """
        Create a new support ticket
        
        Args:
            ticket_data (dict): Ticket information
            
        Returns:
            str: Generated ticket ID
        """
        ticket_id = str(len(self.db.get_tickets()) + 1).zfill(4)
        
        ticket = {
            'id': ticket_id,
            'title': ticket_data['title'],
            'description': ticket_data['description'],
            'category': ticket_data['category'],
            'priority': ticket_data['priority'],
            'urgency': ticket_data.get('urgency', 'Medium'),
            'status': 'Open',
            'employee_id': ticket_data['employee_id'],
            'employee_name': ticket_data['employee_name'],
            'employee_email': ticket_data['employee_email'],
            'department': ticket_data['department'],
            'location': ticket_data.get('location', ''),
            'phone': ticket_data.get('phone', ''),
            'created_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'assigned_to': None,
            'resolution': '',
            'attachments': ticket_data.get('attachments', []),
            'comments': []
        }
        
        self.db.add_ticket(ticket)
        return ticket_id
    
    def get_ticket(self, ticket_id):
        """
        Get a specific ticket by ID
        
        Args:
            ticket_id (str): Ticket ID
            
        Returns:
            dict: Ticket information or None if not found
        """
        tickets = self.db.get_tickets()
        for ticket in tickets:
            if ticket['id'] == ticket_id:
                return ticket
        return None
    
    def get_all_tickets(self):
        """
        Get all tickets
        
        Returns:
            list: List of all tickets
        """
        return self.db.get_tickets()
    
    def get_employee_tickets(self, employee_id):
        """
        Get all tickets for a specific employee
        
        Args:
            employee_id (str): Employee ID
            
        Returns:
            list: List of employee's tickets
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if ticket['employee_id'] == employee_id]
    
    def get_recent_tickets(self, limit=10):
        """
        Get recent tickets
        
        Args:
            limit (int): Number of tickets to return
            
        Returns:
            list: List of recent tickets
        """
        tickets = self.db.get_tickets()
        # Sort by created date (most recent first)
        sorted_tickets = sorted(tickets, 
                              key=lambda x: datetime.strptime(x['created_date'], "%Y-%m-%d %H:%M:%S"), 
                              reverse=True)
        return sorted_tickets[:limit]
    
    def update_ticket(self, ticket_id, updates):
        """
        Update a ticket
        
        Args:
            ticket_id (str): Ticket ID
            updates (dict): Fields to update
            
        Returns:
            bool: True if updated successfully, False otherwise
        """
        tickets = self.db.get_tickets()
        for i, ticket in enumerate(tickets):
            if ticket['id'] == ticket_id:
                # Update specified fields
                for field, value in updates.items():
                    if field in ticket:
                        ticket[field] = value
                
                # Always update the modified timestamp
                ticket['updated_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Update in database
                tickets[i] = ticket
                self.db.update_tickets(tickets)
                return True
        return False
    
    def add_comment(self, ticket_id, comment_data):
        """
        Add a comment to a ticket
        
        Args:
            ticket_id (str): Ticket ID
            comment_data (dict): Comment information
            
        Returns:
            bool: True if comment added successfully, False otherwise
        """
        tickets = self.db.get_tickets()
        for i, ticket in enumerate(tickets):
            if ticket['id'] == ticket_id:
                if 'comments' not in ticket:
                    ticket['comments'] = []
                
                ticket['comments'].append(comment_data)
                ticket['updated_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Update in database
                tickets[i] = ticket
                self.db.update_tickets(tickets)
                return True
        return False
    
    def get_tickets_by_status(self, status):
        """
        Get tickets by status
        
        Args:
            status (str): Ticket status
            
        Returns:
            list: List of tickets with specified status
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if ticket['status'] == status]
    
    def get_tickets_by_priority(self, priority):
        """
        Get tickets by priority
        
        Args:
            priority (str): Ticket priority
            
        Returns:
            list: List of tickets with specified priority
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if ticket['priority'] == priority]
    
    def get_tickets_by_category(self, category):
        """
        Get tickets by category
        
        Args:
            category (str): Ticket category
            
        Returns:
            list: List of tickets in specified category
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if ticket['category'] == category]
    
    def get_assigned_tickets(self, assignee):
        """
        Get tickets assigned to a specific person
        
        Args:
            assignee (str): Assignee name
            
        Returns:
            list: List of assigned tickets
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if ticket.get('assigned_to') == assignee]
    
    def get_unassigned_tickets(self):
        """
        Get all unassigned tickets
        
        Returns:
            list: List of unassigned tickets
        """
        tickets = self.db.get_tickets()
        return [ticket for ticket in tickets if not ticket.get('assigned_to')]
    
    def search_tickets(self, query):
        """
        Search tickets by title, description, or employee name
        
        Args:
            query (str): Search query
            
        Returns:
            list: List of matching tickets
        """
        tickets = self.db.get_tickets()
        query = query.lower()
        results = []
        
        for ticket in tickets:
            if (query in ticket['title'].lower() or 
                query in ticket['description'].lower() or 
                query in ticket['employee_name'].lower() or
                query in ticket['category'].lower()):
                results.append(ticket)
        
        return results
    
    def get_ticket_statistics(self):
        """
        Get ticket statistics
        
        Returns:
            dict: Statistics about tickets
        """
        tickets = self.db.get_tickets()
        
        stats = {
            'total': len(tickets),
            'open': len([t for t in tickets if t['status'] == 'Open']),
            'in_progress': len([t for t in tickets if t['status'] == 'In Progress']),
            'resolved': len([t for t in tickets if t['status'] == 'Resolved']),
            'closed': len([t for t in tickets if t['status'] == 'Closed']),
            'high_priority': len([t for t in tickets if t['priority'] == 'High']),
            'medium_priority': len([t for t in tickets if t['priority'] == 'Medium']),
            'low_priority': len([t for t in tickets if t['priority'] == 'Low']),
            'unassigned': len([t for t in tickets if not t.get('assigned_to')])
        }
        
        return stats
    
    def close_ticket(self, ticket_id, resolution):
        """
        Close a ticket with resolution
        
        Args:
            ticket_id (str): Ticket ID
            resolution (str): Resolution details
            
        Returns:
            bool: True if closed successfully, False otherwise
        """
        updates = {
            'status': 'Closed',
            'resolution': resolution
        }
        return self.update_ticket(ticket_id, updates)
    
    def reopen_ticket(self, ticket_id, reason):
        """
        Reopen a closed ticket
        
        Args:
            ticket_id (str): Ticket ID
            reason (str): Reason for reopening
            
        Returns:
            bool: True if reopened successfully, False otherwise
        """
        comment_data = {
            'author': 'System',
            'comment': f'Ticket reopened. Reason: {reason}',
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Add comment about reopening
        self.add_comment(ticket_id, comment_data)
        
        # Update status
        updates = {
            'status': 'Open',
            'assigned_to': None
        }
        return self.update_ticket(ticket_id, updates)
