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
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ReportData {
  totalClients: number;
  totalServiceCalls: number;
  completedCalls: number;
  pendingCalls: number;
  inventoryValue: number;
  monthlyCallsData: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  engineerPerformance: Array<{ name: string; completed: number }>;
}

export const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalClients: 0,
    totalServiceCalls: 0,
    completedCalls: 0,
    pendingCalls: 0,
    inventoryValue: 0,
    monthlyCallsData: [],
    statusDistribution: [],
    engineerPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch service calls data
      const { data: serviceCalls, count: totalCallsCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString());

      // Fetch completed calls
      const { count: completedCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Fetch pending calls
      const { count: pendingCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', startDate.toISOString());

      // Fetch inventory value
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity, unit_price');

      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + (item.unit_price || 0) * item.quantity, 0
      ) || 0;

      // Process status distribution
      const statusCounts = serviceCalls?.reduce((acc, call) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Fetch engineer performance
      const { data: engineers } = await supabase
        .from('users')
        .select(`
          name,
          service_calls!engineer_id (
            id,
            status
          )
        `)
        .eq('role', 'engineer');

      const engineerPerformance = engineers?.map(engineer => ({
        name: engineer.name,
        completed: engineer.service_calls?.filter(call => call.status === 'completed').length || 0
      })) || [];

      setReportData({
        totalClients: clientCount || 0,
        totalServiceCalls: totalCallsCount || 0,
        completedCalls: completedCount || 0,
        pendingCalls: pendingCount || 0,
        inventoryValue,
        monthlyCallsData: [], // Would need more complex processing for chart data
        statusDistribution,
        engineerPerformance
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = reportData.totalServiceCalls > 0 
    ? ((reportData.completedCalls / reportData.totalServiceCalls) * 100).toFixed(1)
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
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your hardware service operations
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
                <option value="365">Last year</option>
              </select>
            </div>
            <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalClients}</p>
              <p className="text-sm text-green-600 mt-1">Active accounts</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Service Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalServiceCalls}</p>
              <p className="text-sm text-blue-600 mt-1">Last {dateRange} days</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Headphones className="h-8 w-8 text-orange-600" />
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
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${reportData.inventoryValue.toFixed(0)}
              </p>
              <p className="text-sm text-purple-600 mt-1">Total assets</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Reports */}
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
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Engineer Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Engineer Performance</h3>
            <p className="text-sm text-gray-600 mt-1">Completed service calls by engineer</p>
          </div>
          <div className="p-6">
            {reportData.engineerPerformance.length > 0 ? (
              <div className="space-y-4">
                {reportData.engineerPerformance
                  .sort((a, b) => b.completed - a.completed)
                  .slice(0, 5)
                  .map((engineer) => (
                    <div key={engineer.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">
                            {engineer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {engineer.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-primary-600 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (engineer.completed / Math.max(...reportData.engineerPerformance.map(e => e.completed), 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {engineer.completed}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No performance data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Pending Calls</p>
              <p className="text-3xl font-bold mt-2">{reportData.pendingCalls}</p>
              <p className="text-blue-100 text-sm mt-1">Require attention</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed Calls</p>
              <p className="text-3xl font-bold mt-2">{reportData.completedCalls}</p>
              <p className="text-green-100 text-sm mt-1">Successfully resolved</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Average Resolution</p>
              <p className="text-3xl font-bold mt-2">2.5</p>
              <p className="text-purple-100 text-sm mt-1">Days per call</p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
};