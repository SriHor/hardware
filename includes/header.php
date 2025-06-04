<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hardware Service Management System</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#EEF2FF',
                            100: '#E0E7FF',
                            200: '#C7D2FE',
                            300: '#A5B4FC',
                            400: '#818CF8',
                            500: '#6366F1',
                            600: '#4F46E5',
                            700: '#1E3A8A', // Main primary color
                            800: '#3730A3',
                            900: '#312E81',
                        },
                        secondary: {
                            50: '#ECFEFF',
                            100: '#CFFAFE',
                            200: '#A5F3FC',
                            300: '#67E8F9',
                            400: '#22D3EE',
                            500: '#0D9488', // Main secondary color
                            600: '#0891B2',
                            700: '#0E7490',
                            800: '#155E75',
                            900: '#164E63',
                        },
                        accent: {
                            50: '#FFF7ED',
                            100: '#FFEDD5',
                            200: '#FED7AA',
                            300: '#FDBA74',
                            400: '#FB923C',
                            500: '#F97316', // Main accent color
                            600: '#EA580C',
                            700: '#C2410C',
                            800: '#9A3412',
                            900: '#7C2D12',
                        },
                    }
                }
            }
        }
    </script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom CSS -->
    <style>
        .sidebar-item.active {
            background-color: rgba(255, 255, 255, 0.1);
            border-left: 3px solid #F97316;
        }
        
        .transition-all {
            transition: all 0.3s ease;
        }
        
        .nav-item:hover .dropdown-menu {
            display: block;
        }
        
        .mobile-menu-button:focus + .mobile-menu {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
        }
    </style>
