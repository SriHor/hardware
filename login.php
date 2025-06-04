<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';

// Process login form
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitize($_POST['email']);
    $password = $_POST['password'];
    
    if (empty($email) || empty($password)) {
        $error = 'Email and password are required';
    } else {
        $user = loginUser($email, $password);
        
        if ($user) {
            header('Location: index.php');
            exit;
        } else {
            $error = 'Invalid email or password';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Hardware Service Management System</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            700: '#1E3A8A',
                        },
                        secondary: {
                            500: '#0D9488',
                        },
                        accent: {
                            500: '#F97316',
                        },
                    }
                }
            }
        }
    </script>
    <style>
        .bg-gradient {
            background: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
        }
    </style>
</head>
<body class="bg-gray-100 h-screen">
    <div class="flex h-full">
        <!-- Left side with background image -->
        <div class="hidden lg:block lg:w-1/2 bg-gradient relative">
            <div class="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
                <h1 class="text-4xl font-bold mb-6">HardwareServ</h1>
                <p class="text-xl mb-8 text-center">Complete Hardware Service Management Solution</p>
                <div class="space-y-4 w-full max-w-md">
                    <div class="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm animate-fadeIn" style="animation-delay: 0.1s">
                        <h3 class="font-semibold mb-2">Client Management</h3>
                        <p class="text-sm">Track all your clients and their service history in one place</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm animate-fadeIn" style="animation-delay: 0.2s">
                        <h3 class="font-semibold mb-2">Service Call Tracking</h3>
                        <p class="text-sm">Efficiently manage service requests and engineer assignments</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm animate-fadeIn" style="animation-delay: 0.3s">
                        <h3 class="font-semibold mb-2">Inventory Control</h3>
                        <p class="text-sm">Keep track of parts and equipment with detailed records</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Right side with login form -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md">
                <div class="text-center mb-10">
                    <h2 class="text-3xl font-bold text-gray-800">Welcome Back</h2>
                    <p class="mt-2 text-gray-600">Sign in to your account</p>
                </div>
                
                <?php if (!empty($error)): ?>
                <div class="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                    <?php echo $error; ?>
                </div>
                <?php endif; ?>
                
                <form method="POST" action="" class="space-y-6" data-validate="true">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" id="email" name="email" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700" placeholder="your@email.com">
                    </div>
                    
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <a href="forgot-password.php" class="text-sm text-primary-700 hover:underline">Forgot password?</a>
                        </div>
                        <input type="password" id="password" name="password" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700" placeholder="••••••••">
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="remember" name="remember" class="h-4 w-4 text-primary-700 border-gray-300 rounded focus:ring-primary-700">
                        <label for="remember" class="ml-2 block text-sm text-gray-700">Remember me</label>
                    </div>
                    
                    <div>
                        <button type="submit" class="w-full bg-primary-700 text-white py-2 px-4 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 transition-colors">
                            Sign In
                        </button>
                    </div>
                </form>
                
                <div class="mt-8 text-center">
                    <p class="text-sm text-gray-600">
                        Don't have an account? 
                        <a href="register.php" class="text-primary-700 hover:underline">Contact your administrator</a>
                    </p>
                </div>
                
                <div class="mt-10 pt-6 border-t border-gray-200 text-center text-gray-500 text-xs">
                    &copy; <?php echo date('Y'); ?> HardwareServ. All rights reserved.
                </div>
            </div>
        </div>
    </div>
</body>
</html>