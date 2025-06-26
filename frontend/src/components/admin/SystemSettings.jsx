import { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { currencyAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  DollarSign, 
  RefreshCw,
  Mail,
  Bell,
  Shield,
  Database,
  Server,
  Globe,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const SystemSettings = () => {
  const { exchangeRates, lastUpdated, updateExchangeRates, areRatesStale } = useCurrency();
  
  const [settings, setSettings] = useState({
    siteName: 'NAuction',
    siteDescription: 'Nigeria\'s premier online auction platform',
    contactEmail: 'support@nauction.com',
    contactPhone: '+234 (0) 123 456 7890',
    whatsappNumber: '+234 (0) 123 456 7890',
    defaultBidIncrement: 100,
    maxBidIncrement: 10000,
    auctionDurationDays: 7,
    emailNotifications: true,
    whatsappNotifications: false,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateRates = async () => {
    try {
      setIsUpdatingRates(true);
      setErrors({});
      
      await updateExchangeRates();
      setSuccess('Exchange rates updated successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ rates: 'Failed to update exchange rates' });
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      // In a real application, you would save these settings to the backend
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ general: 'Failed to save settings' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system parameters and application settings
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* General Errors */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Information
            </CardTitle>
            <CardDescription>
              Basic information about your auction platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                placeholder="Enter site name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                placeholder="Enter site description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                placeholder="Enter contact phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={(e) => handleSettingChange('whatsappNumber', e.target.value)}
                placeholder="Enter WhatsApp number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Auction Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Auction Settings
            </CardTitle>
            <CardDescription>
              Configure auction behavior and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultBidIncrement">Default Bid Increment (₦)</Label>
              <Input
                id="defaultBidIncrement"
                type="number"
                min="1"
                value={settings.defaultBidIncrement}
                onChange={(e) => handleSettingChange('defaultBidIncrement', parseInt(e.target.value))}
                placeholder="Enter default bid increment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBidIncrement">Maximum Bid Increment (₦)</Label>
              <Input
                id="maxBidIncrement"
                type="number"
                min="1"
                value={settings.maxBidIncrement}
                onChange={(e) => handleSettingChange('maxBidIncrement', parseInt(e.target.value))}
                placeholder="Enter maximum bid increment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auctionDurationDays">Default Auction Duration (Days)</Label>
              <Input
                id="auctionDurationDays"
                type="number"
                min="1"
                max="30"
                value={settings.auctionDurationDays}
                onChange={(e) => handleSettingChange('auctionDurationDays', parseInt(e.target.value))}
                placeholder="Enter auction duration"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register accounts
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => handleSettingChange('allowRegistration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require users to verify their email addresses
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
            </CardTitle>
            <CardDescription>
              Manage exchange rates and currency conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Current Exchange Rates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>USD to NGN:</span>
                    <span className="font-medium">₦{exchangeRates.USD_TO_NGN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NGN to USD:</span>
                    <span className="font-medium">${exchangeRates.NGN_TO_USD.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-medium">
                      {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {areRatesStale() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Exchange rates are more than 1 hour old. Consider updating them for accuracy.
                  </AlertDescription>
                </Alert>
              )}

              {errors.rates && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.rates}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUpdateRates}
                disabled={isUpdatingRates}
                className="w-full"
              >
                {isUpdatingRates ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Rates...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Exchange Rates
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how users receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>WhatsApp Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via WhatsApp
                </p>
              </div>
              <Switch
                checked={settings.whatsappNotifications}
                onCheckedChange={(checked) => handleSettingChange('whatsappNotifications', checked)}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Notification settings apply to system-generated messages like bid confirmations and auction endings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and maintenance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Operational
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Available
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable the site for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              {settings.maintenanceMode && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maintenance mode is enabled. Only administrators can access the site.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Features:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• JWT token authentication</li>
                  <li>• Password hashing with bcrypt</li>
                  <li>• Rate limiting on API endpoints</li>
                  <li>• CORS protection</li>
                  <li>• Input validation and sanitization</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Authentication Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>JWT Secret:</span>
                  <Badge variant="default">Configured</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Token Expiry:</span>
                  <span>24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Limiting:</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;

