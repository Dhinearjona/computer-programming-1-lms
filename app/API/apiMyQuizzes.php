<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../Db.php';
require_once __DIR__ . '/../Quizzes.php';
require_once __DIR__ . '/../Students.php';
require_once __DIR__ . '/../Permissions.php';

// Check if user is logged in
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$userRole = $_SESSION['user']['role'];
$userId = $_SESSION['user']['id'];

// Check if user is student
if (!Permission::isStudent()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: Only students can access this resource.']);
    exit();
}

try {
    $pdo = Db::getConnection();
    $quizzesModel = new Quizzes($pdo);
    $studentsModel = new Students($pdo);

    // Get student ID from user ID
    $studentId = $studentsModel->getStudentIdByUserId($userId);
    if (!$studentId) {
        throw new Exception('Student record not found');
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'datatable':
                // Get quizzes for the student's subject (Computer Programming 1)
                $quizzes = $quizzesModel->getAll();
                
                // Filter quizzes for the student's subject
                $studentQuizzes = [];
                foreach ($quizzes as $quiz) {
                    // Only show quizzes for Computer Programming 1 (subject_id = 1)
                    if ($quiz['subject_id'] == 1) {
                        $studentQuizzes[] = [
                            'id' => $quiz['id'],
                            'title' => $quiz['title'],
                            'subject_name' => $quiz['subject_name'],
                            'description' => $quiz['description'] ?? 'No description',
                            'time_limit' => $quiz['time_limit_minutes'],
                            'max_score' => $quiz['max_score'],
                            'status' => $quiz['status'] ?? 'active'
                        ];
                    }
                }
                
                echo json_encode(['data' => $studentQuizzes]);
                break;
                
            case 'get_quiz':
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                $quiz = $quizzesModel->getById($id);
                if (!$quiz) {
                    throw new Exception('Quiz not found');
                }
                
                // Ensure the quiz belongs to the student's enrolled subjects
                if ($quiz['subject_id'] != 1) {
                    throw new Exception('Forbidden: You do not have access to this quiz.');
                }
                
                echo json_encode(['success' => true, 'data' => $quiz]);
                break;
                
            default:
                throw new Exception('Invalid action.');
        }
    } else {
        throw new Exception('Invalid request method.');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
