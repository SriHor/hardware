import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { BarChart3, Users, Headphones, Package } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeServiceCalls: 0,
    inventoryItems: 0,
    recentCalls: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' });

      // Fetch active service calls
      const { count: activeCallsCount } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact' })
        .not('status', 'in', '("completed","cancelled")');

      // Fetch inventory count
      const { count: inventoryCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact' });

      // Fetch recent service calls
      const { data: recentCalls } = await supabase
        .from('service_calls')
        .select(`
          *,
          clients (company_name),
          users (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalClients: clientCount || 0,
        activeServiceCalls: activeCallsCount || 0,
        inventoryItems: inventoryCount || 0,
        recentCalls: recentCalls || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome to HardwareServ Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Clients</h3>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Headphones className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Active Service Calls</h3>
              <p className="text-2xl font-semibold text-gray-800">{stats.activeServiceCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Inventory Items</h3>
              <p className="text-2xl font-semibold text-gray-800">{stats.inventoryItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Performance</h3>
              <p className="text-2xl font-semibold text-gray-800">85%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Service Calls</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentCalls.map((call) => (
            <div key={call.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{call.clients?.company_name}</h4>
                  <p className="mt-1 text-sm text-gray-600">{call.issue}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  call.status === 'completed' ? 'bg-green-100 text-green-800' :
                  call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {call.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Engineer: {call.users?.name || 'Unassigned'}</p>
                <p>Created: {new Date(call.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};