import { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { usersAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Crown,
  DollarSign,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User
} from 'lucide-react';

const UserManagement = () => {
  const { formatCurrency } = useCurrency();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    isActive: true,
  });
  
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    operation: 'add',
    reason: '',
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus, currentPage]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (selectedRole && selectedRole !== 'all') {
        params.role = selectedRole;
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        params.isActive = selectedStatus === 'active';
      }

      const response = await usersAPI.getUsers(params);
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditDialog(true);
    setErrors({});
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setErrors({});

      // Update user role
      if (editForm.role !== selectedUser.role) {
        await usersAPI.updateUserRole(selectedUser._id, editForm.role);
      }

      // Update user status
      if (editForm.isActive !== selectedUser.isActive) {
        await usersAPI.updateUserStatus(selectedUser._id, editForm.isActive);
      }

      setSuccess('User updated successfully');
      setShowEditDialog(false);
      await fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBalanceUpdate = (user) => {
    setSelectedUser(user);
    setBalanceForm({
      amount: '',
      operation: 'add',
      reason: '',
    });
    setShowBalanceDialog(true);
    setErrors({});
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(balanceForm.amount);
    if (!amount || amount <= 0) {
      setErrors({ balance: 'Please enter a valid positive amount' });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      await usersAPI.updateUserBalance(
        selectedUser._id, 
        amount, 
        balanceForm.operation
      );

      setSuccess(`Balance ${balanceForm.operation === 'add' ? 'added' : 'deducted'} successfully`);
      setShowBalanceDialog(false);
      await fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ balance: error.response?.data?.message || 'Failed to update balance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
    setErrors({});
  };

  const confirmDeleteUser = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      await usersAPI.deleteUser(selectedUser._id);

      setSuccess('User deleted successfully');
      setShowDeleteDialog(false);
      await fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ delete: error.response?.data?.message || 'Failed to delete user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
        </p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and balances
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({totalUsers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                          {user.role === 'admin' ? 'Administrator' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(user.balance || 0, 'NGN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBalanceUpdate(user)}
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and account status
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label>User Information</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select value={editForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setEditForm(prev => ({ ...prev, isActive: value === 'active' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Balance Update Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Balance</DialogTitle>
            <DialogDescription>
              Add or deduct money from user's account balance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBalance} className="space-y-4">
            {errors.balance && (
              <Alert variant="destructive">
                <AlertDescription>{errors.balance}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label>User Information</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Balance: {formatCurrency(selectedUser?.balance || 0, 'NGN')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Select value={balanceForm.operation} onValueChange={(value) => setBalanceForm(prev => ({ ...prev, operation: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Money</SelectItem>
                    <SelectItem value="deduct">Deduct Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for balance update"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `${balanceForm.operation === 'add' ? 'Add' : 'Deduct'} Money`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBalanceDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errors.delete && (
              <Alert variant="destructive">
                <AlertDescription>{errors.delete}</AlertDescription>
              </Alert>
            )}
            
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground">
                Deleting user: <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently remove all user data and cannot be reversed.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={confirmDeleteUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

