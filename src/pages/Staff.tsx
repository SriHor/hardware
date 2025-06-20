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
  Filter
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
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'frontoffice',
    designation_id: '',
    active: true
  });

  const [designationForm, setDesignationForm] = useState({
    name: '',
    description: '',
    department: '',
    level: 1,
    is_active: true
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
          designation_id: staffForm.designation_id || null
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
          designation_id: staffForm.designation_id || null
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

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
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

        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
          throw new Error('Insufficient permissions to delete staff');
        }

        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', staffId);
        
        if (error) throw error;
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff: ' + (error as Error).message);
      }
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

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setStaffForm({
      name: member.name,
      email: member.email,
      role: member.role,
      designation_id: member.designation_id || '',
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

  const resetStaffForm = () => {
    setStaffForm({
      name: '',
      email: '',
      role: 'frontoffice',
      designation_id: '',
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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              placeholder="Search staff by name, email, or designation..."
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
                  <div className="text-sm text-gray-500">
                    <p>Joined: {format(new Date(member.created_at), 'MMM d, yyyy')}</p>
                    {member.last_login && (
                      <p>Last login: {format(new Date(member.last_login), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
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
                    {canManageStaff && (
                      <>
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id, member.name)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
            </div>
            
            <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="p-6 space-y-4">
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