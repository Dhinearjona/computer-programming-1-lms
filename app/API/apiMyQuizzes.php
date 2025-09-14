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

// Check if user can view their own quizzes
if (!Permission::canViewOwnQuizzes()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: Access denied.']);
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
                // Get quizzes with lesson and grading period information
                $stmt = $pdo->prepare("
                    SELECT 
                        q.id,
                        q.title,
                        q.max_score,
                        q.time_limit_minutes,
                        q.created_at,
                        l.title as lesson_title,
                        gp.name as grading_period_name,
                        gp.status as grading_period_status,
                        qr.score as my_score
                    FROM quizzes q
                    INNER JOIN lessons l ON q.lesson_id = l.id
                    INNER JOIN grading_periods gp ON q.grading_period_id = gp.id
                    LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.student_id = ?
                    WHERE l.subject_id = 1
                    ORDER BY q.created_at DESC
                ");
                $stmt->execute([$studentId]);
                $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['data' => $quizzes]);
                break;
                
            case 'get_quiz':
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                // Get quiz with lesson and grading period information
                $stmt = $pdo->prepare("
                    SELECT 
                        q.id,
                        q.title,
                        q.max_score,
                        q.time_limit_minutes,
                        q.created_at,
                        l.title as lesson_title,
                        l.content as lesson_content,
                        gp.name as grading_period_name,
                        gp.status as grading_period_status,
                        qr.score as my_score,
                        qr.taken_at
                    FROM quizzes q
                    INNER JOIN lessons l ON q.lesson_id = l.id
                    INNER JOIN grading_periods gp ON q.grading_period_id = gp.id
                    LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.student_id = ?
                    WHERE q.id = ? AND l.subject_id = 1
                ");
                $stmt->execute([$studentId, $id]);
                $quiz = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$quiz) {
                    throw new Exception('Quiz not found or access denied');
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
