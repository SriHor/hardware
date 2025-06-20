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
  MapPin,
  Calendar,
  CreditCard,
  User,
  Home,
  AlertCircle,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  last_login: string | null;
  created_at: string;
  designation_id: string | null;
  employee_id: string | null;
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
  status: string;
  total_repaid: number;
}

export const Staff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDesignationModal, setShowAddDesignationModal] = useState(false);
  const [showDesignationsModal, setShowDesignationsModal] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'frontoffice',
    designation_id: '',
    employee_id: '',
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
    ifsc_code: '',
    active: true
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

  const fetchFamilyMembers = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_family_members')
        .select('*')
        .eq('employee_id', employeeId)
        .order('name');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const fetchEmployeeAdvances = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .eq('employee_id', employeeId)
        .order('advance_date', { ascending: false });

      if (error) throw error;
      setEmployeeAdvances(data || []);
    } catch (error) {
      console.error('Error fetching employee advances:', error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get current user to set created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current user's data to check permissions
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
          employee_id: staffForm.employee_id || null,
          joining_date: staffForm.joining_date || null,
          phone_number: staffForm.phone_number || null,
          address: staffForm.address || null,
          emergency_contact_name: staffForm.emergency_contact_name || null,
          emergency_contact_phone: staffForm.emergency_contact_phone || null,
          emergency_contact_relation: staffForm.emergency_contact_relation || null,
          bank_account_number: staffForm.bank_account_number || null,
          bank_name: staffForm.bank_name || null,
          ifsc_code: staffForm.ifsc_code || null
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
      // Get current user to check permissions
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
          employee_id: staffForm.employee_id || null,
          joining_date: staffForm.joining_date || null,
          phone_number: staffForm.phone_number || null,
          address: staffForm.address || null,
          emergency_contact_name: staffForm.emergency_contact_name || null,
          emergency_contact_phone: staffForm.emergency_contact_phone || null,
          emergency_contact_relation: staffForm.emergency_contact_relation || null,
          bank_account_number: staffForm.bank_account_number || null,
          bank_name: staffForm.bank_name || null,
          ifsc_code: staffForm.ifsc_code || null
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

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get current user to set created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Only admins can add designations');
      }

      const { error } = await supabase
        .from('designations')
        .insert([{
          ...designationForm,
          created_by: currentUser.id
        }]);
      
      if (error) throw error;
      
      resetDesignationForm();
      fetchDesignations();
    } catch (error) {
      console.error('Error adding designation:', error);
      alert('Error adding designation: ' + (error as Error).message);
    }
  };

  const handleUpdateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDesignation) return;
    
    try {
      // Check permissions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Only admins can update designations');
      }

      const { error } = await supabase
        .from('designations')
        .update(designationForm)
        .eq('id', editingDesignation.id);
      
      if (error) throw error;
      
      resetDesignationForm();
      fetchDesignations();
    } catch (error) {
      console.error('Error updating designation:', error);
      alert('Error updating designation: ' + (error as Error).message);
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        // Check permissions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data: currentUser } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();

        if (!currentUser || currentUser.role !== 'admin') {
          throw new Error('Only admins can delete designations');
        }

        const { error } = await supabase
          .from('designations')
          .update({ is_active: false })
          .eq('id', id);
        
        if (error) throw error;
        fetchDesignations();
      } catch (error) {
        console.error('Error deleting designation:', error);
        alert('Error deleting designation: ' + (error as Error).message);
      }
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
          date_of_birth: familyForm.date_of_birth || null,
          phone_number: familyForm.phone_number || null,
          occupation: familyForm.occupation || null
        }]);
      
      if (error) throw error;
      
      resetFamilyForm();
      fetchFamilyMembers(selectedEmployee.id);
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
          monthly_deduction: advanceForm.monthly_deduction || null,
          notes: advanceForm.notes || null
        }]);
      
      if (error) throw error;
      
      resetAdvanceForm();
      fetchEmployeeAdvances(selectedEmployee.id);
    } catch (error) {
      console.error('Error adding advance:', error);
      alert('Error adding advance: ' + (error as Error).message);
    }
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setStaffForm({
      name: member.name,
      email: member.email,
      role: member.role,
      designation_id: member.designation_id || '',
      employee_id: member.employee_id || '',
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
      ifsc_code: member.ifsc_code || '',
      active: member.active
    });
    setShowAddStaffModal(true);
  };

  const handleEditDesignation = (designation: Designation) => {
    setEditingDesignation(designation);
    setDesignationForm({
      name: designation.name,
      description: designation.description,
      department: designation.department,
      level: designation.level,
      is_active: designation.is_active
    });
    setShowAddDesignationModal(true);
  };

  const handleViewEmployeeDetails = (employee: Staff) => {
    setSelectedEmployee(employee);
    fetchFamilyMembers(employee.id);
    fetchEmployeeAdvances(employee.id);
    setShowEmployeeDetailsModal(true);
  };

  const resetStaffForm = () => {
    setStaffForm({
      name: '',
      email: '',
      role: 'frontoffice',
      designation_id: '',
      employee_id: '',
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
      ifsc_code: '',
      active: true
    });
    setEditingStaff(null);
    setShowAddStaffModal(false);
  };

  const resetDesignationForm = () => {
    setDesignationForm({
      name: '',
      description: '',
      department: '',
      level: 1,
      is_active: true
    });
    setEditingDesignation(null);
    setShowAddDesignationModal(false);
  };

  const resetFamilyForm = () => {
    setFamilyForm({
      name: '',
      relation: '',
      phone_number: '',
      date_of_birth: '',
      occupation: '',
      is_emergency_contact: false
    });
    setShowAddFamilyModal(false);
  };

  const resetAdvanceForm = () => {
    setAdvanceForm({
      amount: 0,
      reason: '',
      advance_date: new Date().toISOString().split('T')[0],
      repayment_start_date: '',
      monthly_deduction: 0,
      notes: ''
    });
    setShowAddAdvanceModal(false);
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

  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-red-100 text-red-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 1:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 4: return 'Executive';
      case 3: return 'Manager';
      case 2: return 'Senior';
      case 1: return 'Junior';
      default: return 'Entry';
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

  // Check if current user has permission to add/edit staff
  const canManageStaff = currentUserRole === 'admin' || currentUserRole === 'manager';

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
              Staff Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your team members, designations, and roles
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
                <span>Add Staff Member</span>
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
              You have read-only access to staff information. Contact an administrator to add or modify staff members.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            <p className="text-sm text-gray-600">Total Staff</p>
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
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search staff by name, email, employee ID, or designation..."
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
            {filteredStaff.length} of {staff.length} staff members
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
                      {member.designations && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(member.designations.level)}`}>
                          {getLevelText(member.designations.level)}
                        </span>
                      )}
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
                    <p>Joined: {format(new Date(member.created_at), 'MMM d, yyyy')}</p>
                    {member.joining_date && (
                      <p>Official joining: {format(new Date(member.joining_date), 'MMM d, yyyy')}</p>
                    )}
                    {member.last_login && (
                      <p>Last login: {format(new Date(member.last_login), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>

                {/* Salary Information */}
                {(member.basic_salary > 0 || member.allowances > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900 text-sm">Salary Details</span>
                    </div>
                    <div className="space-y-1 text-xs text-green-700">
                      {member.basic_salary > 0 && (
                        <div className="flex justify-between">
                          <span>Basic:</span>
                          <span className="font-medium">{formatCurrency(member.basic_salary)}</span>
                        </div>
                      )}
                      {member.allowances > 0 && (
                        <div className="flex justify-between">
                          <span>Allowances:</span>
                          <span className="font-medium">{formatCurrency(member.allowances)}</span>
                        </div>
                      )}
                      {member.deductions > 0 && (
                        <div className="flex justify-between">
                          <span>Deductions:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(member.deductions)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-green-300 pt-1 mt-2">
                        <span className="font-medium">Net Salary:</span>
                        <span className="font-bold">{formatCurrency(member.basic_salary + member.allowances - member.deductions)}</span>
                      </div>
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
                      onClick={() => handleViewEmployeeDetails(member)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canManageStaff && (
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Edit"
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
            {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all' ? 'No staff members found' : 'No staff members yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by adding your first staff member'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && departmentFilter === 'all' && canManageStaff && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add First Staff Member</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showAddStaffModal && canManageStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
            </div>
            
            <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.employee_id}
                      onChange={(e) => setStaffForm({ ...staffForm, employee_id: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.phone_number}
                      onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.joining_date}
                      onChange={(e) => setStaffForm({ ...staffForm, joining_date: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.address}
                      onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_name}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_phone}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relation
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.emergency_contact_relation}
                      onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_relation: e.target.value })}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary (₹)
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowances (₹)
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deductions (₹)
                    </label>
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
              </div>

              {/* Bank Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bank Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.bank_account_number}
                      onChange={(e) => setStaffForm({ ...staffForm, bank_account_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.bank_name}
                      onChange={(e) => setStaffForm({ ...staffForm, bank_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={staffForm.ifsc_code}
                      onChange={(e) => setStaffForm({ ...staffForm, ifsc_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={staffForm.active}
                  onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Active
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
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Employee Details - {selectedEmployee.name}
                </h3>
                <button
                  onClick={() => setShowEmployeeDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedEmployee.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedEmployee.email}</div>
                    <div><span className="font-medium">Employee ID:</span> {selectedEmployee.employee_id || ''}</div>
                    <div><span className="font-medium">Phone:</span> {selectedEmployee.phone_number || ''}</div>
                    <div><span className="font-medium">Role:</span> {selectedEmployee.role}</div>
                    <div><span className="font-medium">Designation:</span> {selectedEmployee.designations?.name || 'Not assigned'}</div>
                    <div><span className="font-medium">Joining Date:</span> {selectedEmployee.joining_date ? format(new Date(selectedEmployee.joining_date), 'dd/MM/yyyy') : ''}</div>
                    <div><span className="font-medium">Status:</span> {selectedEmployee.active ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Address & Emergency Contact
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Address:</span> {selectedEmployee.address || ''}</div>
                    <div><span className="font-medium">Emergency Contact:</span> {selectedEmployee.emergency_contact_name || ''}</div>
                    <div><span className="font-medium">Emergency Phone:</span> {selectedEmployee.emergency_contact_phone || ''}</div>
                    <div><span className="font-medium">Relation:</span> {selectedEmployee.emergency_contact_relation || ''}</div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              {(selectedEmployee.basic_salary > 0 || selectedEmployee.allowances > 0 || selectedEmployee.deductions > 0) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Information
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-900">Basic Salary:</span>
                        <p className="text-green-700 font-semibold">{formatCurrency(selectedEmployee.basic_salary)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-900">Allowances:</span>
                        <p className="text-green-700 font-semibold">{formatCurrency(selectedEmployee.allowances)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-900">Deductions:</span>
                        <p className="text-red-600 font-semibold">{formatCurrency(selectedEmployee.deductions)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-900">Net Salary:</span>
                        <p className="text-green-800 font-bold text-lg">{formatCurrency(selectedEmployee.basic_salary + selectedEmployee.allowances - selectedEmployee.deductions)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Information */}
              {(selectedEmployee.bank_account_number || selectedEmployee.bank_name || selectedEmployee.ifsc_code) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Bank Information
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-900">Account Number:</span>
                        <p className="text-blue-700">{selectedEmployee.bank_account_number || ''}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">Bank Name:</span>
                        <p className="text-blue-700">{selectedEmployee.bank_name || ''}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">IFSC Code:</span>
                        <p className="text-blue-700">{selectedEmployee.ifsc_code || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Family Members
                  </h4>
                  {currentUserRole === 'admin' && (
                    <button
                      onClick={() => setShowAddFamilyModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Family Member</span>
                    </button>
                  )}
                </div>
                {familyMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{member.name}</h5>
                          {member.is_emergency_contact && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Emergency Contact</span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><span className="font-medium">Relation:</span> {member.relation}</div>
                          {member.phone_number && <div><span className="font-medium">Phone:</span> {member.phone_number}</div>}
                          {member.date_of_birth && <div><span className="font-medium">DOB:</span> {format(new Date(member.date_of_birth), 'dd/MM/yyyy')}</div>}
                          {member.occupation && <div><span className="font-medium">Occupation:</span> {member.occupation}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No family members added</p>
                )}
              </div>

              {/* Employee Advances */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Employee Advances
                  </h4>
                  {currentUserRole === 'admin' && (
                    <button
                      onClick={() => setShowAddAdvanceModal(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Advance</span>
                    </button>
                  )}
                </div>
                {employeeAdvances.length > 0 ? (
                  <div className="space-y-3">
                    {employeeAdvances.map((advance) => (
                      <div key={advance.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{formatCurrency(advance.amount)}</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              advance.status === 'active' ? 'bg-green-100 text-green-800' :
                              advance.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {advance.status}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{format(new Date(advance.advance_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><span className="font-medium">Reason:</span> {advance.reason}</div>
                          <div><span className="font-medium">Repaid:</span> {formatCurrency(advance.total_repaid)}</div>
                          <div><span className="font-medium">Balance:</span> {formatCurrency(advance.amount - advance.total_repaid)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No advances taken</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddFamilyModal && selectedEmployee && currentUserRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add Family Member</h3>
            </div>
            
            <form onSubmit={handleAddFamilyMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relation *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={familyForm.phone_number}
                  onChange={(e) => setFamilyForm({ ...familyForm, phone_number: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={familyForm.date_of_birth}
                  onChange={(e) => setFamilyForm({ ...familyForm, date_of_birth: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
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
                  id="is_emergency_contact"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={familyForm.is_emergency_contact}
                  onChange={(e) => setFamilyForm({ ...familyForm, is_emergency_contact: e.target.checked })}
                />
                <label htmlFor="is_emergency_contact" className="ml-2 block text-sm text-gray-700">
                  Emergency Contact
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetFamilyForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
                >
                  Add Family Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAddAdvanceModal && selectedEmployee && currentUserRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add Employee Advance</h3>
            </div>
            
            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
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
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Reason for advance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.advance_date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, advance_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repayment Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.repayment_start_date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, repayment_start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Deduction (₹)
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  placeholder="Additional notes about the advance"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetAdvanceForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
                >
                  Add Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designations Management Modal */}
      {showDesignationsModal && currentUserRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Manage Designations</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAddDesignationModal(true)}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Designation</span>
                  </button>
                  <button
                    onClick={() => setShowDesignationsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {designations.map((designation) => (
                  <div key={designation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{designation.name}</h4>
                        <p className="text-sm text-gray-600">{designation.description}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditDesignation(designation)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDesignation(designation.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{designation.department}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(designation.level)}`}>
                        Level {designation.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Designation Modal */}
      {showAddDesignationModal && currentUserRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDesignation ? 'Edit Designation' : 'Add New Designation'}
              </h3>
            </div>
            
            <form onSubmit={editingDesignation ? handleUpdateDesignation : handleAddDesignation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={designationForm.name}
                  onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={designationForm.description}
                  onChange={(e) => setDesignationForm({ ...designationForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={designationForm.department}
                  onChange={(e) => setDesignationForm({ ...designationForm, department: e.target.value })}
                  placeholder="e.g., Technical, Sales, Administration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={designationForm.level}
                  onChange={(e) => setDesignationForm({ ...designationForm, level: parseInt(e.target.value) })}
                >
                  <option value={1}>Level 1 - Junior</option>
                  <option value={2}>Level 2 - Senior</option>
                  <option value={3}>Level 3 - Manager</option>
                  <option value={4}>Level 4 - Executive</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="designation_active"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={designationForm.is_active}
                  onChange={(e) => setDesignationForm({ ...designationForm, is_active: e.target.checked })}
                />
                <label htmlFor="designation_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetDesignationForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
                >
                  {editingDesignation ? 'Update Designation' : 'Add Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};