import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  Bell, 
  Calendar, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Filter,
  Search,
  Send,
  Edit,
  CreditCard,
  Building2,
  Receipt,
  X
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays, isSameMonth } from 'date-fns';

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

interface PaymentRecord {
  id: string;
  payment_date: string;
  amount_paid: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
}

export const PaymentReminders = () => {
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'thisMonth'>('payments');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSchedule | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    amount_paid: 0
  });

  useEffect(() => {
    fetchPaymentSchedules();
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

  const handlePaymentReceived = (payment: PaymentSchedule) => {
    setSelectedPayment(payment);
    setPaymentForm({
      payment_method: 'cash',
      reference_number: '',
      notes: '',
      amount_paid: payment.amount
    });
    setShowPaymentModal(true);
  };

  const submitPaymentRecord = async () => {
    if (!selectedPayment) return;

    try {
      // Insert payment record
      const { error: recordError } = await supabase
        .from('payment_records')
        .insert([{
          schedule_id: selectedPayment.id,
          agreement_id: selectedPayment.client_agreements ? 
            (await supabase.from('payment_schedules').select('agreement_id').eq('id', selectedPayment.id).single()).data?.agreement_id : null,
          payment_date: new Date().toISOString().split('T')[0],
          amount_paid: paymentForm.amount_paid,
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null
        }]);

      if (recordError) throw recordError;

      // Update payment schedule status
      const { error: updateError } = await supabase
        .from('payment_schedules')
        .update({ status: 'paid' })
        .eq('id', selectedPayment.id);

      if (updateError) throw updateError;

      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchPaymentSchedules();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const updateReminderDate = async (scheduleId: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from('payment_schedules')
        .update({ due_date: newDate })
        .eq('id', scheduleId);

      if (error) throw error;
      fetchPaymentSchedules();
    } catch (error) {
      console.error('Error updating reminder date:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    const today = new Date();
    const due = new Date(dueDate);
    return isBefore(due, today) && due.toDateString() !== today.toDateString();
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const filteredPayments = paymentSchedules.filter(schedule => {
    const matchesSearch = 
      schedule.client_agreements?.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.client_agreements?.clients?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const thisMonthPayments = paymentSchedules.filter(schedule => 
    isSameMonth(new Date(schedule.due_date), new Date()) && schedule.status === 'pending'
  );

  const upcomingPayments = filteredPayments.filter(schedule => 
    schedule.status === 'pending' && isUpcoming(schedule.due_date)
  );

  const overduePayments = filteredPayments.filter(schedule => 
    schedule.status === 'pending' && isOverdue(schedule.due_date)
  );

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
        return 'Half Yearly (6 months)';
      case 'quarterly':
        return 'Quarterly (3 months)';
      case 'three_times':
        return 'Three Times (4 months)';
      case 'monthly':
        return 'Monthly';
      case 'full':
        return 'Full Payment';
      default:
        return frequency;
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
              <Bell className="h-8 w-8 mr-3 text-primary-700" />
              Payment Reminders & Collection
            </h1>
            <p className="text-gray-600 mt-1">
              Track upcoming payments, send reminders, and record collections
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month Due</p>
              <p className="text-2xl font-bold text-blue-600">{thisMonthPayments.length}</p>
              <p className="text-xs text-blue-600 mt-1">
                {formatCurrency(thisMonthPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming (7 days)</p>
              <p className="text-2xl font-bold text-yellow-600">{upcomingPayments.length}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {formatCurrency(upcomingPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
              <p className="text-xs text-red-600 mt-1">
                {formatCurrency(overduePayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentSchedules.filter(p => p.status === 'pending').length}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {formatCurrency(paymentSchedules.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-green-600" />
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
              All Payment Reminders
            </button>
            <button
              onClick={() => setActiveTab('thisMonth')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'thisMonth'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              This Month Due ({thisMonthPayments.length})
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
          <div className="space-y-4">
            {(activeTab === 'thisMonth' ? thisMonthPayments : filteredPayments).map((schedule) => {
              const daysUntilDue = getDaysUntilDue(schedule.due_date);
              const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;
              const isOverduePayment = isOverdue(schedule.due_date);
              
              return (
                <div key={schedule.id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  isOverduePayment ? 'border-red-200 bg-red-50' : 
                  isUrgent ? 'border-yellow-200 bg-yellow-50' : 
                  schedule.status === 'paid' ? 'border-green-200 bg-green-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {schedule.client_agreements?.clients?.company_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Contact: {schedule.client_agreements?.clients?.contact_person}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500 block">Due Date:</span>
                          <p className="font-medium">{format(new Date(schedule.due_date), 'dd/MM/yyyy')}</p>
                          {daysUntilDue >= 0 && schedule.status === 'pending' && (
                            <p className={`text-xs ${isUrgent ? 'text-yellow-600' : 'text-gray-500'}`}>
                              {daysUntilDue === 0 ? 'Due Today' : `${daysUntilDue} days left`}
                            </p>
                          )}
                          {isOverduePayment && (
                            <p className="text-xs text-red-600 font-medium">
                              {Math.abs(daysUntilDue)} days overdue
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500 block">Amount:</span>
                          <p className="font-bold text-lg text-green-700">{formatCurrency(schedule.amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Payment #:</span>
                          <p className="font-medium">{schedule.payment_number}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Frequency:</span>
                          <p className="font-medium text-xs">{getFrequencyDisplay(schedule.client_agreements?.payment_frequency || '')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Agreement:</span>
                          <p className="font-medium">{format(new Date(schedule.client_agreements?.agreement_date || ''), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Contact:</span>
                          <p className="font-medium text-xs">{schedule.client_agreements?.clients?.mobile_office || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Next Payment Info */}
                      {schedule.status === 'pending' && schedule.payment_number < 12 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="text-sm">
                            <span className="font-medium text-blue-900">Next Payment Schedule:</span>
                            <div className="mt-1 text-blue-700">
                              {schedule.client_agreements?.payment_frequency === 'half_yearly' && (
                                <span>Next payment in 6 months ({format(addDays(new Date(schedule.due_date), 180), 'dd/MM/yyyy')})</span>
                              )}
                              {schedule.client_agreements?.payment_frequency === 'quarterly' && (
                                <span>Next payment in 3 months ({format(addDays(new Date(schedule.due_date), 90), 'dd/MM/yyyy')})</span>
                              )}
                              {schedule.client_agreements?.payment_frequency === 'three_times' && (
                                <span>Next payment in 4 months ({format(addDays(new Date(schedule.due_date), 120), 'dd/MM/yyyy')})</span>
                              )}
                              {schedule.client_agreements?.payment_frequency === 'monthly' && (
                                <span>Next payment in 1 month ({format(addDays(new Date(schedule.due_date), 30), 'dd/MM/yyyy')})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-1">
                        {getPaymentStatusIcon(schedule.status)}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {schedule.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePaymentReceived(schedule)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                            >
                              <Receipt className="h-4 w-4" />
                              <span>Payment Received</span>
                            </button>
                            
                            {!schedule.reminder_sent && (
                              <button
                                onClick={() => markReminderSent(schedule.id)}
                                className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm hover:bg-primary-200 transition-colors flex items-center space-x-2"
                              >
                                <Send className="h-4 w-4" />
                                <span>Send Reminder</span>
                              </button>
                            )}
                          </>
                        )}
                        
                        {schedule.reminder_sent && schedule.status === 'pending' && (
                          <span className="text-sm text-green-600 flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Reminder Sent</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(activeTab === 'thisMonth' ? thisMonthPayments : filteredPayments).length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'thisMonth' ? 'No payments due this month' : 'No payment reminders found'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'thisMonth' 
                    ? 'All payments for this month have been collected or there are no due payments.'
                    : 'Try adjusting your search terms or filters.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPayment.client_agreements?.clients?.company_name} - Payment #{selectedPayment.payment_number}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Received
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expected: {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {paymentForm.payment_method !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    placeholder="Cheque number, transaction ID, etc."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Additional notes about the payment..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPaymentRecord}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};