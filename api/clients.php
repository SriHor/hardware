<?php
session_start();
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Get client by ID
if (isset($_GET['id'])) {
    $clientId = (int)$_GET['id'];
    
    $sql = "SELECT * FROM clients WHERE id = :id";
    $client = getSingleRecord($sql, ['id' => $clientId]);
    
    if (!$client) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Client not found']);
        exit;
    }
    
    $response = ['client' => $client];
    
    // Include service history if requested
    if (isset($_GET['include']) && $_GET['include'] === 'service_history') {
        $sql = "SELECT sc.*, u.name as engineer_name 
                FROM service_calls sc
                LEFT JOIN users u ON sc.engineer_id = u.id
                WHERE sc.client_id = :client_id
                ORDER BY sc.created_at DESC
                LIMIT 5";
        
        $serviceHistory = getRecords($sql, ['client_id' => $clientId]);
        $response['service_history'] = $serviceHistory;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Get all clients (with pagination and filtering)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';

$offset = ($page - 1) * $perPage;
$params = [];

$sql = "SELECT * FROM clients";
$countSql = "SELECT COUNT(*) as total FROM clients";

if (!empty($search)) {
    $sql .= " WHERE company_name LIKE :search OR contact_person LIKE :search OR email LIKE :search OR phone LIKE :search";
    $countSql .= " WHERE company_name LIKE :search OR contact_person LIKE :search OR email LIKE :search OR phone LIKE :search";
    $params['search'] = "%$search%";
}

$sql .= " ORDER BY company_name LIMIT :offset, :per_page";
$params['offset'] = $offset;
$params['per_page'] = $perPage;

$clients = getRecords($sql, $params);
$countResult = getSingleRecord($countSql, array_diff_key($params, ['offset' => 1, 'per_page' => 1]));
$total = $countResult['total'];

header('Content-Type: application/json');
echo json_encode([
    'data' => $clients,
    'meta' => [
        'current_page' => $page,
        'per_page' => $perPage,
        'total' => (int)$total,
        'total_pages' => ceil($total / $perPage)
    ]
]);
exit;
?>