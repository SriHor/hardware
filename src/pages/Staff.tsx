import { useState, useEffect } from 'react';
import { supabase } from '../App';
import { 
  UserCog, 
  Plus, 
  Search, 
  Mail, 
  Phone,
  Shield,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Users,
  Building2,
  Award,
  Settings,
  Eye,
  X,
  Save,
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard,
  UserPlus,
  FileText,
  TrendingUp,
  Banknote,
  Calculator,
  PiggyBank
} from 'lucide-react';
import { format } from 'date-fns';

interface Staff {
  id: string;
  employee_id: string | null;
  name: string;
  email: string;
  role: string;
  active: boolean;
  last_login: string | null;
  created_at: string;
  joining_date: string | null;
  phone_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  basic_salary: number;
  allowances: number;
  deductions: number;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  designation_id: string | null;
  designations: {
    name: string;
    description: string;
    department: string;
    level: number;
  } | null;
}

interface Designation {
  id: string;
  name: string;
  description: string;
  department: string;
  level: number;
  is_active: boolean;
  created_at: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone_number: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  is_emergency_contact: boolean;
}

interface EmployeeAdvance {
  id: string;
  amount: number;
  reason: string;
  advance_date: string;
  repayment_start_date: string | null;
  monthly_deduction: number | null;
  total_repaid: number;
  status: string;
  notes: string | null;
}

