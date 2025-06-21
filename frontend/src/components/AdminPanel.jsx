import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useCurrency } from '../hooks/useCurrency';
import { 
  Users, 
  Shield, 
  User, 
  Search, 
  Wallet, 
  DollarSign,
  Save,
  X
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [error, setError] = useState('');
  
  // Balance management state
  const [editingBalance, setEditingBalance] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState('set');

  console.log('AdminPanel rendering, user:', user);

  useEffect(() => {
    console.log('AdminPanel useEffect triggered, user role:', user?.role);
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user, searchQuery, roleFilter, pagination.current]);

  const fetchUsers = async (page = 1) => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (roleFilter) params.append('role', roleFilter);
      params.append('page', page.toString());
      params.append('limit', '10');

      console.log('API call URL:', `/users/admin/search?${params.toString()}`);
      const response = await api.get(`/users/admin/search?${params.toString()}`);
      console.log('Users response:', response.data);
      
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to fetch users: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdating(userId);
      setError('');
      
      console.log('Updating user role:', userId, newRole);
      await api.put(`/users/admin/role/${userId}`, { role: newRole });
      
      // Update the user in the local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u._id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(`Failed to update user role: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const updateUserBalance = async (userId) => {
    try {
      setUpdating(userId);
      setError('');
      
      const amount = parseFloat(balanceAmount);
      
      if (isNaN(amount) || amount < 0) {
        setError('Please enter a valid amount');
        return;
      }

      console.log('Updating user balance:', userId, amount, balanceAction);
      await api.put(`/users/admin/balance/${userId}`, {
        balance: amount,
        action: balanceAction
      });

      // Refresh users to get updated balance
      await fetchUsers(pagination.current);
      
      // Reset editing state
      setEditingBalance(null);
      setBalanceAmount('');
      setBalanceAction('set');
    } catch (error) {
      console.error('Error updating balance:', error);
      setError(`Failed to update balance: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers(1);
  };

  const startEditingBalance = (userId, currentBalance) => {
    setEditingBalance(userId);
    setBalanceAmount(currentBalance.toString());
    setBalanceAction('set');
  };

  const cancelEditingBalance = () => {
    setEditingBalance(null);
    setBalanceAmount('');
    setBalanceAction('set');
  };

  // Debug information
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Is admin:', user?.role === 'admin');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600">
              Please log in to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You need admin privileges to access this page.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Current role: {user?.role || 'unknown'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">
          Manage user roles and permissions
        </p>
        <p className="text-sm text-gray-500">
          Logged in as: {user?.username} ({user?.role})
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span className="text-lg font-semibold">User Management</span>
          </div>
          <p className="text-gray-600 mt-1">
            View and manage user roles and balances in the system
          </p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.length > 0 ? (
                users.map((userItem) => (
                  <div
                    key={userItem._id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="flex items-center space-x-2">
                        {userItem.role === 'admin' ? (
                          <Shield className="h-5 w-5 text-blue-500" />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium">{userItem.username}</p>
                          <p className="text-sm text-gray-600">
                            {userItem.email}
                          </p>
                          {(userItem.firstName || userItem.lastName) && (
                            <p className="text-sm text-gray-500">
                              {`${userItem.firstName || ''} ${userItem.lastName || ''}`.trim()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userItem.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userItem.role.toUpperCase()}
                        </span>
                        
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <Wallet className="w-3 h-3" />
                          <span>{formatPrice(userItem.balance || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      {/* Role Management */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Role:</label>
                        <select
                          value={userItem.role}
                          onChange={(e) => updateUserRole(userItem._id, e.target.value)}
                          disabled={updating === userItem._id || userItem._id === user.id}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {/* Balance Management */}
                      <div className="flex items-center space-x-2">
                        {editingBalance === userItem._id ? (
                          <div className="flex items-center space-x-1">
                            <select
                              value={balanceAction}
                              onChange={(e) => setBalanceAction(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="set">Set to</option>
                              <option value="add">Add</option>
                              <option value="subtract">Subtract</option>
                            </select>
                            
                            <input
                              type="number"
                              value={balanceAmount}
                              onChange={(e) => setBalanceAmount(e.target.value)}
                              placeholder="Amount"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                            />
                            
                            <button
                              onClick={() => updateUserBalance(userItem._id)}
                              disabled={updating === userItem._id}
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={cancelEditingBalance}
                              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingBalance(userItem._id, userItem.balance || 0)}
                            className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Edit Balance</span>
                          </button>
                        )}
                      </div>
                      
                      {updating === userItem._id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search criteria or check if the API is working properly.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6 pt-6 border-t">
              <button
                onClick={() => fetchUsers(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.current} of {pagination.pages} ({pagination.total} total)
              </span>
              
              <button
                onClick={() => fetchUsers(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Debug Information</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>User: {JSON.stringify(user)}</p>
          <p>Users count: {users.length}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

