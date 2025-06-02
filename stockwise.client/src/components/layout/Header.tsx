import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Button } from '../ui/button';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const userMenuRef = useClickOutside<HTMLDivElement>(() => {
    setShowUserMenu(false);
  });

  const mobileMenuRef = useClickOutside<HTMLDivElement>(() => {
    setShowMobileMenu(false);
  });

  const navItems = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleMobileNavClick = () => {
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">StockWise</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-3"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">
                  {user?.firstName || user?.username || 'User'}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </button>
                    
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    
                    <div className="border-t">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container py-2">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={handleMobileNavClick}
                      className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md ${
                        isActive(item.href)
                          ? 'text-primary bg-accent'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 