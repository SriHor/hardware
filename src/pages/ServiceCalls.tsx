import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  Headphones, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
  Phone,
  Wrench,
  FileText,
  Star,
  Package,
  Receipt,
  Eye,
  Edit,
  MessageSquare,
  Timer,
  MapPin,
  Settings
} from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

interface ServiceCall {
  id: string;
  job_id: string;
  call_date: string;
  call_time: string;
  contact_person_name: string;
  complaint_date: string;
  nature_of_complaint: string;
  problem_description: string | null;
  solution: string | null;
  remarks_by_user: string | null;
  remarks_by_engineer: string | null;
  visit_start_time: string | null;
  visit_end_time: string | null;
  completion_time_category: string | null;
  status: string;
  priority: string;
  billing_amount: number | null;
  parts_used: string | null;
  scheduled_date: string | null;
  created_at: string;
  completed_at: string | null;
  clients: {
    company_name: string;
    contact_person: string;
    mobile_office: string | null;
    city: string;
  };
  engineer: {
    name: string;
  } | null;
  received_by_user: {
    name: string;
  } | null;
}

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
}

interface Engineer {
  id: string;
  name: string;
}

export const ServiceCalls = () => {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCall, setEditingCall] = useState<ServiceCall | null>(null);
  const [viewingCall, setViewingCall] = useState<ServiceCall | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toTimeString().slice(0, 5),
    contact_person_name: '',
    complaint_date: new Date().toISOString().split('T')[0],
    nature_of_complaint: '',
    problem_description: '',
    priority: 'medium',
    scheduled_date: '',
    engineer_id: ''
  });

  useEffect(() => {
    fetchServiceCalls();
    fetchClients();
    fetchEngineers();
  }, []);

  const fetchServiceCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select(`
          *,
          clients (company_name, contact_person, mobile_office, city),
          engineer:users!service_calls_engineer_id_fkey (name),
          received_by_user:users!service_calls_received_by_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceCalls(data || []);
    } catch (error) {
      console.error('Error fetching service calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_person')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEngineers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'engineer')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEngineers(data || []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const callData = {
        ...formData,
        // Convert empty strings to null for UUID fields
        client_id: formData.client_id || null,
        engineer_id: formData.engineer_id || null,
        scheduled_date: formData.scheduled_date || null,
        problem_description: formData.problem_description || null,
        received_by: user?.id,
        status: 'pending'
      };

      if (editingCall) {
        const { error } = await supabase
          .from('service_calls')
          .update(callData)
          .eq('id', editingCall.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_calls')
          .insert([callData]);
        
        if (error) throw error;
      }

      resetForm();
      fetchServiceCalls();
    } catch (error) {
      console.error('Error saving service call:', error);
    }
  };

  const handleStatusUpdate = async (callId: string, newStatus: string, engineerId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: newStatus,
        updated_by: user?.id
      };

      if (engineerId) {
        updateData.engineer_id = engineerId;
      }

      if (newStatus === 'in-progress') {
        updateData.visit_start_time = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updateData.visit_end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_calls')
        .update(updateData)
        .eq('id', callId);
      
      if (error) throw error;
      fetchServiceCalls();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().slice(0, 5),
      contact_person_name: '',
      complaint_date: new Date().toISOString().split('T')[0],
      nature_of_complaint: '',
      problem_description: '',
      priority: 'medium',
      scheduled_date: '',
      engineer_id: ''
    });
    setEditingCall(null);
    setShowAddModal(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'assigned':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeSpent = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredServiceCalls = serviceCalls.filter(call => {
    const matchesSearch = 
      call.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.nature_of_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.contact_person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.engineer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || call.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Headphones className="h-8 w-8 mr-3 text-primary-700" />
              Service Call Management
            </h1>
            <p className="text-gray-600 mt-1">
              Complete workflow from complaint reception to completion and feedback
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Service Call</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{serviceCalls.length}</p>
            <p className="text-sm text-gray-600">Total Calls</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {serviceCalls.filter(call => call.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {serviceCalls.filter(call => call.status === 'assigned').length}
            </p>
            <p className="text-sm text-gray-600">Assigned</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {serviceCalls.filter(call => call.status === 'in-progress').length}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {serviceCalls.filter(call => call.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by Job ID, complaint, client, contact person, or engineer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredServiceCalls.length} of {serviceCalls.length} calls
          </div>
        </div>
      </div>

      {/* Service Calls List */}
      <div className="space-y-4">
        {filteredServiceCalls.map((call) => (
          <div key={call.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(call.status)}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{call.job_id}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(call.priority)}`}>
                          {call.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium">{call.nature_of_complaint}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>{call.clients?.company_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{call.contact_person_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{call.clients?.mobile_office || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{call.clients?.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {call.problem_description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{call.problem_description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Call: {format(new Date(call.call_date), 'dd/MM/yyyy')} {call.call_time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Complaint: {format(new Date(call.complaint_date), 'dd/MM/yyyy')}</span>
                    </div>
                    {call.scheduled_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled: {format(new Date(call.scheduled_date), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Engineer: {call.engineer?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Time Tracking */}
                  {(call.visit_start_time || call.visit_end_time) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Timer className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Visit Time:</span>
                        </div>
                        {call.visit_start_time && (
                          <span className="text-blue-700">
                            Start: {format(new Date(call.visit_start_time), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                        {call.visit_end_time && (
                          <span className="text-blue-700">
                            End: {format(new Date(call.visit_end_time), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                        {call.visit_start_time && call.visit_end_time && (
                          <span className="text-blue-700 font-medium">
                            Duration: {getTimeSpent(call.visit_start_time, call.visit_end_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Solution and Remarks */}
                  {(call.solution || call.remarks_by_engineer || call.parts_used) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="space-y-2 text-sm">
                        {call.solution && (
                          <div>
                            <span className="font-medium text-green-900">Solution:</span>
                            <p className="text-green-700">{call.solution}</p>
                          </div>
                        )}
                        {call.remarks_by_engineer && (
                          <div>
                            <span className="font-medium text-green-900">Engineer Remarks:</span>
                            <p className="text-green-700">{call.remarks_by_engineer}</p>
                          </div>
                        )}
                        {call.parts_used && (
                          <div>
                            <span className="font-medium text-green-900">Parts Used:</span>
                            <p className="text-green-700">{call.parts_used}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end space-y-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(call.status)}`}>
                    {call.status}
                  </span>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setViewingCall(call)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {call.status === 'pending' && (
                      <div className="space-y-1">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(call.id, 'assigned', e.target.value);
                            }
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Assign Engineer</option>
                          {engineers.map(engineer => (
                            <option key={engineer.id} value={engineer.id}>
                              {engineer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {call.status === 'assigned' && call.engineer && (
                      <button
                        onClick={() => handleStatusUpdate(call.id, 'in-progress')}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    
                    {call.status === 'in-progress' && (
                      <button
                        onClick={() => handleStatusUpdate(call.id, 'completed')}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServiceCalls.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Headphones className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'No service calls found' 
              : 'No service calls yet'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by creating your first service call'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Service Call</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCall ? 'Edit Service Call' : 'New Service Call'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Call Reception Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Call Reception Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.client_id}
                      onChange={(e) => {
                        const selectedClient = clients.find(c => c.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          client_id: e.target.value,
                          contact_person_name: selectedClient?.contact_person || ''
                        });
                      }}
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company_name} - {client.contact_person}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.call_date}
                      onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call Time *
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.call_time}
                      onChange={(e) => setFormData({ ...formData, call_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.contact_person_name}
                      onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complaint Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.complaint_date}
                      onChange={(e) => setFormData({ ...formData, complaint_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Complaint Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nature of Complaint *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.nature_of_complaint}
                      onChange={(e) => setFormData({ ...formData, nature_of_complaint: e.target.value })}
                      placeholder="Brief description of the problem"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problem Description
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.problem_description}
                      onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                      placeholder="Detailed description of the problem..."
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Assignment Details (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Engineer
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.engineer_id}
                      onChange={(e) => setFormData({ ...formData, engineer_id: e.target.value })}
                    >
                      <option value="">Select an engineer</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
                >
                  {editingCall ? 'Update Service Call' : 'Create Service Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Service Call Details - {viewingCall.job_id}
                </h3>
                <button
                  onClick={() => setViewingCall(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Call Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Call Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Job ID:</span> {viewingCall.job_id}</div>
                    <div><span className="font-medium">Client:</span> {viewingCall.clients?.company_name}</div>
                    <div><span className="font-medium">Contact Person:</span> {viewingCall.contact_person_name}</div>
                    <div><span className="font-medium">Phone:</span> {viewingCall.clients?.mobile_office || 'N/A'}</div>
                    <div><span className="font-medium">City:</span> {viewingCall.clients?.city}</div>
                    <div><span className="font-medium">Call Date:</span> {format(new Date(viewingCall.call_date), 'dd/MM/yyyy')} at {viewingCall.call_time}</div>
                    <div><span className="font-medium">Complaint Date:</span> {format(new Date(viewingCall.complaint_date), 'dd/MM/yyyy')}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Status & Assignment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingCall.status)}`}>
                        {viewingCall.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Priority:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewingCall.priority)}`}>
                        {viewingCall.priority}
                      </span>
                    </div>
                    <div><span className="font-medium">Engineer:</span> {viewingCall.engineer?.name || 'Not assigned'}</div>
                    <div><span className="font-medium">Received By:</span> {viewingCall.received_by_user?.name || 'N/A'}</div>
                    {viewingCall.scheduled_date && (
                      <div><span className="font-medium">Scheduled:</span> {format(new Date(viewingCall.scheduled_date), 'dd/MM/yyyy')}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Problem Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-2">
                    <span className="font-medium text-sm">Nature of Complaint:</span>
                    <p className="text-gray-700">{viewingCall.nature_of_complaint}</p>
                  </div>
                  {viewingCall.problem_description && (
                    <div>
                      <span className="font-medium text-sm">Description:</span>
                      <p className="text-gray-700">{viewingCall.problem_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Solution & Work Details */}
              {(viewingCall.solution || viewingCall.remarks_by_engineer || viewingCall.parts_used) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Solution & Work Details</h4>
                  <div className="bg-green-50 p-4 rounded-lg space-y-3">
                    {viewingCall.solution && (
                      <div>
                        <span className="font-medium text-sm text-green-900">Solution:</span>
                        <p className="text-green-700">{viewingCall.solution}</p>
                      </div>
                    )}
                    {viewingCall.remarks_by_engineer && (
                      <div>
                        <span className="font-medium text-sm text-green-900">Engineer Remarks:</span>
                        <p className="text-green-700">{viewingCall.remarks_by_engineer}</p>
                      </div>
                    )}
                    {viewingCall.parts_used && (
                      <div>
                        <span className="font-medium text-sm text-green-900">Parts Used:</span>
                        <p className="text-green-700">{viewingCall.parts_used}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              {(viewingCall.visit_start_time || viewingCall.visit_end_time) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Time Tracking</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {viewingCall.visit_start_time && (
                        <div>
                          <span className="font-medium text-blue-900">Start Time:</span>
                          <p className="text-blue-700">{format(new Date(viewingCall.visit_start_time), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      )}
                      {viewingCall.visit_end_time && (
                        <div>
                          <span className="font-medium text-blue-900">End Time:</span>
                          <p className="text-blue-700">{format(new Date(viewingCall.visit_end_time), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      )}
                      {viewingCall.visit_start_time && viewingCall.visit_end_time && (
                        <div>
                          <span className="font-medium text-blue-900">Duration:</span>
                          <p className="text-blue-700 font-semibold">{getTimeSpent(viewingCall.visit_start_time, viewingCall.visit_end_time)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Information */}
              {viewingCall.billing_amount && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium text-yellow-900">Billing Amount:</span>
                      <span className="text-yellow-700 ml-2 font-semibold">₹{viewingCall.billing_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingCall(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};