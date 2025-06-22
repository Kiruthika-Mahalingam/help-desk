import streamlit as st
import pandas as pd
from datetime import datetime
from utils.mock_ad import MockActiveDirectory
from utils.ticket_manager import TicketManager
from utils.database import Database

# Initialize session state
if 'db' not in st.session_state:
    st.session_state.db = Database()

if 'ticket_manager' not in st.session_state:
    st.session_state.ticket_manager = TicketManager(st.session_state.db)

if 'mock_ad' not in st.session_state:
    st.session_state.mock_ad = MockActiveDirectory()

# Page configuration
st.set_page_config(
    page_title="HelpDesk Pro",
    page_icon="🎫",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
.main-header {
    text-align: center;
    padding: 2rem 0;
    background: linear-gradient(90deg, #1f77b4, #17a2b8);
    color: white;
    margin: -1rem -1rem 2rem -1rem;
    border-radius: 0 0 10px 10px;
}

.metric-container {
    background: white;
    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid #1f77b4;
}

.ticket-card {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    margin: 0.5rem 0;
}

.status-open { color: #dc3545; font-weight: bold; }
.status-in-progress { color: #ffc107; font-weight: bold; }
.status-resolved { color: #28a745; font-weight: bold; }
.status-closed { color: #6c757d; font-weight: bold; }

.priority-high { color: #dc3545; font-weight: bold; }
.priority-medium { color: #ffc107; font-weight: bold; }
.priority-low { color: #28a745; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🎫 HelpDesk Pro</h1>
        <p>Professional IT Support & Ticket Management System</p>
    </div>
    """, unsafe_allow_html=True)

    # Welcome section
    st.markdown("## Welcome to HelpDesk Pro")
    st.markdown("""
    Our comprehensive help desk system provides seamless support for all your IT needs. 
    Choose your portal below to get started:
    """)

    # Portal selection
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        if st.button("🧑‍💼 Employee Portal", use_container_width=True):
            st.switch_page("pages/01_Employee_Portal.py")
        st.markdown("Submit tickets, track your requests, and get support")

    with col2:
        if st.button("👨‍💻 Admin Dashboard", use_container_width=True):
            st.switch_page("pages/02_Admin_Dashboard.py")
        st.markdown("Manage tickets, view analytics, and oversee operations")

    with col3:
        st.markdown("### Quick Stats")
        tickets = st.session_state.ticket_manager.get_all_tickets()
        total_tickets = len(tickets)
        open_tickets = len([t for t in tickets if t['status'] == 'Open'])
        
        st.metric("Total Tickets", total_tickets)
        st.metric("Open Tickets", open_tickets)

    # Recent activity
    st.markdown("## Recent Activity")
    recent_tickets = st.session_state.ticket_manager.get_recent_tickets(5)
    
    if recent_tickets:
        for ticket in recent_tickets:
            status_class = f"status-{ticket['status'].lower().replace(' ', '-')}"
            priority_class = f"priority-{ticket['priority'].lower()}"
            
            st.markdown(f"""
            <div class="ticket-card">
                <strong>#{ticket['id']}</strong> - {ticket['title']}<br>
                <small>Status: <span class="{status_class}">{ticket['status']}</span> | 
                Priority: <span class="{priority_class}">{ticket['priority']}</span> | 
                Created: {ticket['created_date']}</small>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("No recent tickets to display")

    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 1rem;">
        <p>HelpDesk Pro © 2025 | Professional IT Support System</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
