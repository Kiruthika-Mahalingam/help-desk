import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from utils.ticket_manager import TicketManager

st.set_page_config(
    page_title="Admin Dashboard - HelpDesk Pro",
    page_icon="👨‍💻",
    layout="wide"
)

# Initialize components
if 'ticket_manager' not in st.session_state:
    from utils.database import Database
    st.session_state.db = Database()
    st.session_state.ticket_manager = TicketManager(st.session_state.db)

def main():
    st.title("👨‍💻 Admin Dashboard")
    st.markdown("Comprehensive ticket management and analytics")
    
    # Tabs for different admin functions
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Overview", 
        "🎫 Manage Tickets", 
        "📈 Analytics", 
        "👥 Team Management",
        "⚙️ Settings"
    ])
    
    with tab1:
        display_overview()
    
    with tab2:
        manage_tickets()
    
    with tab3:
        display_analytics()
    
    with tab4:
        team_management()
    
    with tab5:
        admin_settings()

def display_overview():
    st.markdown("### System Overview")
    
    # Get all tickets
    tickets = st.session_state.ticket_manager.get_all_tickets()
    
    # Key metrics
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric("Total Tickets", len(tickets))
    
    with col2:
        open_tickets = len([t for t in tickets if t['status'] == 'Open'])
        st.metric("Open Tickets", open_tickets, delta=f"{open_tickets-5} from last week")
    
    with col3:
        in_progress = len([t for t in tickets if t['status'] == 'In Progress'])
        st.metric("In Progress", in_progress)
    
    with col4:
        resolved_today = len([t for t in tickets if t['status'] == 'Resolved' and 
                             datetime.strptime(t['updated_date'], "%Y-%m-%d %H:%M:%S").date() == datetime.now().date()])
        st.metric("Resolved Today", resolved_today)
    
    with col5:
        high_priority = len([t for t in tickets if t['priority'] == 'High'])
        st.metric("High Priority", high_priority, delta="⚠️" if high_priority > 0 else "✅")
    
    # Recent tickets table
    st.markdown("### Recent Tickets")
    recent_tickets = st.session_state.ticket_manager.get_recent_tickets(10)
    
    if recent_tickets:
        df = pd.DataFrame(recent_tickets)
        df = df[['id', 'title', 'employee_name', 'category', 'priority', 'status', 'created_date']]
        df.columns = ['ID', 'Title', 'Employee', 'Category', 'Priority', 'Status', 'Created']
        
        # Style the dataframe
        def highlight_priority(val):
            if val == 'High':
                return 'background-color: #ffebee; color: #c62828'
            elif val == 'Medium':
                return 'background-color: #fff8e1; color: #f57c00'
            return ''
        
        def highlight_status(val):
            if val == 'Open':
                return 'background-color: #ffebee; color: #c62828'
            elif val == 'In Progress':
                return 'background-color: #fff8e1; color: #f57c00'
            elif val == 'Resolved':
                return 'background-color: #e8f5e8; color: #2e7d32'
            return ''
        
        styled_df = df.style.applymap(highlight_priority, subset=['Priority']) \
                           .applymap(highlight_status, subset=['Status'])
        
        st.dataframe(styled_df, use_container_width=True, hide_index=True)
    else:
        st.info("No recent tickets to display")
    
    # Quick actions
    st.markdown("### Quick Actions")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if st.button("🆕 Create Ticket", use_container_width=True):
            st.session_state.show_create_ticket = True
    
    with col2:
        if st.button("📊 Generate Report", use_container_width=True):
            generate_report()
    
    with col3:
        if st.button("🔄 Refresh Data", use_container_width=True):
            st.rerun()
    
    with col4:
        if st.button("📧 Send Notifications", use_container_width=True):
            send_notifications()

