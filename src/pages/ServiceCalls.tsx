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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface ServiceCall {
  id: string;
  issue: string;
  description: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  clients: {
    company_name: string;
    contact_person: string;
  };
  engineer: {
    name: string;
  } | null;
}

export const ServiceCalls = () => {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchServiceCalls();
  }, []);

  const fetchServiceCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select(`
          *,
          clients (company_name, contact_person),
          engineer:users!service_calls_engineer_id_fkey (name)
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

  const filteredServiceCalls = serviceCalls.filter(call => {
    const matchesSearch = 
      call.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clients?.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              Service Calls
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage all service requests and assignments
            </p>
          </div>
          <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="h-5 w-5" />
            <span>New Service Call</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search service calls by issue, client, or engineer..."
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
                      <h3 className="text-lg font-semibold text-gray-900">{call.issue}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <span>{call.clients?.company_name}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{call.clients?.contact_person}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {call.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{call.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {format(new Date(call.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {call.scheduled_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled: {format(new Date(call.scheduled_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Engineer: {call.engineer?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(call.priority)}`}>
                      {call.priority}
                    </span>
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
            <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
              <Plus className="h-5 w-5" />
              <span>Create First Service Call</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};