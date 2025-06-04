<?php
/**
 * Get current page from URL
 * 
 * @return string Current page name
 */
function getCurrentPage() {
    $page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
    return $page;
}

/**
 * Get allowed pages based on user role
 * 
 * @param string $role User role
 * @return array Allowed pages
 */
function getAllowedPages($role) {
    $commonPages = ['dashboard', 'profile', 'logout'];
    
    switch ($role) {
        case 'admin':
            return array_merge($commonPages, ['clients', 'staff', 'service-calls', 'inventory', 'telecalling', 'reports', 'settings']);
        case 'manager':
            return array_merge($commonPages, ['clients', 'staff', 'service-calls', 'inventory', 'telecalling', 'reports']);
        case 'engineer':
            return array_merge($commonPages, ['service-calls', 'inventory']);
        case 'telecaller':
            return array_merge($commonPages, ['clients', 'telecalling']);
        case 'frontoffice':
            return array_merge($commonPages, ['clients', 'service-calls']);
        default:
            return $commonPages;
    }
}

/**
 * Format date for display
 * 
 * @param string $dateString Date string
 * @param string $format Format string
 * @return string Formatted date
 */
function formatDate($dateString, $format = 'd M Y, h:i A') {
    $date = new DateTime($dateString);
    return $date->format($format);
}

/**
 * Get status badge HTML
 * 
 * @param string $status Status value
 * @param string $context Context (call, service, etc.)
 * @return string HTML for badge
 */
function getStatusBadge($status, $context = 'default') {
    $badgeClasses = [
        'pending' => 'bg-yellow-100 text-yellow-800',
        'assigned' => 'bg-blue-100 text-blue-800',
        'in-progress' => 'bg-indigo-100 text-indigo-800',
        'completed' => 'bg-green-100 text-green-800',
        'cancelled' => 'bg-red-100 text-red-800',
        'resolved' => 'bg-green-100 text-green-800',
        'unresolved' => 'bg-red-100 text-red-800',
        'lead' => 'bg-purple-100 text-purple-800',
        'follow-up' => 'bg-blue-100 text-blue-800',
        'converted' => 'bg-green-100 text-green-800',
        'rejected' => 'bg-gray-100 text-gray-800',
    ];
    
    $class = isset($badgeClasses[$status]) ? $badgeClasses[$status] : 'bg-gray-100 text-gray-800';
    
    return '<span class="px-2 py-1 text-xs rounded-full ' . $class . '">' . ucfirst($status) . '</span>';
}

/**
 * Generate pagination HTML
 * 
 * @param int $currentPage Current page number
 * @param int $totalPages Total number of pages
 * @param string $baseUrl Base URL for pagination links
 * @return string Pagination HTML
 */
function generatePagination($currentPage, $totalPages, $baseUrl) {
    if ($totalPages <= 1) {
        return '';
    }
    
    $html = '<div class="flex items-center justify-between mt-4">';
    $html .= '<div class="flex items-center space-x-2">';
    
    // Previous button
    if ($currentPage > 1) {
        $html .= '<a href="' . $baseUrl . '&page=' . ($currentPage - 1) . '" class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100">Previous</a>';
    } else {
        $html .= '<span class="px-3 py-1 rounded border border-gray-300 text-gray-400 cursor-not-allowed">Previous</span>';
    }
    
    // Page numbers
    $startPage = max(1, $currentPage - 2);
    $endPage = min($totalPages, $currentPage + 2);
    
    if ($startPage > 1) {
        $html .= '<a href="' . $baseUrl . '&page=1" class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100">1</a>';
        if ($startPage > 2) {
            $html .= '<span class="px-2">...</span>';
        }
    }
    
    for ($i = $startPage; $i <= $endPage; $i++) {
        if ($i == $currentPage) {
            $html .= '<span class="px-3 py-1 rounded border border-blue-500 bg-blue-500 text-white">' . $i . '</span>';
        } else {
            $html .= '<a href="' . $baseUrl . '&page=' . $i . '" class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100">' . $i . '</a>';
        }
    }
    
    if ($endPage < $totalPages) {
        if ($endPage < $totalPages - 1) {
            $html .= '<span class="px-2">...</span>';
        }
        $html .= '<a href="' . $baseUrl . '&page=' . $totalPages . '" class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100">' . $totalPages . '</a>';
    }
    
    // Next button
    if ($currentPage < $totalPages) {
        $html .= '<a href="' . $baseUrl . '&page=' . ($currentPage + 1) . '" class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100">Next</a>';
    } else {
        $html .= '<span class="px-3 py-1 rounded border border-gray-300 text-gray-400 cursor-not-allowed">Next</span>';
    }
    
    $html .= '</div>';
    $html .= '</div>';
    
    return $html;
}

/**
 * Generate alert HTML
 * 
 * @param string $message Alert message
 * @param string $type Alert type (success, error, warning, info)
 * @return string Alert HTML
 */
function getAlert($message, $type = 'info') {
    $alertClasses = [
        'success' => 'bg-green-100 text-green-800 border-green-200',
        'error' => 'bg-red-100 text-red-800 border-red-200',
        'warning' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'info' => 'bg-blue-100 text-blue-800 border-blue-200',
    ];
    
    $class = isset($alertClasses[$type]) ? $alertClasses[$type] : $alertClasses['info'];
    
    return '<div class="p-4 mb-4 rounded border ' . $class . '" role="alert">' . $message . '</div>';
}

/**
 * Sanitize input data
 * 
 * @param string $data Input data
 * @return string Sanitized data
 */
function sanitize($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>