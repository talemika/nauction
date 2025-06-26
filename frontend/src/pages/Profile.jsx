import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Wallet, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Loader2,
  CreditCard,
  History
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const { formatCurrency, getDualCurrencyDisplay } = useCurrency();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zipCode: '',
    },
    notifications: {
      email: true,
      whatsapp: false,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          country: 'Nigeria',
          zipCode: '',
        },
        notifications: user.notifications || {
          email: true,
          whatsapp: false,
        },
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (profileData.phone && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      return;
    }

    const result = await updateProfile(profileData);
    
    if (result.success) {
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setErrors({ general: result.error });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    const result = await changePassword(passwordData);
    
    if (result.success) {
      setSuccess('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setErrors({ password: result.error });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const balanceDisplay = user ? getDualCurrencyDisplay(user.balance) : null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {errors.general && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        disabled={!isEditing || isLoading}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        disabled={!isEditing || isLoading}
                        className={errors.phone ? 'border-destructive' : ''}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address.street">Street Address</Label>
                      <Input
                        id="address.street"
                        name="address.street"
                        value={profileData.address.street}
                        onChange={handleProfileChange}
                        disabled={!isEditing || isLoading}
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address.city">City</Label>
                      <Input
                        id="address.city"
                        name="address.city"
                        value={profileData.address.city}
                        onChange={handleProfileChange}
                        disabled={!isEditing || isLoading}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address.state">State</Label>
                      <Input
                        id="address.state"
                        name="address.state"
                        value={profileData.address.state}
                        onChange={handleProfileChange}
                        disabled={!isEditing || isLoading}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Tab */}
        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Account Balance
              </CardTitle>
              <CardDescription>
                Your current balance and transaction information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Balance */}
              <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <div className="text-3xl font-bold">
                    {balanceDisplay?.ngn.formatted}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    ≈ {balanceDisplay?.usd.formatted}
                  </div>
                </div>
              </div>

              {/* Balance Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="font-medium">Bidding Power</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can bid up to {formatCurrency(user.balance * 5, 'NGN')} 
                      (5x your balance with 20% hold requirement)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="h-4 w-4 text-primary" />
                      <span className="font-medium">Account Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add Money Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Money to Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To add money to your account balance, please contact an administrator 
                      or transfer funds to our bank account and send proof of payment.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Contact Information:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>Email: support@nauction.com</li>
                        <li>Phone: +234 (0) 123 456 7890</li>
                        <li>WhatsApp: +234 (0) 123 456 7890</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Change your password and manage security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Last changed: {new Date(user.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {errors.password && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.password}</AlertDescription>
                    </Alert>
                  )}

                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                        disabled={isLoading}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-destructive">{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                        disabled={isLoading}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-destructive">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                        disabled={isLoading}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                        setErrors({});
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

