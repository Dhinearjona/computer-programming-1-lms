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
require_once __DIR__ . '/../Quizzes.php';
require_once __DIR__ . '/../Permissions.php';

// Check permissions - admin, teacher, and students can access quizzes
$userRole = $_SESSION['user']['role'];
if ($userRole !== 'admin' && $userRole !== 'teacher' && $userRole !== 'student') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit();
}

header('Content-Type: application/json');

try {
    $pdo = Db::getConnection();
    $quizzesModel = new Quizzes($pdo);
    $userId = $_SESSION['user']['id'];
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
        // Check if user has management permissions for CRUD operations
        if (!Permission::canManageQuizzes()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You do not have permission to manage quizzes']);
            exit();
        }
        
        switch ($_POST['action']) {
            case 'create_quiz':
                // Check add permission
                if (!Permission::canAddQuizzes()) {
                    throw new Exception('You do not have permission to add quizzes');
                }
                
                $data = [
                    'lesson_id' => (int)($_POST['lesson_id'] ?? 0),
                    'title' => trim($_POST['title'] ?? ''),
                    'max_score' => (int)($_POST['max_score'] ?? 100),
                    'time_limit_minutes' => (int)($_POST['time_limit_minutes'] ?? 0) ?: null
                ];
                
                if (empty($data['title']) || $data['lesson_id'] <= 0) {
                    throw new Exception('Title and Lesson are required');
                }
                
                $result = $quizzesModel->create($data);
                echo json_encode(['success' => true, 'message' => 'Quiz created successfully', 'data' => $result]);
                break;
                
            case 'update_quiz':
                // Check edit permission
                if (!Permission::canEditQuizzes()) {
                    throw new Exception('You do not have permission to edit quizzes');
                }
                
                $id = (int)($_POST['id'] ?? 0);
                $data = [
                    'lesson_id' => (int)($_POST['lesson_id'] ?? 0),
                    'title' => trim($_POST['title'] ?? ''),
                    'max_score' => (int)($_POST['max_score'] ?? 100),
                    'time_limit_minutes' => (int)($_POST['time_limit_minutes'] ?? 0) ?: null
                ];
                
                if (empty($data['title']) || $data['lesson_id'] <= 0 || $id <= 0) {
                    throw new Exception('Invalid data provided');
                }
                
                // Check if quiz exists
                $quiz = $quizzesModel->getById($id);
                if (!$quiz) {
                    throw new Exception('Quiz not found');
                }
                
                $result = $quizzesModel->update($id, $data);
                echo json_encode(['success' => true, 'message' => 'Quiz updated successfully', 'data' => $result]);
                break;
                
            case 'delete_quiz':
                // Check delete permission (Admin only)
                if (!Permission::canDeleteQuizzes()) {
                    throw new Exception('You do not have permission to delete quizzes');
                }
                
                $id = (int)($_POST['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                // Check if quiz exists
                $quiz = $quizzesModel->getById($id);
                if (!$quiz) {
                    throw new Exception('Quiz not found');
                }
                
                $result = $quizzesModel->delete($id);
                echo json_encode(['success' => true, 'message' => 'Quiz deleted successfully', 'data' => $result]);
                break;
                
            case 'get_quiz':
                $id = (int)($_POST['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                $result = $quizzesModel->getById($id);
                if (!$result) {
                    throw new Exception('Quiz not found');
                }
                
                echo json_encode(['success' => true, 'data' => $result]);
                break;
                
            case 'get_quiz_submissions':
                $id = (int)($_POST['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                // Check if user owns this quiz or is admin/teacher
                $quiz = $quizzesModel->getById($id);
                if (!$quiz) {
                    throw new Exception('Quiz not found');
                }
                
                if ($userRole !== 'admin' && $userRole !== 'teacher' && $quiz['author_id'] != $userId) {
                    throw new Exception('You can only view submissions for your own quizzes');
                }
                
                $submissions = $quizzesModel->getSubmissions($id);
                echo json_encode(['success' => true, 'data' => $submissions]);
                break;
                
            case 'get_quiz_statistics':
                $id = (int)($_POST['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                // Check if user owns this quiz or is admin
                $quiz = $quizzesModel->getById($id);
                if (!$quiz) {
                    throw new Exception('Quiz not found');
                }
                
                if ($userRole !== 'admin' && $quiz['author_id'] != $userId) {
                    throw new Exception('You can only view statistics for your own quizzes');
                }
                
                $statistics = $quizzesModel->getStatistics($id);
                echo json_encode(['success' => true, 'data' => $statistics]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'list':
                $quizzes = $quizzesModel->getAll();
                echo json_encode(['success' => true, 'data' => $quizzes]);
                break;
                
            case 'datatable':
                $quizzes = $quizzesModel->getAllForDataTable();
                echo json_encode(['data' => $quizzes]);
                break;
                
            case 'my_quizzes':
                $quizzes = $quizzesModel->getAll();
                echo json_encode(['success' => true, 'data' => $quizzes]);
                break;
                
            case 'get_quiz':
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    throw new Exception('Invalid quiz ID');
                }
                
                $result = $quizzesModel->getById($id);
                if (!$result) {
                    throw new Exception('Quiz not found');
                }
                
                echo json_encode(['success' => true, 'data' => $result]);
                break;
                
            case 'get_lessons':
                $stmt = $pdo->query("SELECT id, title FROM lessons ORDER BY title");
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
