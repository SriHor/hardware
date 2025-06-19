import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  IndianRupee,
  Monitor,
  Laptop,
  Printer,
  Server,
  Network,
  CreditCard,
  AlertTriangle,
  Clock,
  Bell
} from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';

interface ClientAgreement {
  id: string;
  client_id: string;
  agreement_date: string;
  systems: number;
  system_rate: number;
  laptops: number;
  laptop_rate: number;
  printers: number;
  printer_rate: number;
  servers: number;
  server_rate: number;
  networking_rate: number;
  subtotal: number;
  discount: number;
  total_cost: number;
  payment_mode: string;
  payment_frequency: string;
  payment_details: string | null;
  status: string;
  other_details: string | null;
  created_at: string;
  clients: {
    company_name: string;
    contact_person: string;
  };
}

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
}

interface PaymentPreview {
  paymentNumber: number;
  dueDate: string;
  amount: number;
  reminderDate: string;
  daysFromAgreement: number;
}

export const Agreements = () => {
  const [agreements, setAgreements] = useState<ClientAgreement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<ClientAgreement | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<PaymentPreview[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    agreement_date: '',
    systems: 0,
    system_rate: 0,
    laptops: 0,
    laptop_rate: 0,
    printers: 0,
    printer_rate: 0,
    servers: 0,
    server_rate: 0,
    networking_rate: 0,
    discount: 0,
    payment_mode: 'cash',
    payment_frequency: 'full',
    payment_details: '',
    other_details: ''
  });

  useEffect(() => {
    fetchAgreements();
    fetchClients();
  }, []);

  useEffect(() => {
    updatePaymentPreview();
  }, [formData.agreement_date, formData.payment_frequency, formData.systems, formData.system_rate, formData.laptops, formData.laptop_rate, formData.printers, formData.printer_rate, formData.servers, formData.server_rate, formData.networking_rate, formData.discount]);

  const fetchAgreements = async () => {
    try {
      const { data, error } = await supabase
        .from('client_agreements')
        .select(`
          *,
          clients (company_name, contact_person)
        `)
        .order('agreement_date', { ascending: false });

      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error('Error fetching agreements:', error);
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

  const calculateTotal = () => {
    const subtotal = (formData.systems * formData.system_rate) +
                    (formData.laptops * formData.laptop_rate) +
                    (formData.printers * formData.printer_rate) +
                    (formData.servers * formData.server_rate) +
                    formData.networking_rate;
    return subtotal - formData.discount;
  };

  const updatePaymentPreview = () => {
    if (!formData.agreement_date || !formData.payment_frequency) {
      setPaymentPreview([]);
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      setPaymentPreview([]);
      return;
    }

    const agreementDate = new Date(formData.agreement_date);
    const previews: PaymentPreview[] = [];

    switch (formData.payment_frequency) {
      case 'full':
        previews.push({
          paymentNumber: 1,
          dueDate: format(agreementDate, 'dd/MM/yyyy'),
          amount: totalAmount,
          reminderDate: format(addDays(agreementDate, -7), 'dd/MM/yyyy'),
          daysFromAgreement: 0
        });
        break;

      case 'half_yearly':
        const halfAmount = totalAmount / 2;
        previews.push({
          paymentNumber: 1,
          dueDate: format(agreementDate, 'dd/MM/yyyy'),
          amount: halfAmount,
          reminderDate: format(addDays(agreementDate, -7), 'dd/MM/yyyy'),
          daysFromAgreement: 0
        });
        const secondHalfDate = addMonths(agreementDate, 6);
        previews.push({
          paymentNumber: 2,
          dueDate: format(secondHalfDate, 'dd/MM/yyyy'),
          amount: halfAmount,
          reminderDate: format(addDays(secondHalfDate, -7), 'dd/MM/yyyy'),
          daysFromAgreement: 180
        });
        break;

      case 'quarterly':
        const quarterAmount = totalAmount / 4;
        for (let i = 0; i < 4; i++) {
          const quarterDate = addMonths(agreementDate, i * 3);
          previews.push({
            paymentNumber: i + 1,
            dueDate: format(quarterDate, 'dd/MM/yyyy'),
            amount: quarterAmount,
            reminderDate: format(addDays(quarterDate, -7), 'dd/MM/yyyy'),
            daysFromAgreement: i * 90
          });
        }
        break;

      case 'three_times':
        const threeTimesAmount = totalAmount / 3;
        for (let i = 0; i < 3; i++) {
          const threeTimesDate = addMonths(agreementDate, i * 4);
          previews.push({
            paymentNumber: i + 1,
            dueDate: format(threeTimesDate, 'dd/MM/yyyy'),
            amount: threeTimesAmount,
            reminderDate: format(addDays(threeTimesDate, -7), 'dd/MM/yyyy'),
            daysFromAgreement: i * 120
          });
        }
        break;

      case 'monthly':
        const monthlyAmount = totalAmount / 12;
        for (let i = 0; i < 12; i++) {
          const monthlyDate = addMonths(agreementDate, i);
          previews.push({
            paymentNumber: i + 1,
            dueDate: format(monthlyDate, 'dd/MM/yyyy'),
            amount: monthlyAmount,
            reminderDate: format(addDays(monthlyDate, -7), 'dd/MM/yyyy'),
            daysFromAgreement: i * 30
          });
        }
        break;
    }

    setPaymentPreview(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAgreement) {
        const { error } = await supabase
          .from('client_agreements')
          .update(formData)
          .eq('id', editingAgreement.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_agreements')
          .insert([formData]);
        
        if (error) throw error;
      }

      resetForm();
      fetchAgreements();
    } catch (error) {
      console.error('Error saving agreement:', error);
    }
  };

  const handleEdit = (agreement: ClientAgreement) => {
    setEditingAgreement(agreement);
    setFormData({
      client_id: agreement.client_id,
      agreement_date: agreement.agreement_date,
      systems: agreement.systems,
      system_rate: agreement.system_rate,
      laptops: agreement.laptops,
      laptop_rate: agreement.laptop_rate,
      printers: agreement.printers,
      printer_rate: agreement.printer_rate,
      servers: agreement.servers,
      server_rate: agreement.server_rate,
      networking_rate: agreement.networking_rate,
      discount: agreement.discount,
      payment_mode: agreement.payment_mode,
      payment_frequency: agreement.payment_frequency,
      payment_details: agreement.payment_details || '',
      other_details: agreement.other_details || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agreement?')) {
      try {
        const { error } = await supabase
          .from('client_agreements')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchAgreements();
      } catch (error) {
        console.error('Error deleting agreement:', error);
      }
    }
  };

  const filteredAgreements = agreements.filter(agreement => {
    const matchesSearch = 
      agreement.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.clients?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      client_id: '',
      agreement_date: '',
      systems: 0,
      system_rate: 0,
      laptops: 0,
      laptop_rate: 0,
      printers: 0,
      printer_rate: 0,
      servers: 0,
      server_rate: 0,
      networking_rate: 0,
      discount: 0,
      payment_mode: 'cash',
      payment_frequency: 'full',
      payment_details: '',
      other_details: ''
    });
    setEditingAgreement(null);
    setShowAddModal(false);
    setPaymentPreview([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'half_yearly':
        return 'Half Yearly';
      case 'quarterly':
        return 'Quarterly';
      case 'three_times':
        return 'Three Times a Year';
      case 'monthly':
        return 'Monthly';
      case 'full':
        return 'Full Payment';
      default:
        return frequency;
    }
  };

  const getPaymentSplit = (frequency: string, totalAmount: number) => {
    switch (frequency) {
      case 'half_yearly':
        return `₹${(totalAmount / 2).toLocaleString('en-IN')} × 2 payments`;
      case 'quarterly':
        return `₹${(totalAmount / 4).toLocaleString('en-IN')} × 4 payments`;
      case 'three_times':
        return `₹${(totalAmount / 3).toLocaleString('en-IN')} × 3 payments`;
      case 'monthly':
        return `₹${(totalAmount / 12).toLocaleString('en-IN')} × 12 payments`;
      case 'full':
        return `₹${totalAmount.toLocaleString('en-IN')} × 1 payment`;
      default:
        return '';
    }
  };

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
              <FileText className="h-8 w-8 mr-3 text-primary-700" />
              Client Agreements
            </h1>
            <p className="text-gray-600 mt-1">
              Manage client agreements with equipment details and payment terms
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Agreement</span>
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
              placeholder="Search agreements by client name or contact person..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredAgreements.length} of {agreements.length} agreements
          </div>
        </div>
      </div>

      {/* Agreements List */}
      <div className="space-y-4">
        {filteredAgreements.map((agreement) => (
          <div key={agreement.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {agreement.clients?.company_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Contact: {agreement.clients?.contact_person}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {agreement.systems > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        <span>{agreement.systems} Systems</span>
                      </div>
                    )}
                    {agreement.laptops > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Laptop className="h-4 w-4 text-green-600" />
                        <span>{agreement.laptops} Laptops</span>
                      </div>
                    )}
                    {agreement.printers > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Printer className="h-4 w-4 text-purple-600" />
                        <span>{agreement.printers} Printers</span>
                      </div>
                    )}
                    {agreement.servers > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Server className="h-4 w-4 text-red-600" />
                        <span>{agreement.servers} Servers</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Agreement: {format(new Date(agreement.agreement_date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <IndianRupee className="h-4 w-4" />
                      <span>Total: {formatCurrency(agreement.total_cost)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CreditCard className="h-4 w-4" />
                      <span>{getFrequencyDisplay(agreement.payment_frequency)}</span>
                    </div>
                  </div>

                  {/* Payment Split Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Payment Split:</span>
                      <span className="text-blue-700">
                        {getPaymentSplit(agreement.payment_frequency, agreement.total_cost)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>
                    {agreement.status}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(agreement)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(agreement.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAgreements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No agreements found' : 'No agreements yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by creating your first client agreement'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Agreement</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAgreement ? 'Edit Agreement' : 'New Client Agreement'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
                      Agreement Date *
                    </label>
                    <input
                      type="date"
                      required
                      min="2020-01-01"
                      max="2030-12-31"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.agreement_date}
                      onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Equipment Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Equipment Details (All amounts in INR)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Systems Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.systems}
                          onChange={(e) => setFormData({ ...formData, systems: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.system_rate}
                          onChange={(e) => setFormData({ ...formData, system_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Laptops Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.laptops}
                          onChange={(e) => setFormData({ ...formData, laptops: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Laptop Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.laptop_rate}
                          onChange={(e) => setFormData({ ...formData, laptop_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Printers Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.printers}
                          onChange={(e) => setFormData({ ...formData, printers: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Printer Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.printer_rate}
                          onChange={(e) => setFormData({ ...formData, printer_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Servers Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.servers}
                          onChange={(e) => setFormData({ ...formData, servers: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Server Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.server_rate}
                          onChange={(e) => setFormData({ ...formData, server_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Networking Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.networking_rate}
                    onChange={(e) => setFormData({ ...formData, networking_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2" />
                  Pricing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                      {formatCurrency(calculateTotal())}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Terms
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.payment_mode}
                      onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Frequency
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.payment_frequency}
                      onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })}
                    >
                      <option value="full">Full Payment</option>
                      <option value="half_yearly">Half Yearly (50% each)</option>
                      <option value="quarterly">Quarterly (25% each)</option>
                      <option value="three_times">Three Times a Year (33.33% each)</option>
                      <option value="monthly">Monthly (Monthly installments)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Details
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.payment_details}
                      onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
                      placeholder="Additional payment details, bank information, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Preview */}
              {paymentPreview.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Payment Schedule & Reminder Preview
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Payment Split: {getPaymentSplit(formData.payment_frequency, calculateTotal())}
                      </p>
                      <p className="text-xs text-blue-700">
                        Reminders will be sent 7 days before each due date
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                      {paymentPreview.map((payment) => (
                        <div key={payment.paymentNumber} className="bg-white p-3 rounded border border-blue-200">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            Payment #{payment.paymentNumber}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-green-600" />
                              <span className="text-gray-600">Due: {payment.dueDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Bell className="h-3 w-3 text-yellow-600" />
                              <span className="text-gray-600">Reminder: {payment.reminderDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <IndianRupee className="h-3 w-3 text-blue-600" />
                              <span className="font-semibold text-blue-700">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                            {payment.daysFromAgreement > 0 && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-500">
                                  {payment.daysFromAgreement} days from agreement
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Details
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.other_details}
                  onChange={(e) => setFormData({ ...formData, other_details: e.target.value })}
                  placeholder="Any additional notes or details about the agreement"
                />
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
                  {editingAgreement ? 'Update Agreement' : 'Create Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};