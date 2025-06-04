<?php
/**
 * Check if user is logged in
 * 
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current user ID
 * 
 * @return int|null User ID or null if not logged in
 */
function getCurrentUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * Get current user role
 * 
 * @return string|null User role or null if not logged in
 */
function getCurrentUserRole() {
    return isset($_SESSION['user_role']) ? $_SESSION['user_role'] : null;
}

/**
 * Get current user data
 * 
 * @return array|null User data or null if not logged in
 */
function getCurrentUser() {
    $userId = getCurrentUserId();
    
    if (!$userId) {
        return null;
    }
    
    $sql = "SELECT * FROM users WHERE id = :id";
    return getSingleRecord($sql, ['id' => $userId]);
}

/**
 * Check if current user has specific role
 * 
 * @param string|array $roles Role(s) to check
 * @return bool
 */
function hasRole($roles) {
    $currentRole = getCurrentUserRole();
    
    if (!$currentRole) {
        return false;
    }
    
    if (is_array($roles)) {
        return in_array($currentRole, $roles);
    }
    
    return $currentRole === $roles;
}

/**
 * Check if current user has permission to access a feature
 * 
 * @param string $permission Permission to check
 * @return bool
 */
function hasPermission($permission) {
    $userId = getCurrentUserId();
    
    if (!$userId) {
        return false;
    }
    
    // Admin has all permissions
    if (getCurrentUserRole() === 'admin') {
        return true;
    }
    
    $sql = "SELECT p.name FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = :user_id AND p.name = :permission";
    
    $result = getSingleRecord($sql, [
        'user_id' => $userId,
        'permission' => $permission
    ]);
    
    return $result !== false;
}

/**
 * Login user
 * 
 * @param string $email User email
 * @param string $password User password
 * @return bool|array False on failure, user data on success
 */
function loginUser($email, $password) {
    $sql = "SELECT * FROM users WHERE email = :email AND active = 1";
    $user = getSingleRecord($sql, ['email' => $email]);
    
    if (!$user) {
        return false;
    }
    
    if (password_verify($password, $user['password'])) {
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        
        // Update last login time
        $updateData = [
            'last_login' => date('Y-m-d H:i:s')
        ];
        
        update('users', $updateData, 'id = :id', ['id' => $user['id']]);
        
        return $user;
    }
    
    return false;
}

/**
 * Logout user
 * 
 * @return void
 */
function logoutUser() {
    // Unset all session variables
    $_SESSION = [];
    
    // Destroy the session
    session_destroy();
}

/**
 * Register new user
 * 
 * @param array $userData User data
 * @return int|bool User ID on success, false on failure
 */
function registerUser($userData) {
    // Check if email already exists
    $sql = "SELECT id FROM users WHERE email = :email";
    $existingUser = getSingleRecord($sql, ['email' => $userData['email']]);
    
    if ($existingUser) {
        return false;
    }
    
    // Hash password
    $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
    
    // Set defaults
    $userData['created_at'] = date('Y-m-d H:i:s');
    $userData['active'] = 1;
    
    return insert('users', $userData);
}
?>