import streamlit as st
import pandas as pd
from datetime import datetime
from utils.mock_ad import MockActiveDirectory
from utils.ticket_manager import TicketManager

st.set_page_config(
    page_title="Employee Portal - HelpDesk Pro",
    page_icon="🧑‍💼",
    layout="wide"
)

# Initialize components
if 'ticket_manager' not in st.session_state:
    from utils.database import Database
    st.session_state.db = Database()
    st.session_state.ticket_manager = TicketManager(st.session_state.db)

if 'mock_ad' not in st.session_state:
    st.session_state.mock_ad = MockActiveDirectory()

def main():
    st.title("🧑‍💼 Employee Portal")
    
    # Employee lookup section
    st.markdown("## Employee Lookup")
    st.markdown("Enter your employee ID or email to access your tickets:")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        search_term = st.text_input("Employee ID or Email", placeholder="e.g., EMP001 or john.doe@company.com")
    with col2:
        search_button = st.button("🔍 Lookup", use_container_width=True)
    
    employee = None
    if search_term and (search_button or 'current_employee' in st.session_state):
        employee = st.session_state.mock_ad.get_employee(search_term)
        if employee:
            st.session_state.current_employee = employee
            st.success(f"Welcome, {employee['name']}!")
        else:
            st.error("Employee not found. Please check your Employee ID or email address.")
            if 'current_employee' in st.session_state:
                del st.session_state.current_employee

    # Display employee info and portal if found
    if 'current_employee' in st.session_state:
        employee = st.session_state.current_employee
        
        # Employee information
        with st.expander("👤 Employee Information", expanded=False):
            col1, col2, col3 = st.columns(3)
            with col1:
                st.write(f"**Name:** {employee['name']}")
                st.write(f"**Employee ID:** {employee['employee_id']}")
            with col2:
                st.write(f"**Email:** {employee['email']}")
                st.write(f"**Department:** {employee['department']}")
            with col3:
                st.write(f"**Phone:** {employee['phone']}")
                st.write(f"**Manager:** {employee['manager']}")

        # Tabs for different sections
        tab1, tab2, tab3 = st.tabs(["📝 Submit New Ticket", "📋 My Tickets", "📊 My Stats"])
        
        with tab1:
            submit_ticket_form(employee)
        
        with tab2:
            display_employee_tickets(employee)
        
        with tab3:
            display_employee_stats(employee)

