<?php
// Database connection configuration
$host = 'localhost';
$dbname = 'hardware_service_db';
$username = 'root';
$password = '';

// Establish database connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

/**
 * Execute a query with parameters
 * 
 * @param string $sql SQL query
 * @param array $params Parameters for prepared statement
 * @return PDOStatement
 */
function executeQuery($sql, $params = []) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        die("Query Error: " . $e->getMessage());
    }
}

/**
 * Get single record from database
 * 
 * @param string $sql SQL query
 * @param array $params Parameters for prepared statement
 * @return array|false Single record or false if not found
 */
function getSingleRecord($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetch();
}

/**
 * Get multiple records from database
 * 
 * @param string $sql SQL query
 * @param array $params Parameters for prepared statement
 * @return array Records
 */
function getRecords($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetchAll();
}

/**
 * Insert record into database
 * 
 * @param string $table Table name
 * @param array $data Associative array of column => value
 * @return int|false Last inserted ID or false on failure
 */
function insert($table, $data) {
    global $pdo;
    
    $columns = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));
    
    $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log("Insert Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Update record in database
 * 
 * @param string $table Table name
 * @param array $data Associative array of column => value
 * @param string $condition WHERE condition
 * @param array $params Parameters for WHERE condition
 * @return bool Success or failure
 */
function update($table, $data, $condition, $params = []) {
    global $pdo;
    
    $sets = [];
    foreach (array_keys($data) as $column) {
        $sets[] = "$column = :$column";
    }
    
    $sql = "UPDATE $table SET " . implode(', ', $sets) . " WHERE $condition";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($data, $params));
        return true;
    } catch (PDOException $e) {
        error_log("Update Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Delete record from database
 * 
 * @param string $table Table name
 * @param string $condition WHERE condition
 * @param array $params Parameters for WHERE condition
 * @return bool Success or failure
 */
function delete($table, $condition, $params = []) {
    global $pdo;
    
    $sql = "DELETE FROM $table WHERE $condition";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return true;
    } catch (PDOException $e) {
        error_log("Delete Error: " . $e->getMessage());
        return false;
    }
}
?>