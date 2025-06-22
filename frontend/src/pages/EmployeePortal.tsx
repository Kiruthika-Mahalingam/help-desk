import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Search, Plus, MessageSquare, BarChart3, User, Phone, MapPin, Building } from 'lucide-react'
import { employeeService, ticketService, Employee, CreateTicketData } from '../services/api'

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

export default function EmployeePortal() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState<'submit' | 'tickets' | 'stats'>('submit')
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'Medium',
      urgency: 'Medium',
    }
  })

  // Employee lookup
  const employeeLookupMutation = useMutation({
    mutationFn: (identifier: string) => employeeService.lookup(identifier),
    onSuccess: (employee) => {
      setCurrentEmployee(employee)
      toast.success(`Welcome, ${employee.name}!`)
    },
    onError: () => {
      setCurrentEmployee(null)
      toast.error('Employee not found. Please check your Employee ID or email address.')
    }
  })

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketData) => ticketService.create(data),
    onSuccess: (ticket) => {
      toast.success(`Ticket #${ticket.id} created successfully!`)
      reset()
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: () => {
      toast.error('Failed to create ticket. Please try again.')
    }
  })

  // Get employee tickets
  const { data: employeeTickets = [] } = useQuery({
    queryKey: ['tickets', 'employee', currentEmployee?.id],
    queryFn: () => currentEmployee ? ticketService.getByEmployee(currentEmployee.id) : [],
    enabled: !!currentEmployee
  })

  const handleEmployeeLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      employeeLookupMutation.mutate(searchTerm.trim())
    }
  }

  const onSubmitTicket = (data: TicketFormData) => {
    if (!currentEmployee) {
      toast.error('Please look up your employee information first')
      return
    }

    const ticketData: CreateTicketData = {
      ...data,
      employee_id: currentEmployee.id,
      phone: data.phone || currentEmployee.phone,
      location: data.location || currentEmployee.location,
    }

    createTicketMutation.mutate(ticketData)
  }

  const categories = [
    'Hardware Issues',
    'Software Issues',
    'Network/Connectivity',
    'Email/Communication',
    'Security/Access',
    'Printer/Peripherals',
    'Account Management',
    'Other'
  ]

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Portal</h1>
        <p className="mt-2 text-gray-600">Submit tickets, track requests, and get IT support</p>
      </div>

      {/* Employee Lookup */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Employee Lookup</h2>
        <p className="text-gray-600 mb-4">Enter your employee ID or email to access your tickets:</p>
        
        <form onSubmit={handleEmployeeLookup} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              className="input"
              placeholder="e.g., EMP001 or john.doe@company.com"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={employeeLookupMutation.isPending}
          >
            <Search className="w-4 h-4 mr-2" />
            {employeeLookupMutation.isPending ? 'Looking up...' : 'Lookup'}
          </button>
        </form>
      </div>

      {/* Employee Information & Portal */}
      {currentEmployee && (
        <>
          {/* Employee Info */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Employee Information</h3>
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">{currentEmployee.name}</p>
                <p className="text-gray-600">ID: {currentEmployee.id}</p>
              </div>
              <div>
                <p className="text-gray-600">{currentEmployee.email}</p>
                <p className="text-gray-600">{currentEmployee.department}</p>
              </div>
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Phone className="w-4 h-4 mr-1" />
                  {currentEmployee.phone}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {currentEmployee.location}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'submit', label: 'Submit New Ticket', icon: Plus },
                { id: 'tickets', label: 'My Tickets', icon: MessageSquare },
                { id: 'stats', label: 'My Stats', icon: BarChart3 }
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

          {/* Tab Content */}
          {activeTab === 'submit' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Submit a New Support Ticket</h3>
              
              <form onSubmit={handleSubmit(onSubmitTicket)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Title *
                    </label>
                    <input
                      {...register('title')}
                      className="input"
                      placeholder="Brief description of the issue"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select {...register('category')} className="select">
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <select {...register('priority')} className="select">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency
                    </label>
                    <select {...register('urgency')} className="select">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      className="input"
                      placeholder="Building/Floor/Room"
                      defaultValue={currentEmployee.location}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      {...register('phone')}
                      className="input"
                      placeholder="Phone number"
                      defaultValue={currentEmployee.phone}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    {...register('description')}
                    className="textarea"
                    rows={5}
                    placeholder="Please provide detailed information about the issue..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? 'Creating...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Your Support Tickets</h3>
              
              {employeeTickets.length > 0 ? (
                <div className="space-y-4">
                  {employeeTickets.map((ticket: any) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          #{ticket.id} - {ticket.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Category: {ticket.category}</p>
                        <p>Created: {new Date(ticket.created_at).toLocaleDateString()}</p>
                        {ticket.assigned_to && <p>Assigned to: {ticket.assigned_to}</p>}
                        {ticket.resolution && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-800">Resolution:</p>
                            <p className="text-sm text-green-700">{ticket.resolution}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tickets found. Submit your first ticket to get started!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Your Support Statistics</h3>
              
              {employeeTickets.length > 0 ? (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{employeeTickets.length}</div>
                    <div className="text-sm text-gray-600">Total Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {employeeTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length}
                    </div>
                    <div className="text-sm text-gray-600">Open Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {employeeTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length}
                    </div>
                    <div className="text-sm text-gray-600">Resolved Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {employeeTickets.filter(t => t.priority === 'High').length}
                    </div>
                    <div className="text-sm text-gray-600">High Priority</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No statistics available yet. Submit your first ticket to see stats!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}