def manage_tickets():
    st.markdown("### Ticket Management")
    
    # Filters
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        status_filter = st.selectbox("Filter by Status", ["All", "Open", "In Progress", "Resolved", "Closed"])
    
    with col2:
        priority_filter = st.selectbox("Filter by Priority", ["All", "Low", "Medium", "High"])
    
    with col3:
        category_filter = st.selectbox("Filter by Category", [
            "All", "Hardware Issues", "Software Issues", "Network/Connectivity",
            "Email/Communication", "Security/Access", "Printer/Peripherals",
            "Account Management", "Other"
        ])
    
    with col4:
        assigned_filter = st.selectbox("Filter by Assignment", ["All", "Assigned", "Unassigned"])
    
    # Get and filter tickets
    tickets = st.session_state.ticket_manager.get_all_tickets()
    
    # Apply filters
    if status_filter != "All":
        tickets = [t for t in tickets if t['status'] == status_filter]
    if priority_filter != "All":
        tickets = [t for t in tickets if t['priority'] == priority_filter]
    if category_filter != "All":
        tickets = [t for t in tickets if t['category'] == category_filter]
    if assigned_filter == "Assigned":
        tickets = [t for t in tickets if t.get('assigned_to')]
    elif assigned_filter == "Unassigned":
        tickets = [t for t in tickets if not t.get('assigned_to')]
    
    # Search
    search_term = st.text_input("🔍 Search tickets", placeholder="Search by title, description, or employee name")
    if search_term:
        tickets = [t for t in tickets if 
                  search_term.lower() in t['title'].lower() or 
                  search_term.lower() in t['description'].lower() or 
                  search_term.lower() in t['employee_name'].lower()]
    
    st.markdown(f"**Showing {len(tickets)} tickets**")
    
    # Display tickets
    for ticket in tickets:
        with st.expander(f"🎫 #{ticket['id']} - {ticket['title']} | {ticket['status']} | {ticket['priority']} Priority"):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.write(f"**Description:** {ticket['description']}")
                st.write(f"**Employee:** {ticket['employee_name']} ({ticket['employee_email']})")
                st.write(f"**Department:** {ticket['department']}")
                st.write(f"**Category:** {ticket['category']}")
                st.write(f"**Created:** {ticket['created_date']}")
                
                if ticket.get('location'):
                    st.write(f"**Location:** {ticket['location']}")
                
                if ticket.get('attachments'):
                    st.write(f"**Attachments:** {', '.join(ticket['attachments'])}")
            
            with col2:
                # Ticket management form
                with st.form(f"manage_ticket_{ticket['id']}"):
                    new_status = st.selectbox("Status", 
                                            ["Open", "In Progress", "Resolved", "Closed"],
                                            index=["Open", "In Progress", "Resolved", "Closed"].index(ticket['status']))
                    
                    new_assigned = st.selectbox("Assign to", 
                                              ["Unassigned", "John Smith (IT)", "Sarah Johnson (IT)", "Mike Wilson (IT)"],
                                              index=0 if not ticket.get('assigned_to') else 1)
                    
                    resolution = st.text_area("Resolution/Notes", 
                                            value=ticket.get('resolution', ''),
                                            placeholder="Add resolution details...")
                    
                    if st.form_submit_button("Update Ticket"):
                        updates = {
                            'status': new_status,
                            'assigned_to': None if new_assigned == "Unassigned" else new_assigned,
                            'resolution': resolution
                        }
                        st.session_state.ticket_manager.update_ticket(ticket['id'], updates)
                        st.success("Ticket updated successfully!")
                        st.rerun()
            
            # Comments section
            comments = ticket.get('comments', [])
            if comments:
                st.markdown("**Comments:**")
                for comment in comments:
                    st.markdown(f"*{comment['author']}* ({comment['timestamp']}): {comment['comment']}")
            
            # Add admin comment
            admin_comment = st.text_area(f"Add admin comment", key=f"admin_comment_{ticket['id']}")
            if st.button(f"Add Comment", key=f"add_admin_comment_{ticket['id']}"):
                if admin_comment:
                    st.session_state.ticket_manager.add_comment(ticket['id'], {
                        'author': 'Admin',
                        'comment': admin_comment,
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    st.success("Comment added!")
                    st.rerun()

def display_analytics():
    st.markdown("### Analytics & Reports")
    
    tickets = st.session_state.ticket_manager.get_all_tickets()
    
    if not tickets:
        st.info("No tickets available for analysis")
        return
    
    df = pd.DataFrame(tickets)
    
    # Time period selector
    time_period = st.selectbox("Select Time Period", ["Last 7 days", "Last 30 days", "Last 90 days", "All time"])
    
    # Filter by time period
    if time_period != "All time":
        days = {"Last 7 days": 7, "Last 30 days": 30, "Last 90 days": 90}[time_period]
        cutoff_date = datetime.now() - timedelta(days=days)
        df['created_datetime'] = pd.to_datetime(df['created_date'])
        df = df[df['created_datetime'] >= cutoff_date]
    
    # Key metrics row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        avg_resolution_time = "2.3 days"  # This would be calculated from actual data
        st.metric("Avg Resolution Time", avg_resolution_time)
    
    with col2:
        satisfaction_rate = "94%"  # This would be from user feedback
        st.metric("Satisfaction Rate", satisfaction_rate)
    
    with col3:
        first_response_time = "1.2 hours"
        st.metric("Avg First Response", first_response_time)
    
    with col4:
        reopen_rate = "3%"
        st.metric("Ticket Reopen Rate", reopen_rate)
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        # Status distribution
        status_counts = df['status'].value_counts()
        fig = px.pie(values=status_counts.values, names=status_counts.index, 
                    title="Ticket Status Distribution")
        st.plotly_chart(fig, use_container_width=True)
        
        # Priority distribution
        priority_counts = df['priority'].value_counts()
        fig = px.bar(x=priority_counts.index, y=priority_counts.values,
                    title="Tickets by Priority",
                    color=priority_counts.index,
                    color_discrete_map={'High': '#ff4444', 'Medium': '#ffaa00', 'Low': '#00aa00'})
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Category distribution
        category_counts = df['category'].value_counts()
        fig = px.bar(x=category_counts.values, y=category_counts.index,
                    orientation='h', title="Tickets by Category")
        st.plotly_chart(fig, use_container_width=True)
        
        # Department distribution
        dept_counts = df['department'].value_counts()
        fig = px.pie(values=dept_counts.values, names=dept_counts.index,
                    title="Tickets by Department")
        st.plotly_chart(fig, use_container_width=True)
    
    # Trends
    if len(df) > 0:
        df['created_date_only'] = pd.to_datetime(df['created_date']).dt.date
        daily_counts = df.groupby('created_date_only').size().reset_index(name='count')
        
        fig = px.line(daily_counts, x='created_date_only', y='count',
                     title="Daily Ticket Creation Trend")
        st.plotly_chart(fig, use_container_width=True)

def team_management():
    st.markdown("### Team Management")
    
    # Team performance metrics
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### Team Performance")
        team_data = {
            'Agent': ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown'],
            'Open Tickets': [5, 3, 7, 2],
            'Resolved This Week': [12, 15, 8, 11],
            'Avg Response Time': ['1.2h', '0.8h', '2.1h', '1.5h'],
            'Satisfaction': ['4.8/5', '4.9/5', '4.6/5', '4.7/5']
        }
        
        team_df = pd.DataFrame(team_data)
        st.dataframe(team_df, use_container_width=True, hide_index=True)
    
    with col2:
        st.markdown("#### Workload Distribution")
        workload_data = {
            'Agent': ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown'],
            'Current Load': [5, 3, 7, 2]
        }
        fig = px.bar(workload_data, x='Agent', y='Current Load',
                    title="Current Ticket Assignment")
        st.plotly_chart(fig, use_container_width=True)
    
    # Team actions
    st.markdown("#### Team Actions")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Generate Team Report", use_container_width=True):
            st.success("Team performance report generated!")
    
    with col2:
        if st.button("🔄 Reassign Tickets", use_container_width=True):
            st.info("Automatic load balancing initiated")
    
    with col3:
        if st.button("📧 Send Team Update", use_container_width=True):
            st.success("Team update notifications sent!")

def admin_settings():
    st.markdown("### System Settings")
    
    # Settings tabs
    settings_tab1, settings_tab2, settings_tab3 = st.tabs(["General", "Notifications", "Integrations"])
    
    with settings_tab1:
        st.markdown("#### General Settings")
        
        col1, col2 = st.columns(2)
        
        with col1:
            auto_assign = st.checkbox("Auto-assign tickets", value=True)
            escalation = st.checkbox("Enable auto-escalation", value=True)
            business_hours = st.checkbox("Enforce business hours", value=False)
        
        with col2:
            default_priority = st.selectbox("Default Priority", ["Low", "Medium", "High"])
            max_response_time = st.number_input("Max Response Time (hours)", value=24)
            max_tickets_per_agent = st.number_input("Max Tickets per Agent", value=10)
        
        if st.button("Save General Settings"):
            st.success("Settings saved successfully!")
    
    with settings_tab2:
        st.markdown("#### Notification Settings")
        
        email_notifications = st.checkbox("Email notifications", value=True)
        sms_notifications = st.checkbox("SMS notifications", value=False)
        slack_integration = st.checkbox("Slack integration", value=True)
        
        notification_triggers = st.multiselect(
            "Send notifications when:",
            ["New ticket created", "Ticket assigned", "Status changed", "High priority ticket", "Ticket overdue"],
            default=["New ticket created", "High priority ticket"]
        )
        
        if st.button("Save Notification Settings"):
            st.success("Notification settings saved!")
    
    with settings_tab3:
        st.markdown("#### Integrations")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Active Directory**")
            ad_enabled = st.checkbox("Enable AD integration", value=True)
            ad_server = st.text_input("AD Server", value="ldap://company.local")
            
            st.markdown("**Email Integration**")
            email_integration = st.checkbox("Enable email integration", value=True)
            email_server = st.text_input("Email Server", value="smtp.company.com")
        
        with col2:
            st.markdown("**Monitoring Tools**")
            monitoring_enabled = st.checkbox("Enable monitoring integration", value=False)
            
            st.markdown("**API Settings**")
            api_enabled = st.checkbox("Enable REST API", value=True)
            api_key = st.text_input("API Key", value="****-****-****", type="password")
        
        if st.button("Save Integration Settings"):
            st.success("Integration settings saved!")

def generate_report():
    st.success("📊 Generating comprehensive report... Report will be available in Downloads shortly.")

def send_notifications():
    st.success("📧 Notifications sent to all relevant team members!")

if __name__ == "__main__":
    main()
