import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface PaymentSchedule {
  id: string;
  due_date: string;
  amount: number;
  payment_number: number;
  status: string;
  reminder_sent: boolean;
  client_agreements: {
    clients: {
      company_name: string;
      contact_person: string;
      mobile_office: string | null;
      email_id: string | null;
    };
    agreement_date: string;
    payment_frequency: string;
  };
}

interface AgreementReminder {
  id: string;
  agreement_date: string;
  status: string;
  clients: {
    company_name: string;
    contact_person: string;
    mobile_office: string | null;
    email_id: string | null;
  };
}

export const PaymentReminders = () => {
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [agreementReminders, setAgreementReminders] = useState<AgreementReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'agreements'>('payments');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPaymentSchedules();
    fetchAgreementReminders();
  }, []);

  const fetchPaymentSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          client_agreements (
            agreement_date,
            payment_frequency,
            clients (
              company_name,
              contact_person,
              mobile_office,
              email_id
            )
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setPaymentSchedules(data || []);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
    }
  };

  const fetchAgreementReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('client_agreements')
        .select(`
          id,
          agreement_date,
          status,
          clients (
            company_name,
            contact_person,
            mobile_office,
            email_id
          )
        `)
        .eq('status', 'active')
        .order('agreement_date', { ascending: true });

      if (error) throw error;
      setAgreementReminders(data || []);
    } catch (error) {
      console.error('Error fetching agreement reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markReminderSent = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('payment_schedules')
        .update({ reminder_sent: true })
        .eq('id', scheduleId);

      if (error) throw error;
      fetchPaymentSchedules();
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const isUpcoming = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    return isAfter(due, today) && isBefore(due, sevenDaysFromNow);
  };

  const isOverdue = (dueDate: string) => {
    return isBefore(new Date(dueDate), new Date()) && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const filteredPayments = paymentSchedules.filter(schedule => {
    const matchesSearch = 
      schedule.client_agreements?.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.client_agreements?.clients?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredAgreements = agreementReminders.filter(agreement => {
    const matchesSearch = 
      agreement.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.clients?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const upcomingPayments = filteredPayments.filter(schedule => 
    schedule.status === 'pending' && isUpcoming(schedule.due_date)
  );

  const overduePayments = filteredPayments.filter(schedule => 
    schedule.status === 'pending' && isOverdue(schedule.due_date)
  );

  const upcomingAgreements = filteredAgreements.filter(agreement => {
    const nextYear = new Date(agreement.agreement_date);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return isUpcoming(nextYear.toISOString());
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
              <Bell className="h-8 w-8 mr-3 text-primary-700" />
              Payment & Agreement Reminders
            </h1>
            <p className="text-gray-600 mt-1">
              Track upcoming payments and agreement renewals
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Payments</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingPayments.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agreement Renewals</p>
              <p className="text-2xl font-bold text-purple-600">{upcomingAgreements.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Due Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Reminders
            </button>
            <button
              onClick={() => setActiveTab('agreements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agreements'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Agreement Renewals
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by client name or contact person..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {activeTab === 'payments' && (
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'payments' ? (
            <div className="space-y-4">
              {filteredPayments.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getPaymentStatusIcon(schedule.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {schedule.client_agreements?.clients?.company_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Contact: {schedule.client_agreements?.clients?.contact_person}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <p className="font-medium">{format(new Date(schedule.due_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="font-medium">${schedule.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Payment #:</span>
                          <p className="font-medium">{schedule.payment_number}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Frequency:</span>
                          <p className="font-medium">{schedule.client_agreements?.payment_frequency.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {schedule.client_agreements?.clients?.mobile_office && (
                        <div className="mt-2 text-sm text-gray-600">
                          Phone: {schedule.client_agreements.clients.mobile_office}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                      
                      {schedule.status === 'pending' && !schedule.reminder_sent && (
                        <button
                          onClick={() => markReminderSent(schedule.id)}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200 transition-colors"
                        >
                          Mark Reminder Sent
                        </button>
                      )}
                      
                      {schedule.reminder_sent && (
                        <span className="text-xs text-green-600">✓ Reminder Sent</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment reminders found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgreements.map((agreement) => {
                const nextRenewal = new Date(agreement.agreement_date);
                nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
                
                return (
                  <div key={agreement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {agreement.clients?.company_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Contact: {agreement.clients?.contact_person}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Agreement Date:</span>
                            <p className="font-medium">{format(new Date(agreement.agreement_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Next Renewal:</span>
                            <p className="font-medium">{format(nextRenewal, 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Days Until Renewal:</span>
                            <p className="font-medium">
                              {Math.ceil((nextRenewal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>

                        {agreement.clients?.mobile_office && (
                          <div className="mt-2 text-sm text-gray-600">
                            Phone: {agreement.clients.mobile_office}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {agreement.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredAgreements.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No agreement renewals found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};