def submit_ticket_form(employee):
    st.markdown("### Submit a New Support Ticket")
    
    with st.form("ticket_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            title = st.text_input("Ticket Title*", placeholder="Brief description of the issue")
            category = st.selectbox("Category*", [
                "Hardware Issues",
                "Software Issues", 
                "Network/Connectivity",
                "Email/Communication",
                "Security/Access",
                "Printer/Peripherals",
                "Account Management",
                "Other"
            ])
            priority = st.selectbox("Priority*", ["Low", "Medium", "High"])
        
        with col2:
            urgency = st.selectbox("Urgency", ["Low", "Medium", "High", "Critical"])
            location = st.text_input("Location", placeholder="Building/Floor/Room")
            phone = st.text_input("Contact Phone", value=employee['phone'])
        
        description = st.text_area("Detailed Description*", 
                                 placeholder="Please provide detailed information about the issue...",
                                 height=150)
        
        # File upload
        uploaded_files = st.file_uploader("Attach Files (optional)", 
                                        accept_multiple_files=True,
                                        type=['png', 'jpg', 'jpeg', 'pdf', 'txt', 'docx'])
        
        submitted = st.form_submit_button("🎫 Submit Ticket", use_container_width=True)
        
        if submitted:
            if title and category and description:
                ticket_data = {
                    'title': title,
                    'description': description,
                    'category': category,
                    'priority': priority,
                    'urgency': urgency,
                    'location': location,
                    'phone': phone,
                    'employee_id': employee['employee_id'],
                    'employee_name': employee['name'],
                    'employee_email': employee['email'],
                    'department': employee['department'],
                    'attachments': [f.name for f in uploaded_files] if uploaded_files else []
                }
                
                ticket_id = st.session_state.ticket_manager.create_ticket(ticket_data)
                st.success(f"✅ Ticket #{ticket_id} created successfully!")
                st.balloons()
                st.rerun()
            else:
                st.error("Please fill in all required fields marked with *")

def display_employee_tickets(employee):
    st.markdown("### Your Support Tickets")
    
    # Filter options
    col1, col2, col3 = st.columns(3)
    with col1:
        status_filter = st.selectbox("Filter by Status", ["All", "Open", "In Progress", "Resolved", "Closed"])
    with col2:
        priority_filter = st.selectbox("Filter by Priority", ["All", "Low", "Medium", "High"])
    with col3:
        sort_by = st.selectbox("Sort by", ["Newest First", "Oldest First", "Priority"])
    
    # Get employee tickets
    tickets = st.session_state.ticket_manager.get_employee_tickets(employee['employee_id'])
    
    # Apply filters
    if status_filter != "All":
        tickets = [t for t in tickets if t['status'] == status_filter]
    if priority_filter != "All":
        tickets = [t for t in tickets if t['priority'] == priority_filter]
    
    # Sort tickets
    if sort_by == "Newest First":
        tickets.sort(key=lambda x: x['created_date'], reverse=True)
    elif sort_by == "Oldest First":
        tickets.sort(key=lambda x: x['created_date'])
    elif sort_by == "Priority":
        priority_order = {"High": 3, "Medium": 2, "Low": 1}
        tickets.sort(key=lambda x: priority_order.get(x['priority'], 0), reverse=True)
    
    if tickets:
        for ticket in tickets:
            with st.expander(f"🎫 #{ticket['id']} - {ticket['title']} ({ticket['status']})"):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write(f"**Status:** {ticket['status']}")
                    st.write(f"**Priority:** {ticket['priority']}")
                    st.write(f"**Category:** {ticket['category']}")
                    st.write(f"**Created:** {ticket['created_date']}")
                
                with col2:
                    st.write(f"**Assigned To:** {ticket.get('assigned_to', 'Unassigned')}")
                    st.write(f"**Last Updated:** {ticket['updated_date']}")
                    if ticket.get('location'):
                        st.write(f"**Location:** {ticket['location']}")
                
                st.write(f"**Description:** {ticket['description']}")
                
                if ticket.get('attachments'):
                    st.write(f"**Attachments:** {', '.join(ticket['attachments'])}")
                
                if ticket.get('resolution'):
                    st.write(f"**Resolution:** {ticket['resolution']}")
                
                # Add comment section
                st.markdown("**Add Comment:**")
                new_comment = st.text_area("Comment", key=f"comment_{ticket['id']}", height=100)
                if st.button("Add Comment", key=f"add_comment_{ticket['id']}"):
                    if new_comment:
                        st.session_state.ticket_manager.add_comment(ticket['id'], {
                            'author': employee['name'],
                            'comment': new_comment,
                            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        })
                        st.success("Comment added successfully!")
                        st.rerun()
    else:
        st.info("No tickets found matching your criteria.")

def display_employee_stats(employee):
    st.markdown("### Your Support Statistics")
    
    tickets = st.session_state.ticket_manager.get_employee_tickets(employee['employee_id'])
    
    if tickets:
        # Basic stats
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Tickets", len(tickets))
        
        with col2:
            open_tickets = len([t for t in tickets if t['status'] in ['Open', 'In Progress']])
            st.metric("Open Tickets", open_tickets)
        
        with col3:
            resolved_tickets = len([t for t in tickets if t['status'] in ['Resolved', 'Closed']])
            st.metric("Resolved Tickets", resolved_tickets)
        
        with col4:
            high_priority = len([t for t in tickets if t['priority'] == 'High'])
            st.metric("High Priority", high_priority)
        
        # Charts
        import plotly.express as px
        
        # Status distribution
        df = pd.DataFrame(tickets)
        status_counts = df['status'].value_counts()
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.pie(values=status_counts.values, names=status_counts.index, 
                        title="Tickets by Status")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            category_counts = df['category'].value_counts()
            fig = px.bar(x=category_counts.index, y=category_counts.values,
                        title="Tickets by Category")
            fig.update_xaxis(tickangle=45)
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No ticket statistics available yet. Submit your first ticket to see stats!")

if __name__ == "__main__":
    main()