export const Staff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDesignationModal, setShowAddDesignationModal] = useState(false);
  const [showDesignationsModal, setShowDesignationsModal] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'family' | 'advances'>('basic');
  
  const [staffForm, setStaffForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    role: 'frontoffice',
    designation_id: '',
    active: true,
    joining_date: '',
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    bank_account_number: '',
    bank_name: '',
    ifsc_code: ''
  });

  const [designationForm, setDesignationForm] = useState({
    name: '',
    description: '',
    department: '',
    level: 1,
    is_active: true
  });

  const [familyForm, setFamilyForm] = useState({
    name: '',
    relation: '',
    phone_number: '',
    date_of_birth: '',
    occupation: '',
    is_emergency_contact: false
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: 0,
    reason: '',
    advance_date: new Date().toISOString().split('T')[0],
    repayment_start_date: '',
    monthly_deduction: 0,
    notes: ''
  });

  useEffect(() => {
    fetchStaff();
    fetchDesignations();
    getCurrentUserRole();
  }, []);

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
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          designations!users_designation_id_fkey (name, description, department, level)
        `)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('is_active', true)
        .order('department, level, name');

      if (error) throw error;
      setDesignations(data || []);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const fetchEmployeeDetails = async (employeeId: string) => {
    try {
      // Fetch family members
      const { data: familyData, error: familyError } = await supabase
        .from('employee_family_members')
        .select('*')
        .eq('employee_id', employeeId)
        .order('name');

      if (familyError) throw familyError;
      setFamilyMembers(familyData || []);

      // Fetch advances
      const { data: advancesData, error: advancesError } = await supabase
        .from('employee_advances')
        .select('*')
        .eq('employee_id', employeeId)
        .order('advance_date', { ascending: false });

      if (advancesError) throw advancesError;
      setEmployeeAdvances(advancesData || []);
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        throw new Error('Insufficient permissions to add staff');
      }

      const { error } = await supabase
        .from('users')
        .insert([{
          ...staffForm,
          designation_id: staffForm.designation_id || null,
          joining_date: staffForm.joining_date || null,
          basic_salary: staffForm.basic_salary || 0,
          allowances: staffForm.allowances || 0,
          deductions: staffForm.deductions || 0
        }]);
      
      if (error) throw error;
      
      resetStaffForm();
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Error adding staff: ' + (error as Error).message);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStaff) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        throw new Error('Insufficient permissions to update staff');
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...staffForm,
          designation_id: staffForm.designation_id || null,
          joining_date: staffForm.joining_date || null,
          basic_salary: staffForm.basic_salary || 0,
          allowances: staffForm.allowances || 0,
          deductions: staffForm.deductions || 0
        })
        .eq('id', editingStaff.id);
      
      if (error) throw error;
      
      resetStaffForm();
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Error updating staff: ' + (error as Error).message);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
    try {
      const { error } = await supabase
        .from('employee_family_members')
        .insert([{
          ...familyForm,
          employee_id: selectedEmployee.id,
          date_of_birth: familyForm.date_of_birth || null
        }]);
      
      if (error) throw error;
      
      setFamilyForm({
        name: '',
        relation: '',
        phone_number: '',
        date_of_birth: '',
        occupation: '',
        is_emergency_contact: false
      });
      
      fetchEmployeeDetails(selectedEmployee.id);
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('Error adding family member: ' + (error as Error).message);
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
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
        .from('employee_advances')
        .insert([{
          ...advanceForm,
          employee_id: selectedEmployee.id,
          approved_by: currentUser.id,
          repayment_start_date: advanceForm.repayment_start_date || null,
          monthly_deduction: advanceForm.monthly_deduction || null
        }]);
      
      if (error) throw error;
      
      setAdvanceForm({
        amount: 0,
        reason: '',
        advance_date: new Date().toISOString().split('T')[0],
        repayment_start_date: '',
        monthly_deduction: 0,
        notes: ''
      });
      
      setShowAdvanceModal(false);
      fetchEmployeeDetails(selectedEmployee.id);
    } catch (error) {
      console.error('Error adding advance:', error);
      alert('Error adding advance: ' + (error as Error).message);
    }
  };

  const handleViewEmployee = (employee: Staff) => {
    setSelectedEmployee(employee);
    fetchEmployeeDetails(employee.id);
    setShowEmployeeDetailsModal(true);
    setActiveTab('basic');
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setStaffForm({
      employee_id: member.employee_id || '',
      name: member.name,
      email: member.email,
      role: member.role,
      designation_id: member.designation_id || '',
      active: member.active,
      joining_date: member.joining_date || '',
      phone_number: member.phone_number || '',
      address: member.address || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      emergency_contact_relation: member.emergency_contact_relation || '',
      basic_salary: member.basic_salary || 0,
      allowances: member.allowances || 0,
      deductions: member.deductions || 0,
      bank_account_number: member.bank_account_number || '',
      bank_name: member.bank_name || '',
      ifsc_code: member.ifsc_code || ''
    });
    setShowAddStaffModal(true);
  };

  const resetStaffForm = () => {
    setStaffForm({
      employee_id: '',
      name: '',
      email: '',
      role: 'frontoffice',
      designation_id: '',
      active: true,
      joining_date: '',
      phone_number: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      basic_salary: 0,
      allowances: 0,
      deductions: 0,
      bank_account_number: '',
      bank_name: '',
      ifsc_code: ''
    });
    setEditingStaff(null);
    setShowAddStaffModal(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'engineer':
        return 'bg-blue-100 text-blue-800';
      case 'telecaller':
        return 'bg-green-100 text-green-800';
      case 'frontoffice':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.designations?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || member.designations?.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const departments = [...new Set(designations.map(d => d.department))].filter(Boolean);
  const canManageStaff = currentUserRole === 'admin' || currentUserRole === 'manager';
  const canViewFinancials = currentUserRole === 'admin';

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
              <UserCog className="h-8 w-8 mr-3 text-primary-700" />
              Employee Management
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive employee information, payroll, and family details
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {currentUserRole === 'admin' && (
              <button
                onClick={() => setShowDesignationsModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Award className="h-5 w-5" />
                <span>Manage Designations</span>
              </button>
            )}
            {canManageStaff && (
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permission Notice */}
      {!canManageStaff && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">
              You have read-only access to employee information. Contact an administrator to add or modify employee records.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            <p className="text-sm text-gray-600">Total Employees</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.active).length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.role === 'engineer').length}
            </p>
            <p className="text-sm text-gray-600">Engineers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {staff.filter(s => s.role === 'telecaller').length}
            </p>
            <p className="text-sm text-gray-600">Telecallers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {designations.length}
            </p>
            <p className="text-sm text-gray-600">Designations</p>
          </div>
        </div>
        {canViewFinancials && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(staff.reduce((sum, s) => sum + (s.basic_salary || 0) + (s.allowances || 0), 0))}
              </p>
              <p className="text-sm text-gray-600">Monthly Payroll</p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, employee ID, or designation..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="engineer">Engineer</option>
                <option value="telecaller">Telecaller</option>
                <option value="frontoffice">Front Office</option>
              </select>
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredStaff.length} of {staff.length} employees
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <div className="h-8 w-8 bg-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    {member.employee_id && (
                      <p className="text-xs text-gray-500">ID: {member.employee_id}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {member.active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {member.designations && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 text-sm">{member.designations.name}</span>
                    </div>
                    <p className="text-blue-700 text-xs">{member.designations.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                      <span>Dept: {member.designations.department}</span>
                      <span>Level: {member.designations.level}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                  {member.phone_number && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone_number}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {member.joining_date && (
                      <p>Joined: {format(new Date(member.joining_date), 'MMM d, yyyy')}</p>
                    )}
                    {member.last_login && (
                      <p>Last login: {format(new Date(member.last_login), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>

                {canViewFinancials && (member.basic_salary > 0 || member.allowances > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900 text-sm">Salary Details</span>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>Basic: {formatCurrency(member.basic_salary || 0)}</p>
                      <p>Allowances: {formatCurrency(member.allowances || 0)}</p>
                      <p className="font-semibold">Total: {formatCurrency((member.basic_salary || 0) + (member.allowances || 0))}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewEmployee(member)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canManageStaff && (
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all' ? 'No employees found' : 'No employees yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by adding your first employee'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && departmentFilter === 'all' && canManageStaff && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add First Employee</span>
            </button>
          )}
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <UserCog className="h-6 w-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedEmployee.name}</h3>
                    <p className="text-sm text-gray-600">{selectedEmployee.designations?.name || selectedEmployee.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {canViewFinancials && (
                    <button
                      onClick={() => setShowAdvanceModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <PiggyBank className="h-4 w-4" />
                      <span>Add Advance</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowEmployeeDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mt-4">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'basic'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Basic Information
                  </button>
                  {canViewFinancials && (
                    <button
                      onClick={() => setActiveTab('financial')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'financial'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Financial Details
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('family')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'family'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Family Members
                  </button>
                  {canViewFinancials && (
                    <button
                      onClick={() => setActiveTab('advances')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'advances'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Advances ({employeeAdvances.filter(a => a.status === 'active').length})
                    </button>
                  )}
                </nav>
              </div>
            </div>
            
            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Personal Information</h4>
                    <div className="space-y-3 text-sm">
                      <div><span className="font-medium">Employee ID:</span> {selectedEmployee.employee_id || 'Not assigned'}</div>
                      <div><span className="font-medium">Full Name:</span> {selectedEmployee.name}</div>
                      <div><span className="font-medium">Email:</span> {selectedEmployee.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedEmployee.phone_number || 'Not provided'}</div>
                      <div><span className="font-medium">Role:</span> {selectedEmployee.role}</div>
                      <div><span className="font-medium">Designation:</span> {selectedEmployee.designations?.name || 'Not assigned'}</div>
                      <div><span className="font-medium">Joining Date:</span> {selectedEmployee.joining_date ? format(new Date(selectedEmployee.joining_date), 'dd/MM/yyyy') : 'Not provided'}</div>
                      <div><span className="font-medium">Status:</span> {selectedEmployee.active ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Contact & Emergency</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-gray-700 mt-1">{selectedEmployee.address || 'Not provided'}</p>
                      </div>
                      <div><span className="font-medium">Emergency Contact:</span> {selectedEmployee.emergency_contact_name || 'Not provided'}</div>
                      <div><span className="font-medium">Emergency Phone:</span> {selectedEmployee.emergency_contact_phone || 'Not provided'}</div>
                      <div><span className="font-medium">Relation:</span> {selectedEmployee.emergency_contact_relation || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Details Tab */}
              {activeTab === 'financial' && canViewFinancials && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Salary Information</h4>
                    <div className="space-y-3 text-sm">
                      <div><span className="font-medium">Basic Salary:</span> {formatCurrency(selectedEmployee.basic_salary || 0)}</div>
                      <div><span className="font-medium">Allowances:</span> {formatCurrency(selectedEmployee.allowances || 0)}</div>
                      <div><span className="font-medium">Deductions:</span> {formatCurrency(selectedEmployee.deductions || 0)}</div>
                      <div className="pt-2 border-t">
                        <span className="font-medium">Net Salary:</span> 
                        <span className="ml-2 text-lg font-bold text-green-600">
                          {formatCurrency((selectedEmployee.basic_salary || 0) + (selectedEmployee.allowances || 0) - (selectedEmployee.deductions || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Bank Details</h4>
                    <div className="space-y-3 text-sm">
                      <div><span className="font-medium">Bank Name:</span> {selectedEmployee.bank_name || 'Not provided'}</div>
                      <div><span className="font-medium">Account Number:</span> {selectedEmployee.bank_account_number || 'Not provided'}</div>
                      <div><span className="font-medium">IFSC Code:</span> {selectedEmployee.ifsc_code || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Members Tab */}
              {activeTab === 'family' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Family Members</h4>
                    {canManageStaff && (
                      <button
                        onClick={() => {/* Add family member form */}}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>
                  
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No family members added</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{member.name}</h5>
                              <p className="text-sm text-gray-600">{member.relation}</p>
                              {member.phone_number && (
                                <p className="text-sm text-gray-500">{member.phone_number}</p>
                              )}
                              {member.date_of_birth && (
                                <p className="text-sm text-gray-500">DOB: {format(new Date(member.date_of_birth), 'dd/MM/yyyy')}</p>
                              )}
                              {member.occupation && (
                                <p className="text-sm text-gray-500">Occupation: {member.occupation}</p>
                              )}
                            </div>
                            {member.is_emergency_contact && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Emergency Contact
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Family Member Form */}
                  {canManageStaff && (
                    <div className="mt-6 border-t pt-6">
                      <h5 className="font-medium text-gray-900 mb-4">Add Family Member</h5>
                      <form onSubmit={handleAddFamilyMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={familyForm.name}
                            onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relation *</label>
                          <select
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={familyForm.relation}
                            onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value })}
                          >
                            <option value="">Select relation</option>
                            <option value="spouse">Spouse</option>
                            <option value="child">Child</option>
                            <option value="parent">Parent</option>
                            <option value="sibling">Sibling</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={familyForm.phone_number}
                            onChange={(e) => setFamilyForm({ ...familyForm, phone_number: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={familyForm.date_of_birth}
                            onChange={(e) => setFamilyForm({ ...familyForm, date_of_birth: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={familyForm.occupation}
                            onChange={(e) => setFamilyForm({ ...familyForm, occupation: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="emergency_contact"
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            checked={familyForm.is_emergency_contact}
                            onChange={(e) => setFamilyForm({ ...familyForm, is_emergency_contact: e.target.checked })}
                          />
                          <label htmlFor="emergency_contact" className="ml-2 block text-sm text-gray-700">
                            Emergency Contact
                          </label>
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Add Family Member
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Advances Tab */}
              {activeTab === 'advances' && canViewFinancials && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Employee Advances</h4>
                    <div className="text-sm text-gray-600">
                      Total Outstanding: {formatCurrency(employeeAdvances.filter(a => a.status === 'active').reduce((sum, a) => sum + (a.amount - a.total_repaid), 0))}
                    </div>
                  </div>
                  
                  {employeeAdvances.length === 0 ? (
                    <div className="text-center py-8">
                      <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No advances taken</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeAdvances.map((advance) => (
                        <div key={advance.id} className={`border rounded-lg p-4 ${
                          advance.status === 'active' ? 'border-yellow-200 bg-yellow-50' : 
                          advance.status === 'completed' ? 'border-green-200 bg-green-50' : 
                          'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium text-gray-900">{formatCurrency(advance.amount)}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  advance.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                  advance.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {advance.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">{advance.reason}</p>
                              <p className="text-sm text-gray-500">Date: {format(new Date(advance.advance_date), 'dd/MM/yyyy')}</p>
                              {advance.monthly_deduction && (
                                <p className="text-sm text-gray-500">Monthly Deduction: {formatCurrency(advance.monthly_deduction)}</p>
                              )}
                              {advance.notes && (
                                <p className="text-sm text-gray-500 mt-2">Notes: {advance.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Repaid: {formatCurrency(advance.total_repaid)}</p>
                              <p className="text-sm font-medium text-red-600">
                                Outstanding: {formatCurrency(advance.amount - advance.total_repaid)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAdvanceModal && selectedEmployee && canViewFinancials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add Employee Advance</h3>
              <p className="text-sm text-gray-600 mt-1">For: {selectedEmployee.name}</p>
            </div>
            
            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="e.g., Medical emergency, Personal loan, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Date *</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.advance_date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, advance_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.repayment_start_date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, repayment_start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Deduction</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.monthly_deduction}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, monthly_deduction: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  placeholder="Additional notes about the advance..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showAddStaffModal && canManageStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? 'Edit Employee' : 'Add New Employee'}
              </h3>
            </div>
            
            <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.employee_id}
                      onChange={(e) => setStaffForm({ ...staffForm, employee_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.phone_number}
                      onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    >
                      <option value="frontoffice">Front Office</option>
                      <option value="telecaller">Telecaller</option>
                      <option value="engineer">Engineer</option>
                      <option value="manager">Manager</option>
                      {currentUserRole === 'admin' && <option value="admin">Admin</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.designation_id}
                      onChange={(e) => setStaffForm({ ...staffForm, designation_id: e.target.value })}
                    >
                      <option value="">Select a designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.name} - {designation.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.joining_date}
                      onChange={(e) => setStaffForm({ ...staffForm, joining_date: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.address}
                      onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_name}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_phone}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_relation}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_relation: e.target.value })}
                    >
                      <option value="">Select relation</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Information - Admin Only */}
              {canViewFinancials && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.basic_salary}
                        onChange={(e) => setStaffForm({ ...staffForm, basic_salary: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.allowances}
                        onChange={(e) => setStaffForm({ ...staffForm, allowances: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.deductions}
                        onChange={(e) => setStaffForm({ ...staffForm, deductions: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.bank_name}
                        onChange={(e) => setStaffForm({ ...staffForm, bank_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.bank_account_number}
                        onChange={(e) => setStaffForm({ ...staffForm, bank_account_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={staffForm.ifsc_code}
                        onChange={(e) => setStaffForm({ ...staffForm, ifsc_code: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={staffForm.active}
                  onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Active Employee
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetStaffForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
                >
                  {editingStaff ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};