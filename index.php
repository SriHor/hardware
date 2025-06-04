<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

// Default to login page if not logged in
if (!isLoggedIn() && !in_array(getCurrentPage(), ['login', 'register', 'forgot-password'])) {
    header('Location: login.php');
    exit;
}

// Router
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
$allowedPages = getAllowedPages(getCurrentUserRole());

if (!in_array($page, $allowedPages)) {
    $page = 'dashboard'; // Default to dashboard if page not allowed
}

// Include header
include 'includes/header.php';

// Include the appropriate page
switch ($page) {
    case 'dashboard':
        include 'pages/dashboard.php';
        break;
    case 'clients':
        include 'pages/clients.php';
        break;
    case 'staff':
        include 'pages/staff.php';
        break;
    case 'service-calls':
        include 'pages/service-calls.php';
        break;
    case 'inventory':
        include 'pages/inventory.php';
        break;
    case 'telecalling':
        include 'pages/telecalling.php';
        break;
    case 'reports':
        include 'pages/reports.php';
        break;
    case 'profile':
        include 'pages/profile.php';
        break;
    case 'settings':
        include 'pages/settings.php';
        break;
    default:
        include 'pages/dashboard.php';
        break;
}

// Include footer
include 'includes/footer.php';
?>