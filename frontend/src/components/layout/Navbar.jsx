import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Gavel, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  Search,
  DollarSign,
  Shield,
  Home,
  List,
  Info
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { displayCurrency, toggleDisplayCurrency, formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      <Link 
        to="/" 
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors`}
        onClick={onItemClick}
      >
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Home
        </div>
      </Link>
      <Link 
        to="/auctions" 
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors`}
        onClick={onItemClick}
      >
        <div className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Auctions
        </div>
      </Link>
      <Link 
        to="/bidding-info" 
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors`}
        onClick={onItemClick}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Bidding Info
        </div>
      </Link>
    </>
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Gavel className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">NAuction</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Currency Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDisplayCurrency}
              className="hidden sm:flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {displayCurrency}
            </Button>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auctions')}
              className="hidden sm:flex"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* User Balance (Desktop) */}
                {user && (
                  <div className="hidden lg:block text-sm text-muted-foreground">
                    Balance: {formatCurrency(user.balance, 'NGN')}
                  </div>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Balance: {formatCurrency(user?.balance || 0, 'NGN')}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Mobile Navigation Links */}
                  <div className="space-y-2">
                    <NavLinks mobile onItemClick={() => setIsOpen(false)} />
                  </div>

                  <div className="border-t pt-4">
                    {/* Currency Toggle Mobile */}
                    <Button
                      variant="ghost"
                      onClick={toggleDisplayCurrency}
                      className="w-full justify-start mb-2"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Currency: {displayCurrency}
                    </Button>

                    {/* Search Mobile */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/auctions');
                        setIsOpen(false);
                      }}
                      className="w-full justify-start mb-4"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Auctions
                    </Button>
                  </div>

                  {/* Mobile Authentication */}
                  {isAuthenticated ? (
                    <div className="border-t pt-4 space-y-2">
                      <div className="text-sm text-muted-foreground mb-4">
                        <p className="font-medium">{user?.name}</p>
                        <p>{user?.email}</p>
                        <p>Balance: {formatCurrency(user?.balance || 0, 'NGN')}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate('/profile');
                          setIsOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>

                      {isAdmin() && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate('/admin');
                            setIsOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="w-full justify-start text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate('/login');
                          setIsOpen(false);
                        }}
                        className="w-full"
                      >
                        Login
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/register');
                          setIsOpen(false);
                        }}
                        className="w-full"
                      >
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

