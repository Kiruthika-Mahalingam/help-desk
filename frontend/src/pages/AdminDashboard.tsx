import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  BarChart3, 
  Users, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  Search,
  Filter
} from 'lucide-react'
import { adminService, ticketService } from '../services/api'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'analytics' | 'team' | 'settings'>('overview')
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assigned_to: '',
    search: ''
  })

  const queryClient = useQueryClient()

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
  })

  const { data: teamPerformance } = useQuery({
    queryKey: ['admin', 'team', 'performance'],
    queryFn: () => adminService.getTeamPerformance(),
  })

  const { data: allTickets = [] } = useQuery({
    queryKey: ['tickets', 'all', ticketFilters],
    queryFn: () => ticketService.getAll(ticketFilters),
  })

  const { data: trends } = useQuery({
    queryKey: ['admin', 'trends'],
    queryFn: () => adminService.getTrends(30),
  })

  // Mutations
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      ticketService.update(id, updates),
    onSuccess: () => {
      toast.success('Ticket updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: () => {
      toast.error('Failed to update ticket')
    }
  })

  const autoAssignMutation = useMutation({
    mutationFn: () => adminService.autoAssign(),
    onSuccess: (data) => {
      toast.success(`${data.data.length} tickets auto-assigned`)
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: () => {
      toast.error('Failed to auto-assign tickets')
    }
  })

  const handleUpdateTicket = (ticketId: number, updates: any) => {
    updateTicketMutation.mutate({ id: ticketId, updates })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Open': 'text-red-600 bg-red-50',
      'In Progress': 'text-yellow-600 bg-yellow-50',
      'Resolved': 'text-green-600 bg-green-50',
      'Closed': 'text-gray-600 bg-gray-50'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'High': 'text-red-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const filteredTickets = allTickets.filter(ticket => {
    const matchesSearch = !ticketFilters.search || 
      ticket.title.toLowerCase().includes(ticketFilters.search.toLowerCase()) ||
      ticket.employee_name.toLowerCase().includes(ticketFilters.search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(ticketFilters.search.toLowerCase())
    
    const matchesStatus = !ticketFilters.status || ticket.status === ticketFilters.status
    const matchesPriority = !ticketFilters.priority || ticket.priority === ticketFilters.priority
    const matchesCategory = !ticketFilters.category || ticket.category === ticketFilters.category
    const matchesAssigned = !ticketFilters.assigned_to || 
      (ticketFilters.assigned_to === 'unassigned' ? !ticket.assigned_to : ticket.assigned_to === ticketFilters.assigned_to)

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Comprehensive ticket management and analytics</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tickets', label: 'Manage Tickets', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'team', label: 'Team Management', icon: UserCheck },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">{stats?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Tickets</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-600">{stats?.open || 0}</div>
              <div className="text-sm text-gray-600">Open Tickets</div>
              <div className="text-xs text-gray-500 mt-1">+5 from last week</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.in_progress || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</div>
              <div className="text-sm text-gray-600">Resolved Today</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-600">{stats?.high_priority || 0}</div>
              <div className="text-sm text-gray-600">High Priority</div>
              <div className="text-xs text-red-500 mt-1">
                {stats?.high_priority && stats.high_priority > 0 ? '⚠️' : '✅'}
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Tickets</h2>
              <div className="flex space-x-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => autoAssignMutation.mutate()}
                  disabled={autoAssignMutation.isPending}
                >
                  🔄 Auto-Assign
                </button>
                <button className="btn btn-secondary">📊 Generate Report</button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID & Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allTickets.slice(0, 10).map((ticket: any) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{ticket.id}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ticket.employee_name}</div>
                        <div className="text-sm text-gray-500">{ticket.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Management Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Filter Tickets</h3>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <select 
                className="select"
                value={ticketFilters.status}
                onChange={(e) => setTicketFilters({...ticketFilters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select 
                className="select"
                value={ticketFilters.priority}
                onChange={(e) => setTicketFilters({...ticketFilters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select 
                className="select"
                value={ticketFilters.category}
                onChange={(e) => setTicketFilters({...ticketFilters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                <option value="Hardware Issues">Hardware Issues</option>
                <option value="Software Issues">Software Issues</option>
                <option value="Network/Connectivity">Network/Connectivity</option>
                <option value="Email/Communication">Email/Communication</option>
                <option value="Security/Access">Security/Access</option>
                <option value="Printer/Peripherals">Printer/Peripherals</option>
                <option value="Account Management">Account Management</option>
                <option value="Other">Other</option>
              </select>

              <select 
                className="select"
                value={ticketFilters.assigned_to}
                onChange={(e) => setTicketFilters({...ticketFilters, assigned_to: e.target.value})}
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="John Smith (IT)">John Smith (IT)</option>
                <option value="Sarah Johnson (IT)">Sarah Johnson (IT)</option>
                <option value="Mike Wilson (IT)">Mike Wilson (IT)</option>
                <option value="Lisa Brown (IT)">Lisa Brown (IT)</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search tickets by title, description, or employee name..."
                value={ticketFilters.search}
                onChange={(e) => setTicketFilters({...ticketFilters, search: e.target.value})}
              />
            </div>
          </div>

          {/* Tickets List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Tickets ({filteredTickets.length})
              </h3>
            </div>

            <div className="space-y-4">
              {filteredTickets.map((ticket: any) => (
                <div key={ticket.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        #{ticket.id} - {ticket.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {ticket.employee_name} • {ticket.department}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{ticket.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select 
                        className="select text-sm"
                        value={ticket.status}
                        onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value })}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assign to</label>
                      <select 
                        className="select text-sm"
                        value={ticket.assigned_to || ''}
                        onChange={(e) => handleUpdateTicket(ticket.id, { assigned_to: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        <option value="John Smith (IT)">John Smith (IT)</option>
                        <option value="Sarah Johnson (IT)">Sarah Johnson (IT)</option>
                        <option value="Mike Wilson (IT)">Mike Wilson (IT)</option>
                        <option value="Lisa Brown (IT)">Lisa Brown (IT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select 
                        className="select text-sm"
                        value={ticket.priority}
                        onChange={(e) => handleUpdateTicket(ticket.id, { priority: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Resolution Notes</label>
                    <textarea
                      className="textarea text-sm"
                      rows={2}
                      placeholder="Add resolution details..."
                      defaultValue={ticket.resolution || ''}
                      onBlur={(e) => {
                        if (e.target.value !== ticket.resolution) {
                          handleUpdateTicket(ticket.id, { resolution: e.target.value })
                        }
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Created: {new Date(ticket.created_at).toLocaleString()} • 
                    Last Updated: {new Date(ticket.updated_at).toLocaleString()}
                    {ticket.location && ` • Location: ${ticket.location}`}
                  </div>
                </div>
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tickets match your current filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">2.3 days</div>
              <div className="text-sm text-gray-600">Avg Resolution Time</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">1.2 hours</div>
              <div className="text-sm text-gray-600">Avg First Response</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">3%</div>
              <div className="text-sm text-gray-600">Ticket Reopen Rate</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tickets by Category</h3>
              <div className="space-y-2">
                {stats?.by_category && Object.entries(stats.by_category).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tickets by Department</h3>
              <div className="space-y-2">
                {stats?.by_department && Object.entries(stats.by_department).map(([department, count]) => (
                  <div key={department} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{department}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resolved This Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satisfaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { name: 'John Smith', open: 5, resolved: 12, response: '1.2h', satisfaction: '4.8/5' },
                    { name: 'Sarah Johnson', open: 3, resolved: 15, response: '0.8h', satisfaction: '4.9/5' },
                    { name: 'Mike Wilson', open: 7, resolved: 8, response: '2.1h', satisfaction: '4.6/5' },
                    { name: 'Lisa Brown', open: 2, resolved: 11, response: '1.5h', satisfaction: '4.7/5' }
                  ].map((agent) => (
                    <tr key={agent.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {agent.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.open}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.resolved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.response}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.satisfaction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">System Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-assign tickets</label>
                  <p className="text-sm text-gray-500">Automatically assign new tickets to available agents</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable auto-escalation</label>
                  <p className="text-sm text-gray-500">Escalate tickets that exceed response time limits</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email notifications</label>
                  <p className="text-sm text-gray-500">Send email notifications for ticket updates</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Priority</label>
                <select className="select max-w-xs">
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Response Time (hours)</label>
                <input type="number" className="input max-w-xs" defaultValue="24" />
              </div>

              <button className="btn btn-primary">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}