</head>
<body class="bg-gray-100 font-sans">
    <?php if (isLoggedIn()): ?>
    <!-- Main Layout with Sidebar -->
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="hidden md:flex md:flex-shrink-0">
            <div class="flex flex-col w-64 bg-primary-700 text-white">
                <div class="flex items-center justify-center h-16 px-4 bg-primary-800">
                    <span class="text-xl font-semibold">HardwareServ</span>
                </div>
                <div class="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
                    <nav class="flex-1 space-y-2">
                        <?php $currentPage = getCurrentPage(); ?>
                        <?php $allowedPages = getAllowedPages(getCurrentUserRole()); ?>
                        
                        <?php if (in_array('dashboard', $allowedPages)): ?>
                        <a href="index.php?page=dashboard" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">
                            <i class="fas fa-tachometer-alt mr-3"></i>
                            <span>Dashboard</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('clients', $allowedPages)): ?>
                        <a href="index.php?page=clients" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'clients' ? 'active' : ''; ?>">
                            <i class="fas fa-building mr-3"></i>
                            <span>Clients</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('service-calls', $allowedPages)): ?>
                        <a href="index.php?page=service-calls" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'service-calls' ? 'active' : ''; ?>">
                            <i class="fas fa-headset mr-3"></i>
                            <span>Service Calls</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('staff', $allowedPages)): ?>
                        <a href="index.php?page=staff" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'staff' ? 'active' : ''; ?>">
                            <i class="fas fa-users mr-3"></i>
                            <span>Staff</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('inventory', $allowedPages)): ?>
                        <a href="index.php?page=inventory" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'inventory' ? 'active' : ''; ?>">
                            <i class="fas fa-boxes mr-3"></i>
                            <span>Inventory</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('telecalling', $allowedPages)): ?>
                        <a href="index.php?page=telecalling" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'telecalling' ? 'active' : ''; ?>">
                            <i class="fas fa-phone-alt mr-3"></i>
                            <span>Telecalling</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('reports', $allowedPages)): ?>
                        <a href="index.php?page=reports" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'reports' ? 'active' : ''; ?>">
                            <i class="fas fa-chart-bar mr-3"></i>
                            <span>Reports</span>
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('settings', $allowedPages)): ?>
                        <a href="index.php?page=settings" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'settings' ? 'active' : ''; ?>">
                            <i class="fas fa-cog mr-3"></i>
                            <span>Settings</span>
                        </a>
                        <?php endif; ?>
                    </nav>
                    
                    <div class="mt-auto pt-4 border-t border-primary-600">
                        <a href="index.php?page=profile" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all <?php echo $currentPage === 'profile' ? 'active' : ''; ?>">
                            <i class="fas fa-user-circle mr-3"></i>
                            <span>Profile</span>
                        </a>
                        <a href="logout.php" class="sidebar-item flex items-center px-4 py-2 text-sm rounded-md hover:bg-primary-600 transition-all">
                            <i class="fas fa-sign-out-alt mr-3"></i>
                            <span>Logout</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex flex-col flex-1 overflow-hidden">
            <!-- Top Navigation -->
            <header class="bg-white shadow">
                <div class="flex items-center justify-between h-16 px-4">
                    <!-- Mobile menu button -->
                    <div class="flex md:hidden">
                        <button id="mobile-menu-button" class="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                    
                    <!-- Page title -->
                    <h1 class="text-xl font-semibold text-gray-800">
                        <?php
                        $pageTitles = [
                            'dashboard' => 'Dashboard',
                            'clients' => 'Client Management',
                            'service-calls' => 'Service Calls',
                            'staff' => 'Staff Management',
                            'inventory' => 'Inventory',
                            'telecalling' => 'Telecalling',
                            'reports' => 'Reports & Analytics',
                            'settings' => 'Settings',
                            'profile' => 'Your Profile'
                        ];
                        
                        echo isset($pageTitles[$currentPage]) ? $pageTitles[$currentPage] : 'Dashboard';
                        ?>
                    </h1>
                    
                    <!-- User dropdown -->
                    <div class="ml-3 relative">
                        <div class="nav-item">
                            <button class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span class="mr-2 text-gray-700"><?php echo $_SESSION['user_name']; ?></span>
                                <div class="h-8 w-8 rounded-full bg-primary-700 text-white flex items-center justify-center">
                                    <?php echo strtoupper(substr($_SESSION['user_name'], 0, 1)); ?>
                                </div>
                            </button>
                            
                            <div class="dropdown-menu hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-fadeIn">
                                <div class="py-1">
                                    <a href="index.php?page=profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                                    <a href="logout.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Menu (hidden by default) -->
                <div id="mobile-menu" class="mobile-menu hidden md:hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
                        <?php $currentPage = getCurrentPage(); ?>
                        <?php $allowedPages = getAllowedPages(getCurrentUserRole()); ?>
                        
                        <?php if (in_array('dashboard', $allowedPages)): ?>
                        <a href="index.php?page=dashboard" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-gray-100 <?php echo $currentPage === 'dashboard' ? 'bg-gray-200' : ''; ?>">
                            <i class="fas fa-tachometer-alt mr-2"></i> Dashboard
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('clients', $allowedPages)): ?>
                        <a href="index.php?page=clients" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-gray-100 <?php echo $currentPage === 'clients' ? 'bg-gray-200' : ''; ?>">
                            <i class="fas fa-building mr-2"></i> Clients
                        </a>
                        <?php endif; ?>
                        
                        <?php if (in_array('service-calls', $allowedPages)): ?>
                        <a href="index.php?page=service-calls" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-gray-100 <?php echo $currentPage === 'service-calls' ? 'bg-gray-200' : ''; ?>">
                            <i class="fas fa-headset mr-2"></i> Service Calls
                        </a>
                        <?php endif; ?>
                        
                        <!-- More mobile menu items following the same pattern -->
                    </div>
                </div>
            </header>
            
            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto p-4 bg-gray-100">
                <!-- Alerts from session -->
                <?php if (isset($_SESSION['alert'])): ?>
                    <?php echo getAlert($_SESSION['alert']['message'], $_SESSION['alert']['type']); ?>
                    <?php unset($_SESSION['alert']); ?>
                <?php endif; ?>
                
                <!-- Page content will be included here -->
    <?php else: ?>
    <!-- Login Layout -->
    <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div class="text-center">
                <h2 class="text-3xl font-extrabold text-gray-900">HardwareServ</h2>
                <p class="mt-2 text-sm text-gray-600">Hardware Service Management System</p>
            </div>
            
            <!-- Alerts from session -->
            <?php if (isset($_SESSION['alert'])): ?>
                <?php echo getAlert($_SESSION['alert']['message'], $_SESSION['alert']['type']); ?>
                <?php unset($_SESSION['alert']); ?>
            <?php endif; ?>
            
            <!-- Login/Register content will be included here -->
    <?php endif; ?>