import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { 
  Users, 
  Headphones, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Bell,
  CreditCard,
  Phone,
  FileText,
  UserCog
} from 'lucide-react';
import { format, isSameMonth, differenceInDays } from 'date-fns';

interface DashboardStats {
  totalClients: number;
  activeServiceCalls: number;
  inventoryItems: number;
  completedCallsThisMonth: number;
  totalTelecallingLeads: number;
  convertedLeads: number;
}

interface RecentCall {
  id: string;
  nature_of_complaint: string;
  status: string;
  created_at: string;
  clients: {
    company_name: string;
  };
  engineer: {
    name: string;
  } | null;
}

interface PaymentReminder {
  id: string;
  due_date: string;
  amount: number;
  payment_number: number;
  status: string;
  client_agreements: {
    clients: {
      company_name: string;
      contact_person: string;
    };
  };
}

interface RecentLead {
  id: string;
  company_name: string;
  contact_person: string;
  status: string;
  lead_type: string;
  lead_generation_date: string;
  users: {
    name: string;
  } | null;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeServiceCalls: 0,
    inventoryItems: 0,
    completedCallsThisMonth: 0,
    totalTelecallingLeads: 0,
    convertedLeads: 0
  });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch active service calls
      const { count: activeCallsCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("completed","cancelled")');

      // Fetch inventory count
      const { count: inventoryCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      // Fetch completed calls this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: completedCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString());

      // Fetch telecalling leads stats
      const { count: totalLeadsCount } = await supabase
        .from('telecalling_leads')
        .select('*', { count: 'exact', head: true });

      const { count: convertedLeadsCount } = await supabase
        .from('telecalling_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted');

      // Fetch recent service calls
      const { data: recentCallsData } = await supabase
        .from('service_calls')
        .select(`
          id,
          nature_of_complaint,
          status,
          created_at,
          clients (company_name),
          engineer:users!service_calls_engineer_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch payment reminders for this month
      const { data: paymentData } = await supabase
        .from('payment_schedules')
        .select(`
          id,
          due_date,
          amount,
          payment_number,
          status,
          client_agreements (
            clients (
              company_name,
              contact_person
            )
          )
        `)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(10);

      // Fetch recent telecalling leads
      const { data: recentLeadsData } = await supabase
        .from('telecalling_leads')
        .select(`
          id,
          company_name,
          contact_person,
          status,
          lead_type,
          lead_generation_date,
          users!telecalling_leads_created_by_fkey (name)
        `)
        .order('lead_generation_date', { ascending: false })
        .limit(5);

      setStats({
        totalClients: clientCount || 0,
        activeServiceCalls: activeCallsCount || 0,
        inventoryItems: inventoryCount || 0,
        completedCallsThisMonth: completedCount || 0,
        totalTelecallingLeads: totalLeadsCount || 0,
        convertedLeads: convertedLeadsCount || 0
      });

      setRecentCalls(recentCallsData || []);
      setPaymentReminders(paymentData || []);
      setRecentLeads(recentLeadsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const thisMonthPayments = paymentReminders.filter(payment => 
    isSameMonth(new Date(payment.due_date), new Date())
  );

  const urgentPayments = paymentReminders.filter(payment => {
    const days = getDaysUntilDue(payment.due_date);
    return days <= 7 && days >= 0;
  });

  const conversionRate = stats.totalTelecallingLeads > 0 
    ? ((stats.convertedLeads / stats.totalTelecallingLeads) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your hardware service operations.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/clients')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
              <p className="text-sm text-green-600 mt-1">Active accounts</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/service-calls')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Service Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeServiceCalls}</p>
              <p className="text-sm text-orange-600 mt-1">Pending & in-progress</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Headphones className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/inventory')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inventoryItems}</p>
              <p className="text-sm text-purple-600 mt-1">Parts & equipment</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/service-calls')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedCallsThisMonth}</p>
              <p className="text-sm text-green-600 mt-1">Service calls</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/telecalling')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTelecallingLeads}</p>
              <p className="text-sm text-blue-600 mt-1">Telecalling leads</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/telecalling')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{conversionRate}%</p>
              <p className="text-sm text-green-600 mt-1">{stats.convertedLeads} converted</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Alerts */}
      {(thisMonthPayments.length > 0 || urgentPayments.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* This Month Payments */}
          {thisMonthPayments.length > 0 && (
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all"
              onClick={() => navigate('/reminders')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">This Month Due</h3>
                    <p className="text-blue-100 text-sm">{thisMonthPayments.length} payments pending</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(thisMonthPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {thisMonthPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="bg-white bg-opacity-10 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>{payment.client_agreements?.clients?.company_name}</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="text-blue-100 text-xs">
                      Due: {format(new Date(payment.due_date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                ))}
                {thisMonthPayments.length > 3 && (
                  <p className="text-blue-100 text-xs text-center">
                    +{thisMonthPayments.length - 3} more payments
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Urgent Payments */}
          {urgentPayments.length > 0 && (
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:from-red-600 hover:to-red-700 transition-all"
              onClick={() => navigate('/reminders')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Urgent Reminders</h3>
                    <p className="text-red-100 text-sm">Due within 7 days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{urgentPayments.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                {urgentPayments.slice(0, 3).map((payment) => {
                  const days = getDaysUntilDue(payment.due_date);
                  return (
                    <div key={payment.id} className="bg-white bg-opacity-10 rounded p-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>{payment.client_agreements?.clients?.company_name}</span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                      <div className="text-red-100 text-xs">
                        {days === 0 ? 'Due Today' : `${days} days left`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Recent Service Calls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Service Calls</h3>
              <button 
                onClick={() => navigate('/service-calls')}
                className="text-primary-700 text-sm hover:underline"
              >
                View all
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Latest service requests and updates</p>
          </div>
          <div className="p-6">
            {recentCalls.length === 0 ? (
              <div className="text-center py-8">
                <Headphones className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent service calls</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(call.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {call.clients?.company_name}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {call.nature_of_complaint}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          Engineer: {call.engineer?.name || 'Unassigned'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(call.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Telecalling Leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
              <button 
                onClick={() => navigate('/telecalling')}
                className="text-primary-700 text-sm hover:underline"
              >
                View all
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Latest telecalling leads</p>
          </div>
          <div className="p-6">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent leads</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.company_name}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {lead.contact_person} • {lead.lead_type}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          By: {lead.users?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(lead.lead_generation_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600 mt-1">Common tasks and shortcuts</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/clients')}
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Users className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-900">Add Client</span>
              </button>
              <button 
                onClick={() => navigate('/service-calls')}
                className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
              >
                <Headphones className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-orange-900">New Service Call</span>
              </button>
              <button 
                onClick={() => navigate('/inventory')}
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
              >
                <Package className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-900">Manage Inventory</span>
              </button>
              <button 
                onClick={() => navigate('/telecalling')}
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <Phone className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-900">Add Lead</span>
              </button>
              <button 
                onClick={() => navigate('/agreements')}
                className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
              >
                <FileText className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-indigo-900">New Agreement</span>
              </button>
              <button 
                onClick={() => navigate('/staff')}
                className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors group"
              >
                <UserCog className="h-8 w-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-pink-900">Manage Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};