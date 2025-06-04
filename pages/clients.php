<?php
// Check if user has permission to access this page
if (!hasPermission('view_clients') && !in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice', 'telecaller'])) {
    $_SESSION['alert'] = [
        'type' => 'error',
        'message' => 'You do not have permission to access this page.'
    ];
    header('Location: index.php');
    exit;
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        // Add new client
        if ($_POST['action'] === 'add' && (hasPermission('add_clients') || in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice']))) {
            $clientData = [
                'company_name' => sanitize($_POST['company_name']),
                'contact_person' => sanitize($_POST['contact_person']),
                'email' => sanitize($_POST['email']),
                'phone' => sanitize($_POST['phone']),
                'address' => sanitize($_POST['address']),
                'city' => sanitize($_POST['city']),
                'created_by' => getCurrentUserId(),
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $clientId = insert('clients', $clientData);
            
            if ($clientId) {
                $_SESSION['alert'] = [
                    'type' => 'success',
                    'message' => 'Client added successfully.'
                ];
            } else {
                $_SESSION['alert'] = [
                    'type' => 'error',
                    'message' => 'Failed to add client.'
                ];
            }
            
            header('Location: index.php?page=clients');
            exit;
        }
        
        // Update client
        if ($_POST['action'] === 'update' && (hasPermission('edit_clients') || in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice']))) {
            $clientId = $_POST['client_id'];
            
            $clientData = [
                'company_name' => sanitize($_POST['company_name']),
                'contact_person' => sanitize($_POST['contact_person']),
                'email' => sanitize($_POST['email']),
                'phone' => sanitize($_POST['phone']),
                'address' => sanitize($_POST['address']),
                'city' => sanitize($_POST['city']),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $updated = update('clients', $clientData, 'id = :id', ['id' => $clientId]);
            
            if ($updated) {
                $_SESSION['alert'] = [
                    'type' => 'success',
                    'message' => 'Client updated successfully.'
                ];
            } else {
                $_SESSION['alert'] = [
                    'type' => 'error',
                    'message' => 'Failed to update client.'
                ];
            }
            
            header('Location: index.php?page=clients');
            exit;
        }
        
        // Delete client
        if ($_POST['action'] === 'delete' && (hasPermission('delete_clients') || in_array(getCurrentUserRole(), ['admin', 'manager']))) {
            $clientId = $_POST['client_id'];
            
            // Check if client has associated service calls
            $sql = "SELECT COUNT(*) as count FROM service_calls WHERE client_id = :client_id";
            $result = getSingleRecord($sql, ['client_id' => $clientId]);
            
            if ($result['count'] > 0) {
                $_SESSION['alert'] = [
                    'type' => 'error',
                    'message' => 'Cannot delete client with associated service calls.'
                ];
            } else {
                $deleted = delete('clients', 'id = :id', ['id' => $clientId]);
                
                if ($deleted) {
                    $_SESSION['alert'] = [
                        'type' => 'success',
                        'message' => 'Client deleted successfully.'
                    ];
                } else {
                    $_SESSION['alert'] = [
                        'type' => 'error',
                        'message' => 'Failed to delete client.'
                    ];
                }
            }
            
            header('Location: index.php?page=clients');
            exit;
        }
    }
}

// Search functionality
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';
$searchCondition = '';
$searchParams = [];

if (!empty($search)) {
    $searchCondition = "WHERE company_name LIKE :search OR contact_person LIKE :search OR email LIKE :search OR phone LIKE :search OR city LIKE :search";
    $searchParams['search'] = "%$search%";
}

// Pagination
$page = isset($_GET['page_num']) ? (int)$_GET['page_num'] : 1;
$perPage = 10;
$offset = ($page - 1) * $perPage;

// Get total number of clients
$countSql = "SELECT COUNT(*) as total FROM clients $searchCondition";
$countResult = getSingleRecord($countSql, $searchParams);
$totalClients = $countResult['total'];
$totalPages = ceil($totalClients / $perPage);

// Get clients for current page
$sql = "SELECT * FROM clients $searchCondition ORDER BY company_name LIMIT :offset, :per_page";
$params = array_merge($searchParams, ['offset' => $offset, 'per_page' => $perPage]);
$clients = getRecords($sql, $params);
?>

<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Client Management</h2>
            <p class="mt-1 text-gray-600">Manage all your client information in one place</p>
        </div>
        
        <!-- Add Client Button -->
        <?php if (hasPermission('add_clients') || in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice'])): ?>
        <div class="mt-4 md:mt-0">
            <button type="button" onclick="openAddClientModal()" class="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md flex items-center">
                <i class="fas fa-plus mr-2"></i> Add New Client
            </button>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow p-4">
        <form action="index.php" method="GET" class="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <input type="hidden" name="page" value="clients">
            
            <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search Clients</label>
                <input type="text" id="search" name="search" value="<?php echo $search; ?>" placeholder="Search by name, contact, email..." class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
            </div>
            
            <div class="flex space-x-2">
                <button type="submit" class="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md">
                    <i class="fas fa-search mr-2"></i> Search
                </button>
                
                <?php if (!empty($search)): ?>
                <a href="index.php?page=clients" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
                    <i class="fas fa-times mr-2"></i> Clear
                </a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    
    <!-- Clients Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <?php if (empty($clients)): ?>
        <div class="p-8 text-center">
            <i class="fas fa-building text-gray-300 text-5xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-800 mb-2">No Clients Found</h3>
            <p class="text-gray-600 mb-4">
                <?php if (!empty($search)): ?>
                    No clients match your search criteria.
                <?php else: ?>
                    You haven't added any clients yet.
                <?php endif; ?>
            </p>
            <?php if (hasPermission('add_clients') || in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice'])): ?>
            <button type="button" onclick="openAddClientModal()" class="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md">
                <i class="fas fa-plus mr-2"></i> Add Your First Client
            </button>
            <?php endif; ?>
        </div>
        <?php else: ?>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Information</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <?php foreach ($clients as $client): ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="font-medium text-gray-900"><?php echo $client['company_name']; ?></div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900"><?php echo $client['contact_person']; ?></div>
                            <div class="text-sm text-gray-500"><?php echo $client['email']; ?></div>
                            <div class="text-sm text-gray-500"><?php echo $client['phone']; ?></div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900"><?php echo $client['city']; ?></div>
                            <div class="text-sm text-gray-500 max-w-xs truncate"><?php echo $client['address']; ?></div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <?php echo formatDate($client['created_at']); ?>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex justify-end space-x-2">
                                <button onclick="viewClientDetails(<?php echo $client['id']; ?>)" class="text-primary-700 hover:text-primary-900">
                                    <i class="fas fa-eye"></i>
                                </button>
                                
                                <?php if (hasPermission('edit_clients') || in_array(getCurrentUserRole(), ['admin', 'manager', 'frontoffice'])): ?>
                                <button onclick="openEditClientModal(<?php echo $client['id']; ?>)" class="text-blue-600 hover:text-blue-900">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <?php endif; ?>
                                
                                <?php if (hasPermission('delete_clients') || in_array(getCurrentUserRole(), ['admin', 'manager'])): ?>
                                <button onclick="confirmDeleteClient(<?php echo $client['id']; ?>, '<?php echo addslashes($client['company_name']); ?>')" class="text-red-600 hover:text-red-900">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200">
            <?php
            $baseUrl = "index.php?page=clients" . (!empty($search) ? "&search=$search" : "");
            echo generatePagination($page, $totalPages, $baseUrl . "&page_num");
            ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Add Client Modal -->
<div id="addClientModal" class="fixed inset-0 z-50 hidden overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black opacity-50"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="px-6 py-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">Add New Client</h3>
            </div>
            
            <form action="index.php?page=clients" method="POST" data-validate="true">
                <input type="hidden" name="action" value="add">
                
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="company_name" class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input type="text" id="company_name" name="company_name" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="contact_person" class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input type="text" id="contact_person" name="contact_person" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="email" name="email" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" id="phone" name="phone" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input type="text" id="city" name="city" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div class="md:col-span-2">
                            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea id="address" name="address" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"></textarea>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button type="button" onclick="closeAddClientModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800">
                        Save Client
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Client Modal -->
<div id="editClientModal" class="fixed inset-0 z-50 hidden overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black opacity-50"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="px-6 py-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">Edit Client</h3>
            </div>
            
            <form id="editClientForm" action="index.php?page=clients" method="POST" data-validate="true">
                <input type="hidden" name="action" value="update">
                <input type="hidden" id="edit_client_id" name="client_id">
                
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="edit_company_name" class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input type="text" id="edit_company_name" name="company_name" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="edit_contact_person" class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input type="text" id="edit_contact_person" name="contact_person" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="edit_email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="edit_email" name="email" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="edit_phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" id="edit_phone" name="phone" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div>
                            <label for="edit_city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input type="text" id="edit_city" name="city" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                        </div>
                        
                        <div class="md:col-span-2">
                            <label for="edit_address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea id="edit_address" name="address" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"></textarea>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button type="button" onclick="closeEditClientModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800">
                        Update Client
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- View Client Details Modal -->
<div id="viewClientModal" class="fixed inset-0 z-50 hidden overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black opacity-50"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="px-6 py-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">Client Details</h3>
            </div>
            
            <div class="p-6 space-y-4">
                <div id="clientDetailsContent">
                    <!-- Content will be loaded dynamically -->
                </div>
            </div>
            
            <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button type="button" onclick="closeViewClientModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteClientModal" class="fixed inset-0 z-50 hidden overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black opacity-50"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="px-6 py-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>
            
            <div class="p-6">
                <p class="text-gray-700">Are you sure you want to delete the client: <span id="deleteClientName" class="font-semibold"></span>?</p>
                <p class="text-red-600 mt-2 text-sm">This action cannot be undone.</p>
            </div>
            
            <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button type="button" onclick="closeDeleteClientModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Cancel
                </button>
                <form id="deleteClientForm" action="index.php?page=clients" method="POST">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" id="delete_client_id" name="client_id">
                    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Delete
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    // Client CRUD JavaScript functions
    function openAddClientModal() {
        document.getElementById('addClientModal').classList.remove('hidden');
    }
    
    function closeAddClientModal() {
        document.getElementById('addClientModal').classList.add('hidden');
    }
    
    function openEditClientModal(clientId) {
        // Fetch client data and populate form
        fetch(`api/clients.php?id=${clientId}`)
            .then(response => response.json())
            .then(client => {
                document.getElementById('edit_client_id').value = client.id;
                document.getElementById('edit_company_name').value = client.company_name;
                document.getElementById('edit_contact_person').value = client.contact_person;
                document.getElementById('edit_email').value = client.email;
                document.getElementById('edit_phone').value = client.phone;
                document.getElementById('edit_city').value = client.city;
                document.getElementById('edit_address').value = client.address;
                
                document.getElementById('editClientModal').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error fetching client data:', error);
                alert('Failed to load client data. Please try again.');
            });
    }
    
    function closeEditClientModal() {
        document.getElementById('editClientModal').classList.add('hidden');
    }
    
    function viewClientDetails(clientId) {
        // Fetch client data and show details
        fetch(`api/clients.php?id=${clientId}&include=service_history`)
            .then(response => response.json())
            .then(data => {
                const client = data.client;
                const serviceHistory = data.service_history || [];
                
                let detailsHtml = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-semibold text-gray-700">Company Information</h4>
                            <div class="mt-2 space-y-2">
                                <p><span class="text-gray-500">Company Name:</span> ${client.company_name}</p>
                                <p><span class="text-gray-500">Contact Person:</span> ${client.contact_person}</p>
                                <p><span class="text-gray-500">Email:</span> ${client.email || 'N/A'}</p>
                                <p><span class="text-gray-500">Phone:</span> ${client.phone}</p>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-700">Location</h4>
                            <div class="mt-2 space-y-2">
                                <p><span class="text-gray-500">City:</span> ${client.city}</p>
                                <p><span class="text-gray-500">Address:</span> ${client.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add service history if available
                if (serviceHistory.length > 0) {
                    detailsHtml += `
                        <div class="mt-6">
                            <h4 class="font-semibold text-gray-700 mb-2">Recent Service History</h4>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Engineer</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                    `;
                    
                    serviceHistory.forEach(service => {
                        detailsHtml += `
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap text-sm">${formatDate(service.created_at)}</td>
                                <td class="px-4 py-2 text-sm">${service.issue}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm">${service.engineer_name || 'Not assigned'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm">${getStatusBadgeHtml(service.status)}</td>
                            </tr>
                        `;
                    });
                    
                    detailsHtml += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } else {
                    detailsHtml += `
                        <div class="mt-6 text-center py-4 bg-gray-50 rounded">
                            <p class="text-gray-500">No service history available for this client.</p>
                        </div>
                    `;
                }
                
                document.getElementById('clientDetailsContent').innerHTML = detailsHtml;
                document.getElementById('viewClientModal').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error fetching client details:', error);
                alert('Failed to load client details. Please try again.');
            });
    }
    
    function closeViewClientModal() {
        document.getElementById('viewClientModal').classList.add('hidden');
    }
    
    function confirmDeleteClient(clientId, clientName) {
        document.getElementById('delete_client_id').value = clientId;
        document.getElementById('deleteClientName').textContent = clientName;
        document.getElementById('deleteClientModal').classList.remove('hidden');
    }
    
    function closeDeleteClientModal() {
        document.getElementById('deleteClientModal').classList.add('hidden');
    }
    
    // Helper functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function getStatusBadgeHtml(status) {
        const statusClasses = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'assigned': 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-indigo-100 text-indigo-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        
        const statusClass = statusClasses[status] || 'bg-gray-100 text-gray-800';
        return `<span class="px-2 py-1 text-xs rounded-full ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    }
</script>