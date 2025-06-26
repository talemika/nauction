import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { usersAPI, auctionsAPI, bidsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Gavel, 
  DollarSign, 
  TrendingUp,
  Settings,
  Shield,
  Plus,
  BarChart3,
  Activity,
  UserCheck,
  UserX,
  Crown,
  Loader2
} from 'lucide-react';

// Components for different admin sections
import UserManagement from '../components/admin/UserManagement';
import AuctionManagement from '../components/admin/AuctionManagement';
import SystemSettings from '../components/admin/SystemSettings';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const location = useLocation();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAuctions: 0,
    activeAuctions: 0,
    totalRevenue: 0,
    totalBids: 0,
    pendingPayments: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user stats
      const userStatsResponse = await usersAPI.getUserStats();
      const userStats = userStatsResponse.data;

      // Fetch auction stats
      const auctionResponse = await auctionsAPI.getAuctions({ limit: 1 });
      const auctionStats = auctionResponse.data;

      // Fetch bidding stats
      const biddingStatsResponse = await bidsAPI.getBiddingStats();
      const biddingStats = biddingStatsResponse.data;

      setStats({
        totalUsers: userStats.totalUsers || 0,
        activeUsers: userStats.activeUsers || 0,
        totalAuctions: auctionStats.total || 0,
        activeAuctions: auctionStats.active || 0,
        totalRevenue: biddingStats.totalRevenue || 0,
        totalBids: biddingStats.totalBids || 0,
        pendingPayments: biddingStats.pendingPayments || 0,
        recentActivity: userStats.recentActivity || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const DashboardOverview = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Auctions</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAuctions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAuctions} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue, 'NGN')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <p className="text-xs text-muted-foreground">
              Across all auctions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => window.location.href = '/admin/auctions/create'}
            >
              <Plus className="h-6 w-6" />
              <span>Create Auction</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <UserCheck className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activity to display
              </p>
            ) : (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
            <CardDescription>
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="default" className="text-xs mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {new Date(user?.lastLogin || user?.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account Balance</p>
                    <p className="font-medium">
                      {formatCurrency(user?.balance || 0, 'NGN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage auctions, users, and system settings
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="auctions">
          <AuctionManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

