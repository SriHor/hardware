import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Headphones, 
  UserCog, 
  Package, 
  Phone, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  FileText,
  Bell,
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Agreements', href: '/agreements', icon: FileText },
    { name: 'Service Calls', href: '/service-calls', icon: Headphones },
    { name: 'Staff', href: '/staff', icon: UserCog },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Telecalling', href: '/telecalling', icon: Phone },
    { name: 'Reminders', href: '/reminders', icon: Bell },
    { name: 'Accounting', href: '/accounting', icon: Calculator },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-sky-800 to-sky-900 shadow-xl">
          <div className="flex flex-shrink-0 items-center justify-center h-16 px-4 bg-sky-900 border-b border-sky-700">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Horizon Solutions</h1>
                <p className="text-xs text-sky-300">Management System</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      active
                        ? 'bg-orange-500 text-white border-r-4 border-orange-300 shadow-lg'
                        : 'text-sky-300 hover:bg-sky-700 hover:text-white'
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-l-lg transition-all duration-200 ease-in-out`}
                  >
                    <Icon className={`${
                      active ? 'text-white' : 'text-sky-400 group-hover:text-sky-200'
                    } mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200`} />
                    <span className="transition-colors duration-200">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 bg-sky-900 p-4 border-t border-sky-700">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email || 'User'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-sky-300 hover:text-white flex items-center mt-1 transition-colors duration-200"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-40 bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-sky-700" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Horizon Solutions</h1>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-sky-800 pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex flex-shrink-0 items-center px-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Horizon Solutions</h1>
                    <p className="text-xs text-sky-300">Management System</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="space-y-1 px-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          active
                            ? 'bg-orange-500 text-white'
                            : 'text-sky-300 hover:bg-sky-700 hover:text-white'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};