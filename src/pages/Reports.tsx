import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Headphones, 
  Package,
  Calendar,
  Download,
  Filter,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  PieChart,
  Activity,
  Phone,
  Monitor,
  Code,
  Globe
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

interface ReportData {
  totalClients: number;
  totalServiceCalls: number;
  completedCalls: number;
  pendingCalls: number;
  inventoryValue: number;
  totalLeads: number;
  convertedLeads: number;
  monthlyCallsData: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  engineerPerformance: Array<{ name: string; completed: number; pending: number; in_progress: number }>;
  clientServiceData: Array<{ client_name: string; total_calls: number; completed: number; pending: number }>;
  dailyServiceData: Array<{ date: string; calls: number; completed: number }>;
  monthlyServiceData: Array<{ month: string; calls: number; completed: number; revenue: number }>;
  telecallingData: {
    monthlyLeads: Array<{ month: string; total: number; converted: number; hardware: number; software: number; website: number }>;
    dailyLeads: Array<{ date: string; total: number; converted: number }>;
    telecallerPerformance: Array<{ name: string; total: number; converted: number; hardware: number; software: number; website: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    typeDistribution: Array<{ type: string; count: number }>;
  };
}

interface ServiceCallReport {
  id: string;
  job_id: string;
  call_date: string;
  nature_of_complaint: string;
  status: string;
  priority: string;
  billing_amount: number | null;
  created_at: string;
  completed_at: string | null;
  clients: {
    company_name: string;
  };
  engineer: {
    name: string;
  } | null;
}

export const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalClients: 0,
    totalServiceCalls: 0,
    completedCalls: 0,
    pendingCalls: 0,
    inventoryValue: 0,
    totalLeads: 0,
    convertedLeads: 0,
    monthlyCallsData: [],
    statusDistribution: [],
    engineerPerformance: [],
    clientServiceData: [],
    dailyServiceData: [],
    monthlyServiceData: [],
    telecallingData: {
      monthlyLeads: [],
      dailyLeads: [],
      telecallerPerformance: [],
      statusDistribution: [],
      typeDistribution: []
    }
  });
  const [serviceCalls, setServiceCalls] = useState<ServiceCallReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('overview');
  const [selectedEngineer, setSelectedEngineer] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedTelecaller, setSelectedTelecaller] = useState('all');
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; company_name: string }>>([]);
  const [telecallers, setTelecallers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchReportData();
    fetchEngineers();
    fetchClients();
    fetchTelecallers();
  }, [dateRange, selectedEngineer, selectedClient, selectedTelecaller]);

  const getDateRangeFilter = () => {
    const endDate = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7':
        startDate = subDays(endDate, 7);
        break;
      case '30':
        startDate = subDays(endDate, 30);
        break;
      case '90':
        startDate = subDays(endDate, 90);
        break;
      case 'current_month':
        startDate = startOfMonth(endDate);
        break;
      case 'current_week':
        startDate = startOfWeek(endDate);
        break;
      case 'current_year':
        startDate = startOfYear(endDate);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    try {
      const { startDate, endDate } = getDateRangeFilter();

      // Build query filters
      let serviceCallsQuery = supabase
        .from('service_calls')
        .select(`
          *,
          clients (company_name),
          engineer:users!service_calls_engineer_id_fkey (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (selectedEngineer !== 'all') {
        serviceCallsQuery = serviceCallsQuery.eq('engineer_id', selectedEngineer);
      }

      if (selectedClient !== 'all') {
        serviceCallsQuery = serviceCallsQuery.eq('client_id', selectedClient);
      }

      const { data: serviceCallsData, error: serviceCallsError } = await serviceCallsQuery;
      if (serviceCallsError) throw serviceCallsError;

      setServiceCalls(serviceCallsData || []);

      // Fetch telecalling data
      let telecallingQuery = supabase
        .from('telecalling_leads')
        .select(`
          *,
          users!telecalling_leads_created_by_fkey (name)
        `)
        .gte('lead_generation_date', startDate.toISOString().split('T')[0])
        .lte('lead_generation_date', endDate.toISOString().split('T')[0]);

      if (selectedTelecaller !== 'all') {
        telecallingQuery = telecallingQuery.eq('created_by', selectedTelecaller);
      }

      const { data: telecallingData, error: telecallingError } = await telecallingQuery;
      if (telecallingError) throw telecallingError;

      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch completed calls
      const completedCount = serviceCallsData?.filter(call => call.status === 'completed').length || 0;
      const pendingCount = serviceCallsData?.filter(call => call.status !== 'completed' && call.status !== 'cancelled').length || 0;

      // Fetch inventory value
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity, unit_price');

      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + (item.unit_price || 0) * item.quantity, 0
      ) || 0;

      // Process status distribution
      const statusCounts = serviceCallsData?.reduce((acc, call) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Process engineer performance
      const engineerStats = serviceCallsData?.reduce((acc, call) => {
        if (call.engineer?.name) {
          if (!acc[call.engineer.name]) {
            acc[call.engineer.name] = { completed: 0, pending: 0, in_progress: 0 };
          }
          if (call.status === 'completed') {
            acc[call.engineer.name].completed++;
          } else if (call.status === 'pending') {
            acc[call.engineer.name].pending++;
          } else if (call.status === 'in-progress') {
            acc[call.engineer.name].in_progress++;
          }
        }
        return acc;
      }, {} as Record<string, { completed: number; pending: number; in_progress: number }>) || {};

      const engineerPerformance = Object.entries(engineerStats).map(([name, stats]) => ({
        name,
        ...stats
      }));

      // Process client service data
      const clientStats = serviceCallsData?.reduce((acc, call) => {
        const clientName = call.clients?.company_name || 'Unknown';
        if (!acc[clientName]) {
          acc[clientName] = { total_calls: 0, completed: 0, pending: 0 };
        }
        acc[clientName].total_calls++;
        if (call.status === 'completed') {
          acc[clientName].completed++;
        } else if (call.status !== 'cancelled') {
          acc[clientName].pending++;
        }
        return acc;
      }, {} as Record<string, { total_calls: number; completed: number; pending: number }>) || {};

      const clientServiceData = Object.entries(clientStats).map(([client_name, stats]) => ({
        client_name,
        ...stats
      }));

      // Process daily service data
      const dailyStats = serviceCallsData?.reduce((acc, call) => {
        const date = format(new Date(call.created_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { calls: 0, completed: 0 };
        }
        acc[date].calls++;
        if (call.status === 'completed') {
          acc[date].completed++;
        }
        return acc;
      }, {} as Record<string, { calls: number; completed: number }>) || {};

      const dailyServiceData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Process monthly service data
      const monthlyStats = serviceCallsData?.reduce((acc, call) => {
        const month = format(new Date(call.created_at), 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = { calls: 0, completed: 0, revenue: 0 };
        }
        acc[month].calls++;
        if (call.status === 'completed') {
          acc[month].completed++;
          acc[month].revenue += call.billing_amount || 0;
        }
        return acc;
      }, {} as Record<string, { calls: number; completed: number; revenue: number }>) || {};

      const monthlyServiceData = Object.entries(monthlyStats).map(([month, stats]) => ({
        month,
        ...stats
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Process telecalling data
      const telecallingLeads = telecallingData || [];
      const totalLeads = telecallingLeads.length;
      const convertedLeads = telecallingLeads.filter(lead => lead.status === 'converted').length;

      // Monthly leads data
      const monthlyLeadsStats = telecallingLeads.reduce((acc, lead) => {
        const month = format(new Date(lead.lead_generation_date), 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = { total: 0, converted: 0, hardware: 0, software: 0, website: 0 };
        }
        acc[month].total++;
        if (lead.status === 'converted') acc[month].converted++;
        if (lead.lead_type === 'hardware') acc[month].hardware++;
        if (lead.lead_type === 'software') acc[month].software++;
        if (lead.lead_type === 'website') acc[month].website++;
        return acc;
      }, {} as Record<string, any>);

      const monthlyLeads = Object.entries(monthlyLeadsStats).map(([month, stats]) => ({
        month,
        ...stats
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Daily leads data
      const dailyLeadsStats = telecallingLeads.reduce((acc, lead) => {
        const date = format(new Date(lead.lead_generation_date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { total: 0, converted: 0 };
        }
        acc[date].total++;
        if (lead.status === 'converted') acc[date].converted++;
        return acc;
      }, {} as Record<string, any>);

      const dailyLeads = Object.entries(dailyLeadsStats).map(([date, stats]) => ({
        date,
        ...stats
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Telecaller performance
      const telecallerStats = telecallingLeads.reduce((acc, lead) => {
        const telecallerName = lead.users?.name || 'Unknown';
        if (!acc[telecallerName]) {
          acc[telecallerName] = { total: 0, converted: 0, hardware: 0, software: 0, website: 0 };
        }
        acc[telecallerName].total++;
        if (lead.status === 'converted') acc[telecallerName].converted++;
        if (lead.lead_type === 'hardware') acc[telecallerName].hardware++;
        if (lead.lead_type === 'software') acc[telecallerName].software++;
        if (lead.lead_type === 'website') acc[telecallerName].website++;
        return acc;
      }, {} as Record<string, any>);

      const telecallerPerformance = Object.entries(telecallerStats).map(([name, stats]) => ({
        name,
        ...stats
      }));

      // Status distribution for telecalling
      const telecallingStatusCounts = telecallingLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const telecallingStatusDistribution = Object.entries(telecallingStatusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Type distribution for telecalling
      const telecallingTypeCounts = telecallingLeads.reduce((acc, lead) => {
        acc[lead.lead_type] = (acc[lead.lead_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const telecallingTypeDistribution = Object.entries(telecallingTypeCounts).map(([type, count]) => ({
        type,
        count
      }));

      setReportData({
        totalClients: clientCount || 0,
        totalServiceCalls: serviceCallsData?.length || 0,
        completedCalls: completedCount,
        pendingCalls: pendingCount,
        inventoryValue,
        totalLeads,
        convertedLeads,
        monthlyCallsData: [], // Would need more complex processing for chart data
        statusDistribution,
        engineerPerformance,
        clientServiceData,
        dailyServiceData,
        monthlyServiceData,
        telecallingData: {
          monthlyLeads,
          dailyLeads,
          telecallerPerformance,
          statusDistribution: telecallingStatusDistribution,
          typeDistribution: telecallingTypeDistribution
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchTelecallers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('role', ['admin', 'manager', 'telecaller'])
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTelecallers(data || []);
    } catch (error) {
      console.error('Error fetching telecallers:', error);
    }
  };

  const completionRate = reportData.totalServiceCalls > 0 
    ? ((reportData.completedCalls / reportData.totalServiceCalls) * 100).toFixed(1)
    : '0';

  const conversionRate = reportData.totalLeads > 0
    ? ((reportData.convertedLeads / reportData.totalLeads) * 100).toFixed(1)
    : '0';

  const exportToCSV = () => {
    if (reportType === 'telecalling') {
      // Export telecalling data
      const headers = ['Company', 'Contact Person', 'Phone', 'Email', 'Type', 'Status', 'Generation Date', 'Telecaller'];
      const csvData = reportData.telecallingData.telecallerPerformance.map(telecaller => [
        telecaller.name,
        telecaller.total,
        telecaller.converted,
        telecaller.hardware,
        telecaller.software,
        telecaller.website
      ]);

      const csvContent = [['Telecaller', 'Total Leads', 'Converted', 'Hardware', 'Software', 'Website'], ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telecalling-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Export service calls data
      const headers = ['Job ID', 'Client', 'Engineer', 'Date', 'Complaint', 'Status', 'Priority', 'Billing Amount'];
      const csvData = serviceCalls.map(call => [
        call.job_id,
        call.clients?.company_name || 'N/A',
        call.engineer?.name || 'Unassigned',
        format(new Date(call.created_at), 'dd/MM/yyyy'),
        call.nature_of_complaint,
        call.status,
        call.priority,
        call.billing_amount || 0
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service-calls-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hardware':
        return <Monitor className="h-4 w-4" />;
      case 'software':
        return <Code className="h-4 w-4" />;
      case 'website':
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

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
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
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
              <BarChart3 className="h-8 w-8 mr-3 text-primary-700" />
              Service Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your hardware service and telecalling operations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="current_week">This Week</option>
                <option value="current_month">This Month</option>
                <option value="current_year">This Year</option>
              </select>
            </div>
            <button 
              onClick={exportToCSV}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="overview">Overview</option>
                <option value="engineer">Engineer Performance</option>
                <option value="client">Client Analysis</option>
                <option value="daily">Daily Reports</option>
                <option value="monthly">Monthly Reports</option>
                <option value="telecalling">Telecalling Reports</option>
              </select>
            </div>
            
            {reportType !== 'telecalling' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedEngineer}
                    onChange={(e) => setSelectedEngineer(e.target.value)}
                  >
                    <option value="all">All Engineers</option>
                    {engineers.map(engineer => (
                      <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="all">All Clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {reportType === 'telecalling' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={selectedTelecaller}
                  onChange={(e) => setSelectedTelecaller(e.target.value)}
                >
                  <option value="all">All Telecallers</option>
                  {telecallers.map(telecaller => (
                    <option key={telecaller.id} value={telecaller.id}>{telecaller.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Service Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalServiceCalls}</p>
              <p className="text-sm text-blue-600 mt-1">Selected period</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Headphones className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</p>
              <p className="text-sm text-green-600 mt-1">
                {reportData.completedCalls} of {reportData.totalServiceCalls}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.pendingCalls}</p>
              <p className="text-sm text-orange-600 mt-1">Require attention</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{serviceCalls.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.billing_amount || 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-purple-600 mt-1">From completed calls</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalLeads}</p>
              <p className="text-sm text-blue-600 mt-1">Generated</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{conversionRate}%</p>
              <p className="text-sm text-green-600 mt-1">
                {reportData.convertedLeads} converted
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content Based on Type */}
      {reportType === 'telecalling' && (
        <div className="space-y-6">
          {/* Telecaller Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Telecaller Performance Report</h3>
              <p className="text-sm text-gray-600 mt-1">Leads generated and converted by each telecaller</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telecaller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardware</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Software</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.telecallingData.telecallerPerformance.map((telecaller) => {
                    const conversionRate = telecaller.total > 0 ? ((telecaller.converted / telecaller.total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={telecaller.name}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-700">
                                {telecaller.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{telecaller.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {telecaller.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {telecaller.converted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {telecaller.hardware}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                          {telecaller.software}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {telecaller.website}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${conversionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{conversionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Type and Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Lead Type Distribution</h3>
                <p className="text-sm text-gray-600 mt-1">Breakdown by service type</p>
              </div>
              <div className="p-6">
                {reportData.telecallingData.typeDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.telecallingData.typeDistribution.map((item) => {
                      const percentage = reportData.totalLeads > 0 
                        ? (item.count / reportData.totalLeads * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div key={item.type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(item.type)}
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {item.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{item.count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Lead Status Distribution</h3>
                <p className="text-sm text-gray-600 mt-1">Current status of all leads</p>
              </div>
              <div className="p-6">
                {reportData.telecallingData.statusDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.telecallingData.statusDistribution.map((item) => {
                      const percentage = reportData.totalLeads > 0 
                        ? (item.count / reportData.totalLeads * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              item.status === 'converted' ? 'bg-green-500' :
                              item.status === 'follow-up' ? 'bg-yellow-500' :
                              item.status === 'new' ? 'bg-blue-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{item.count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Leads Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Leads Report</h3>
              <p className="text-sm text-gray-600 mt-1">Month-wise lead generation and conversion</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardware</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Software</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.telecallingData.monthlyLeads.map((month) => {
                    const conversionRate = month.total > 0 ? ((month.converted / month.total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={month.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(new Date(month.month + '-01'), 'MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {month.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {month.converted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {month.hardware}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                          {month.software}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {month.website}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${conversionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{conversionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Other report types remain the same as before */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Call Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Service Call Status</h3>
              <p className="text-sm text-gray-600 mt-1">Distribution of service call statuses</p>
            </div>
            <div className="p-6">
              {reportData.statusDistribution.length > 0 ? (
                <div className="space-y-4">
                  {reportData.statusDistribution.map((item) => {
                    const percentage = reportData.totalServiceCalls > 0 
                      ? (item.count / reportData.totalServiceCalls * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' :
                            item.status === 'in-progress' ? 'bg-blue-500' :
                            item.status === 'pending' ? 'bg-yellow-500' :
                            item.status === 'assigned' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {item.status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Service Calls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Service Calls</h3>
              <p className="text-sm text-gray-600 mt-1">Latest service requests</p>
            </div>
            <div className="p-6">
              {serviceCalls.slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {serviceCalls.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-start p-3 border-l-4 border-primary-500 bg-gray-50 rounded-r">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-semibold">{call.clients?.company_name}</h4>
                          <span className="text-xs">{format(new Date(call.created_at), 'd MMM yyyy')}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{call.nature_of_complaint}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium">
                            <User className="h-3 w-3 inline mr-1" />
                            {call.engineer?.name || 'Unassigned'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            call.status === 'completed' ? 'bg-green-100 text-green-800' :
                            call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            call.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {call.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent service calls</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportType === 'engineer' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Engineer Performance Report</h3>
            <p className="text-sm text-gray-600 mt-1">Service calls handled by each engineer</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.engineerPerformance.map((engineer) => {
                  const total = engineer.completed + engineer.pending + engineer.in_progress;
                  const completionRate = total > 0 ? ((engineer.completed / total) * 100).toFixed(1) : '0';
                  
                  return (
                    <tr key={engineer.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">
                              {engineer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{engineer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {engineer.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {engineer.in_progress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        {engineer.pending}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'client' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Client Service Report</h3>
            <p className="text-sm text-gray-600 mt-1">Service calls by client</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.clientServiceData.map((client) => {
                  const successRate = client.total_calls > 0 ? ((client.completed / client.total_calls) * 100).toFixed(1) : '0';
                  
                  return (
                    <tr key={client.client_name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">{client.client_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {client.total_calls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {client.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        {client.pending}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${successRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{successRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Daily Service Report</h3>
            <p className="text-sm text-gray-600 mt-1">Day-wise service call breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.dailyServiceData.map((day) => {
                  const completionRate = day.calls > 0 ? ((day.completed / day.calls) * 100).toFixed(1) : '0';
                  
                  return (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(day.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.calls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {day.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'monthly' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Service Report</h3>
            <p className="text-sm text-gray-600 mt-1">Month-wise service call and revenue breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Revenue/Call</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.monthlyServiceData.map((month) => {
                  const avgRevenue = month.completed > 0 ? (month.revenue / month.completed).toFixed(0) : '0';
                  
                  return (
                    <tr key={month.month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(month.month + '-01'), 'MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {month.calls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {month.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        ₹{month.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₹{avgRevenue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};