import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  Calculator, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  PieChart,
  BarChart3,
  CreditCard,
  Banknote,
  Receipt,
  Building2,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AccountCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description: string | null;
  is_active: boolean;
}

interface AccountTransaction {
  id: string;
  transaction_date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  payment_method: string;
  reference_number: string | null;
  vendor_customer: string | null;
  invoice_number: string | null;
  receipt_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  account_categories: {
    name: string;
    type: string;
  };
  created_by_user: {
    name: string;
  };
  approved_by_user: {
    name: string;
  } | null;
}

interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  salary_expenses: number;
  advance_expenses: number;
}

export const Accounting = () => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('current_month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AccountTransaction | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    salary_expenses: 0,
    advance_expenses: 0
  });

  const [transactionForm, setTransactionForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    description: '',
    payment_method: 'cash',
    reference_number: '',
    vendor_customer: '',
    invoice_number: '',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    getCurrentUserRole();
  }, []);

  useEffect(() => {
    if (currentUserRole === 'admin') {
      fetchTransactions();
      fetchCategories();
      fetchFinancialSummary();
    }
  }, [currentUserRole, dateRange]);

  const getCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData) {
          setCurrentUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error('Error getting current user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'current_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'last_3_months':
        return {
          start: subMonths(startOfMonth(now), 2),
          end: endOfMonth(now)
        };
      case 'current_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const fetchTransactions = async () => {
    try {
      const dateFilter = getDateRangeFilter();
      
      const { data, error } = await supabase
        .from('account_transactions')
        .select(`
          *,
          account_categories (name, type),
          created_by_user:users!account_transactions_created_by_fkey (name),
          approved_by_user:users!account_transactions_approved_by_fkey (name)
        `)
        .gte('transaction_date', dateFilter.start.toISOString().split('T')[0])
        .lte('transaction_date', dateFilter.end.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('account_categories')
        .select('*')
        .eq('is_active', true)
        .order('type, name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data, error } = await supabase
        .rpc('get_monthly_financial_summary', {
          month_val: currentMonth,
          year_val: currentYear
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setFinancialSummary(data[0]);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser) throw new Error('Current user not found');

      const transactionData = {
        ...transactionForm,
        created_by: currentUser.id,
        status: 'pending'
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('account_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('account_transactions')
          .insert([transactionData]);
        
        if (error) throw error;
      }

      resetForm();
      fetchTransactions();
      fetchFinancialSummary();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction: ' + (error as Error).message);
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser) throw new Error('Current user not found');

      const { error } = await supabase
        .from('account_transactions')
        .update({
          status: 'approved',
          approved_by: currentUser.id
        })
        .eq('id', transactionId);
      
      if (error) throw error;
      
      fetchTransactions();
      fetchFinancialSummary();
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert('Error approving transaction: ' + (error as Error).message);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const { error } = await supabase
          .from('account_transactions')
          .delete()
          .eq('id', transactionId);
        
        if (error) throw error;
        
        fetchTransactions();
        fetchFinancialSummary();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction: ' + (error as Error).message);
      }
    }
  };

  const handleEdit = (transaction: AccountTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      transaction_date: transaction.transaction_date,
      category_id: transaction.account_categories ? 
        categories.find(c => c.name === transaction.account_categories.name)?.id || '' : '',
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      payment_method: transaction.payment_method,
      reference_number: transaction.reference_number || '',
      vendor_customer: transaction.vendor_customer || '',
      invoice_number: transaction.invoice_number || '',
      receipt_number: transaction.receipt_number || '',
      notes: transaction.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setTransactionForm({
      transaction_date: new Date().toISOString().split('T')[0],
      category_id: '',
      type: 'expense',
      amount: 0,
      description: '',
      payment_method: 'cash',
      reference_number: '',
      vendor_customer: '',
      invoice_number: '',
      receipt_number: '',
      notes: ''
    });
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendor_customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || 
      transaction.account_categories?.name === categoryFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  // If not admin, show access denied
  if (currentUserRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the accounting system. This feature is restricted to administrators only.
          </p>
          <p className="text-sm text-gray-500">
            Contact your system administrator if you need access to financial data.
          </p>
        </div>
      </div>
    );
  }

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
              <Calculator className="h-8 w-8 mr-3 text-primary-700" />
              Accounting & Finance
            </h1>
            <p className="text-gray-600 mt-1">
              Complete income and expenditure management system
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Income</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(financialSummary.total_income)}</p>
              <p className="text-green-100 text-sm mt-1">This month</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Expenses</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(financialSummary.total_expenses)}</p>
              <p className="text-red-100 text-sm mt-1">This month</p>
            </div>
            <TrendingDown className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className={`bg-gradient-to-r ${
          financialSummary.net_profit >= 0 
            ? 'from-blue-500 to-blue-600' 
            : 'from-orange-500 to-orange-600'
        } rounded-xl shadow-sm p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Net Profit</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(financialSummary.net_profit)}</p>
              <p className="text-blue-100 text-sm mt-1">This month</p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Salary Expenses</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(financialSummary.salary_expenses)}</p>
              <p className="text-purple-100 text-sm mt-1">This month</p>
            </div>
            <User className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Advance Payments</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(financialSummary.advance_expenses)}</p>
              <p className="text-yellow-100 text-sm mt-1">This month</p>
            </div>
            <Banknote className="h-12 w-12 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search transactions by description, vendor, reference, or invoice..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="current_year">Current Year</option>
            </select>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">{transaction.description}</div>
                      {transaction.vendor_customer && (
                        <div className="text-xs text-gray-500">{transaction.vendor_customer}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.account_categories?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.payment_method}</div>
                    {transaction.reference_number && (
                      <div className="text-xs text-gray-500">Ref: {transaction.reference_number}</div>
                    )}
                    {transaction.invoice_number && (
                      <div className="text-xs text-gray-500">Invoice: {transaction.invoice_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transaction.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(transaction.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No transactions found' : 'No transactions yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by adding your first transaction'
            }
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add First Transaction</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.transaction_date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as 'income' | 'expense' })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.category_id}
                    onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter(cat => cat.type === transactionForm.type)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    placeholder="Brief description of the transaction"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.payment_method}
                    onChange={(e) => setTransactionForm({ ...transactionForm, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor/Customer
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.vendor_customer}
                    onChange={(e) => setTransactionForm({ ...transactionForm, vendor_customer: e.target.value })}
                    placeholder="Name of vendor or customer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.reference_number}
                    onChange={(e) => setTransactionForm({ ...transactionForm, reference_number: e.target.value })}
                    placeholder="Transaction reference number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.invoice_number}
                    onChange={(e) => setTransactionForm({ ...transactionForm, invoice_number: e.target.value })}
                    placeholder="Invoice number if applicable"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.receipt_number}
                    onChange={(e) => setTransactionForm({ ...transactionForm, receipt_number: e.target.value })}
                    placeholder="Receipt number if applicable"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={transactionForm.notes}
                    onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                    placeholder="Additional notes about the transaction"
                  />
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
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};