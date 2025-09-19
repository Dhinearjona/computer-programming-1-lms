<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if logged in
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/../Db.php';
require_once __DIR__ . '/../Permissions.php';

// Check if user can manage lessons or quizzes
if (!Permission::canManageLessons() && !Permission::canManageQuizzes()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit();
}

header('Content-Type: application/json');

try {
    $pdo = Db::getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_all':
                // Get all lessons for dropdown
                $stmt = $pdo->prepare("
                    SELECT 
                        l.id,
                        l.title,
                        l.subject_id,
                        s.name as subject_name
                    FROM lessons l
                    LEFT JOIN subjects s ON l.subject_id = s.id
                    ORDER BY s.name, l.title
                ");
                $stmt->execute();
                $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $lessons]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } else {
        throw new Exception('Invalid request method');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>