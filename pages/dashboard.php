<?php
// Dashboard data queries
$userId = getCurrentUserId();
$userRole = getCurrentUserRole();

// Get stats based on role
$stats = [];

// For admin and manager: comprehensive dashboard
if (in_array($userRole, ['admin', 'manager'])) {
    // Total clients
    $sql = "SELECT COUNT(*) as count FROM clients";
    $result = getSingleRecord($sql);
    $stats['total_clients'] = $result['count'] ?? 0;
    
    // Active service calls
    $sql = "SELECT COUNT(*) as count FROM service_calls WHERE status != 'completed' AND status != 'cancelled'";
    $result = getSingleRecord($sql);
    $stats['active_calls'] = $result['count'] ?? 0;
    
    // Engineers on duty
    $sql = "SELECT COUNT(*) as count FROM users WHERE role = 'engineer' AND active = 1";
    $result = getSingleRecord($sql);
    $stats['engineers_on_duty'] = $result['count'] ?? 0;
    
    // Telecalling leads this month
    $firstDayMonth = date('Y-m-01');
    $sql = "SELECT COUNT(*) as count FROM telecalling_leads WHERE created_at >= :first_day";
    $result = getSingleRecord($sql, ['first_day' => $firstDayMonth]);
    $stats['new_leads'] = $result['count'] ?? 0;
    
    // Recent service calls
    $sql = "SELECT sc.*, c.company_name, u.name as engineer_name 
            FROM service_calls sc
            JOIN clients c ON sc.client_id = c.id
            LEFT JOIN users u ON sc.engineer_id = u.id
            ORDER BY sc.created_at DESC LIMIT 5";
    $recentCalls = getRecords($sql);
    
    // Engineer performance
    $sql = "SELECT u.name, COUNT(sc.id) as completed_calls
            FROM users u
            LEFT JOIN service_calls sc ON u.id = sc.engineer_id AND sc.status = 'completed'
            WHERE u.role = 'engineer'
            GROUP BY u.id
            ORDER BY completed_calls DESC
            LIMIT 5";
    $engineerPerformance = getRecords($sql);
}

// For engineer: specific dashboard
if ($userRole === 'engineer') {
    // Assigned calls
    $sql = "SELECT COUNT(*) as count FROM service_calls WHERE engineer_id = :engineer_id AND status = 'assigned'";
    $result = getSingleRecord($sql, ['engineer_id' => $userId]);
    $stats['assigned_calls'] = $result['count'] ?? 0;
    
    // In progress calls
    $sql = "SELECT COUNT(*) as count FROM service_calls WHERE engineer_id = :engineer_id AND status = 'in-progress'";
    $result = getSingleRecord($sql, ['engineer_id' => $userId]);
    $stats['in_progress_calls'] = $result['count'] ?? 0;
    
    // Completed calls this month
    $firstDayMonth = date('Y-m-01');
    $sql = "SELECT COUNT(*) as count FROM service_calls 
            WHERE engineer_id = :engineer_id AND status = 'completed' 
            AND completed_at >= :first_day";
    $result = getSingleRecord($sql, [
        'engineer_id' => $userId,
        'first_day' => $firstDayMonth
    ]);
    $stats['completed_calls'] = $result['count'] ?? 0;
    
    // Recent assigned calls
    $sql = "SELECT sc.*, c.company_name 
            FROM service_calls sc
            JOIN clients c ON sc.client_id = c.id
            WHERE sc.engineer_id = :engineer_id AND (sc.status = 'assigned' OR sc.status = 'in-progress')
            ORDER BY sc.created_at DESC LIMIT 5";
    $recentCalls = getRecords($sql, ['engineer_id' => $userId]);
}

// For telecaller: specific dashboard
if ($userRole === 'telecaller') {
    // Today's calls
    $today = date('Y-m-d');
    $sql = "SELECT COUNT(*) as count FROM telecalling_leads WHERE created_at >= :today AND created_by = :user_id";
    $result = getSingleRecord($sql, ['today' => $today, 'user_id' => $userId]);
    $stats['today_calls'] = $result['count'] ?? 0;
    
    // New leads this week
    $firstDayWeek = date('Y-m-d', strtotime('monday this week'));
    $sql = "SELECT COUNT(*) as count FROM telecalling_leads 
            WHERE created_at >= :first_day AND created_by = :user_id";
    $result = getSingleRecord($sql, [
        'first_day' => $firstDayWeek,
        'user_id' => $userId
    ]);
    $stats['week_leads'] = $result['count'] ?? 0;
    
    // Conversions this month
    $firstDayMonth = date('Y-m-01');
    $sql = "SELECT COUNT(*) as count FROM telecalling_leads 
            WHERE created_at >= :first_day AND created_by = :user_id AND status = 'converted'";
    $result = getSingleRecord($sql, [
        'first_day' => $firstDayMonth,
        'user_id' => $userId
    ]);
    $stats['conversions'] = $result['count'] ?? 0;
    
    // Recent leads
    $sql = "SELECT * FROM telecalling_leads 
            WHERE created_by = :user_id
            ORDER BY created_at DESC LIMIT 5";
    $recentLeads = getRecords($sql, ['user_id' => $userId]);
}

