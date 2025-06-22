import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Ticket, Users, TrendingUp, Clock } from 'lucide-react'
import { ticketService } from '../services/api'

export default function HomePage() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => ticketService.getStats(),
  })

  const { data: recentTickets } = useQuery({
    queryKey: ['tickets', 'recent'],
    queryFn: () => ticketService.getRecent(5),
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to HelpDesk Pro</h1>
        <p className="text-xl text-primary-100 mb-6">
          Professional IT Support & Ticket Management System
        </p>
        <p className="text-lg text-primary-200">
          Get seamless support for all your IT needs. Choose your portal below to get started.
        </p>
      </div>

      {/* Portal Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/employee" className="group">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Ticket className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                Employee Portal
              </h3>
            </div>
            <p className="text-gray-600">
              Submit tickets, track your requests, and get support for all your IT needs.
            </p>
          </div>
        </Link>

        <Link to="/admin" className="group">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                Admin Dashboard
              </h3>
            </div>
            <p className="text-gray-600">
              Manage tickets, view analytics, oversee operations, and handle team management.
            </p>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              Quick Stats
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tickets</span>
              <span className="font-semibold">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open Tickets</span>
              <span className="font-semibold text-danger-600">{stats?.open || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress</span>
              <span className="font-semibold text-warning-600">{stats?.in_progress || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolved</span>
              <span className="font-semibold text-success-600">{stats?.resolved || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Clock className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        {recentTickets && recentTickets.length > 0 ? (
          <div className="space-y-4">
            {recentTickets.map((ticket: any) => (
              <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      #{ticket.id} - {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {ticket.employee_name} • {ticket.department}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`status-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                      {ticket.status}
                    </span>
                    <span className={`priority-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Created: {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent tickets to display</p>
          </div>
        )}
      </div>
    </div>
  )
}