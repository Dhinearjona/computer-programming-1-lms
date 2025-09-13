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
require_once __DIR__ . '/../Activities.php';
require_once __DIR__ . '/../Students.php';
require_once __DIR__ . '/../Permissions.php';

// Check if user is student
if (!Permission::isStudent()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied - Students only']);
    exit();
}

$userId = $_SESSION['user']['id'];

header('Content-Type: application/json');

try {
    $pdo = Db::getConnection();
    $activitiesModel = new Activities($pdo);
    $studentsModel = new Students($pdo);
    
    // Get student ID from user ID
    $studentId = $studentsModel->getStudentIdByUserId($userId);
    
    if (!$studentId) {
        throw new Exception('Student record not found');
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'datatable':
                // Get activities for the student's subject (Computer Programming 1)
                $activities = $activitiesModel->getAll();
                
                // Filter activities for the student's subject
                $studentActivities = [];
                foreach ($activities as $activity) {
                    // Only show activities for Computer Programming 1 (subject_id = 1)
                    if ($activity['subject_id'] == 1) {
                        $studentActivities[] = [
                            'id' => $activity['id'],
                            'title' => $activity['title'],
                            'subject_name' => $activity['subject_name'],
                            'description' => $activity['description'],
                            'due_date' => $activity['due_date'],
                            'cutoff_date' => $activity['cutoff_date'],
                            'deduction_percent' => $activity['deduction_percent'],
                            'status' => $activity['status']
                        ];
                    }
                }
                
                echo json_encode(['data' => $studentActivities]);
                break;
                
            case 'get_activity':
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid activity ID');
                }
                
                $activity = $activitiesModel->getById($id);
                if (!$activity) {
                    throw new Exception('Activity not found');
                }
                
                // Check if activity belongs to student's subject
                if ($activity['subject_id'] != 1) {
                    throw new Exception('Access denied - Activity not available');
                }
                
                echo json_encode(['success' => true, 'data' => $activity]);
                break;
                
            case 'get_my_activities':
                // Get all activities for the student
                $activities = $activitiesModel->getAll();
                $studentActivities = [];
                
                foreach ($activities as $activity) {
                    if ($activity['subject_id'] == 1) { // Computer Programming 1
                        $studentActivities[] = $activity;
                    }
                }
                
                echo json_encode(['success' => true, 'data' => $studentActivities]);
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