// For front office: specific dashboard
if ($userRole === 'frontoffice') {
    // Today's new calls
    $today = date('Y-m-d');
    $sql = "SELECT COUNT(*) as count FROM service_calls WHERE created_at >= :today";
    $result = getSingleRecord($sql, ['today' => $today]);
    $stats['today_new_calls'] = $result['count'] ?? 0;
    
    // Pending assignment
    $sql = "SELECT COUNT(*) as count FROM service_calls WHERE status = 'pending'";
    $result = getSingleRecord($sql);
    $stats['pending_assignment'] = $result['count'] ?? 0;
    
    // Recent service calls
    $sql = "SELECT sc.*, c.company_name, u.name as engineer_name 
            FROM service_calls sc
            JOIN clients c ON sc.client_id = c.id
            LEFT JOIN users u ON sc.engineer_id = u.id
            ORDER BY sc.created_at DESC LIMIT 10";
    $recentCalls = getRecords($sql);
}
?>

<div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-semibold text-gray-800">
            Welcome, <?php echo $_SESSION['user_name']; ?>
        </h2>
        <p class="text-gray-600 mt-1">
            <?php echo date('l, F j, Y'); ?> | 
            <?php 
            switch ($userRole) {
                case 'admin':
                    echo 'Administrator';
                    break;
                case 'manager':
                    echo 'Manager';
                    break;
                case 'engineer':
                    echo 'Hardware Engineer';
                    break;
                case 'telecaller':
                    echo 'Telecaller';
                    break;
                case 'frontoffice':
                    echo 'Front Office Executive';
                    break;
                default:
                    echo 'User';
            }
            ?>
        </p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <?php if (isset($stats['total_clients'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-primary-700">
            <div class="flex items-center">
                <div class="bg-primary-100 p-3 rounded-full">
                    <i class="fas fa-building text-primary-700"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Total Clients</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['total_clients']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['active_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-accent-500">
            <div class="flex items-center">
                <div class="bg-accent-100 p-3 rounded-full">
                    <i class="fas fa-headset text-accent-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Active Service Calls</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['active_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['engineers_on_duty'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-secondary-500">
            <div class="flex items-center">
                <div class="bg-secondary-100 p-3 rounded-full">
                    <i class="fas fa-user-cog text-secondary-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Engineers On Duty</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['engineers_on_duty']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['new_leads'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div class="flex items-center">
                <div class="bg-purple-100 p-3 rounded-full">
                    <i class="fas fa-phone-alt text-purple-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">New Leads This Month</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['new_leads']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['assigned_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div class="flex items-center">
                <div class="bg-blue-100 p-3 rounded-full">
                    <i class="fas fa-clipboard-list text-blue-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Assigned Calls</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['assigned_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['in_progress_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div class="flex items-center">
                <div class="bg-yellow-100 p-3 rounded-full">
                    <i class="fas fa-tools text-yellow-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">In Progress</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['in_progress_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['completed_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div class="flex items-center">
                <div class="bg-green-100 p-3 rounded-full">
                    <i class="fas fa-check-circle text-green-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Completed This Month</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['completed_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['today_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div class="flex items-center">
                <div class="bg-blue-100 p-3 rounded-full">
                    <i class="fas fa-phone-alt text-blue-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Today's Calls</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['today_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['week_leads'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <div class="flex items-center">
                <div class="bg-indigo-100 p-3 rounded-full">
                    <i class="fas fa-user-plus text-indigo-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">New Leads This Week</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['week_leads']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['conversions'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div class="flex items-center">
                <div class="bg-green-100 p-3 rounded-full">
                    <i class="fas fa-handshake text-green-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Conversions This Month</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['conversions']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['today_new_calls'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div class="flex items-center">
                <div class="bg-blue-100 p-3 rounded-full">
                    <i class="fas fa-headset text-blue-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Today's New Calls</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['today_new_calls']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($stats['pending_assignment'])): ?>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div class="flex items-center">
                <div class="bg-yellow-100 p-3 rounded-full">
                    <i class="fas fa-clock text-yellow-500"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-gray-500 text-sm">Pending Assignment</h3>
                    <p class="text-2xl font-semibold text-gray-800"><?php echo $stats['pending_assignment']; ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <?php if (isset($recentCalls) && in_array($userRole, ['admin', 'manager', 'engineer', 'frontoffice'])): ?>
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">Recent Service Calls</h3>
            </div>
            <div class="p-6">
                <?php if (empty($recentCalls)): ?>
                <p class="text-gray-500 text-center py-4">No recent service calls found.</p>
                <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($recentCalls as $call): ?>
                    <div class="flex items-start p-3 border-l-4 <?php echo getCallStatusColor($call['status']); ?> bg-gray-50 rounded-r">
                        <div class="flex-1">
                            <div class="flex justify-between">
                                <h4 class="font-semibold"><?php echo $call['company_name']; ?></h4>
                                <span class="text-xs"><?php echo formatDate($call['created_at'], 'd M Y'); ?></span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1"><?php echo $call['issue']; ?></p>
                            <div class="flex items-center justify-between mt-2">
                                <span class="text-xs font-medium">
                                    <?php if (!empty($call['engineer_name'])): ?>
                                    <i class="fas fa-user-cog text-gray-500 mr-1"></i> <?php echo $call['engineer_name']; ?>
                                    <?php else: ?>
                                    <i class="fas fa-user-cog text-gray-400 mr-1"></i> Not assigned
                                    <?php endif; ?>
                                </span>
                                <?php echo getStatusBadge($call['status'], 'call'); ?>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="mt-4 text-center">
                    <a href="index.php?page=service-calls" class="text-primary-700 text-sm hover:underline">View all service calls</a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($engineerPerformance) && in_array($userRole, ['admin', 'manager'])): ?>
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">Engineer Performance</h3>
            </div>
            <div class="p-6">
                <?php if (empty($engineerPerformance)): ?>
                <p class="text-gray-500 text-center py-4">No engineer performance data available.</p>
                <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($engineerPerformance as $engineer): ?>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span class="font-medium"><?php echo $engineer['name']; ?></span>
                        <div class="flex items-center">
                            <span class="text-sm mr-2"><?php echo $engineer['completed_calls']; ?> completed</span>
                            <div class="w-24 h-2 bg-gray-200 rounded-full">
                                <?php 
                                $percentage = min(100, ($engineer['completed_calls'] / 10) * 100);
                                $color = 'bg-green-500';
                                if ($percentage < 30) {
                                    $color = 'bg-red-500';
                                } elseif ($percentage < 70) {
                                    $color = 'bg-yellow-500';
                                }
                                ?>
                                <div class="h-full rounded-full <?php echo $color; ?>" style="width: <?php echo $percentage; ?>%"></div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="mt-4 text-center">
                    <a href="index.php?page=reports" class="text-primary-700 text-sm hover:underline">View detailed reports</a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if (isset($recentLeads) && $userRole === 'telecaller'): ?>
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">Recent Leads</h3>
            </div>
            <div class="p-6">
                <?php if (empty($recentLeads)): ?>
                <p class="text-gray-500 text-center py-4">No recent leads found.</p>
                <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($recentLeads as $lead): ?>
                    <div class="flex items-start p-3 border-l-4 <?php echo getLeadStatusColor($lead['status']); ?> bg-gray-50 rounded-r">
                        <div class="flex-1">
                            <div class="flex justify-between">
                                <h4 class="font-semibold"><?php echo $lead['company_name']; ?></h4>
                                <span class="text-xs"><?php echo formatDate($lead['created_at'], 'd M Y'); ?></span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1"><?php echo $lead['contact_person']; ?> - <?php echo $lead['contact_number']; ?></p>
                            <div class="flex items-center justify-between mt-2">
                                <span class="text-xs font-medium">
                                    <i class="fas fa-map-marker-alt text-gray-500 mr-1"></i> <?php echo $lead['location']; ?>
                                </span>
                                <?php echo getStatusBadge($lead['status'], 'lead'); ?>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="mt-4 text-center">
                    <a href="index.php?page=telecalling" class="text-primary-700 text-sm hover:underline">View all leads</a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php
// Helper functions
function getCallStatusColor($status) {
    $colors = [
        'pending' => 'border-yellow-500',
        'assigned' => 'border-blue-500',
        'in-progress' => 'border-indigo-500',
        'completed' => 'border-green-500',
        'cancelled' => 'border-red-500',
    ];
    
    return isset($colors[$status]) ? $colors[$status] : 'border-gray-500';
}

function getLeadStatusColor($status) {
    $colors = [
        'new' => 'border-blue-500',
        'follow-up' => 'border-purple-500',
        'converted' => 'border-green-500',
        'rejected' => 'border-red-500',
    ];
    
    return isset($colors[$status]) ? $colors[$status] : 'border-gray-500';
}
?>