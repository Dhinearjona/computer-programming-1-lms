<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../Lessons.php';
require_once '../Permissions.php';

// Check if user is logged in
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Check permissions based on action
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$readOnlyActions = ['get_subjects', 'get_lessons_by_subject'];

// Allow students to access read-only actions
if (!in_array($action, $readOnlyActions) && !Permission::isAdminOrTeacher()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$lessons = new Lessons();

try {
    switch ($action) {
        case 'datatable':
            // DataTable server-side processing
            $draw = intval($_GET['draw'] ?? 1);
            $start = intval($_GET['start'] ?? 0);
            $length = intval($_GET['length'] ?? 10);
            $search = $_GET['search']['value'] ?? '';
            $orderColumn = intval($_GET['order'][0]['column'] ?? 0);
            $orderDir = $_GET['order'][0]['dir'] ?? 'desc';
            
            $data = $lessons->getPaginated($start, $length, $search, $orderColumn, $orderDir);
            $totalRecords = $lessons->getTotalCount();
            $filteredRecords = $lessons->getTotalCount($search);
            
            echo json_encode([
                'draw' => $draw,
                'recordsTotal' => $totalRecords,
                'recordsFiltered' => $filteredRecords,
                'data' => $data
            ]);
            break;
            
        case 'list':
            // Get all lessons for export
            $data = $lessons->getAllForDataTable();
            echo json_encode(['success' => true, 'data' => $data]);
            break;
            
        case 'get_lesson':
            $id = $_POST['id'] ?? '';
            if (empty($id)) {
                throw new Exception('Lesson ID is required');
            }
            
            $lesson = $lessons->getById($id);
            if (!$lesson) {
                throw new Exception('Lesson not found');
            }
            
            echo json_encode(['success' => true, 'data' => $lesson]);
            break;
            
        case 'create_lesson':
            $subject_id = $_POST['subject_id'] ?? '';
            $title = $_POST['title'] ?? '';
            $content = $_POST['content'] ?? '';
            
            // Validation
            if (empty($subject_id) || empty($title) || empty($content)) {
                throw new Exception('All fields are required');
            }
            
            if (!is_numeric($subject_id)) {
                throw new Exception('Invalid subject selection');
            }
            
            if (strlen($title) < 3) {
                throw new Exception('Title must be at least 3 characters');
            }
            
            if (strlen($content) < 10) {
                throw new Exception('Content must be at least 10 characters');
            }
            
            $data = [
                'subject_id' => $subject_id,
                'title' => $title,
                'content' => $content
            ];
            
            $lessonId = $lessons->create($data);
            echo json_encode(['success' => true, 'message' => 'Lesson created successfully', 'id' => $lessonId]);
            break;
            
        case 'update_lesson':
            $id = $_POST['id'] ?? '';
            $subject_id = $_POST['subject_id'] ?? '';
            $title = $_POST['title'] ?? '';
            $content = $_POST['content'] ?? '';
            
            // Validation
            if (empty($id) || empty($subject_id) || empty($title) || empty($content)) {
                throw new Exception('All fields are required');
            }
            
            if (!is_numeric($id) || !is_numeric($subject_id)) {
                throw new Exception('Invalid ID or subject selection');
            }
            
            if (strlen($title) < 3) {
                throw new Exception('Title must be at least 3 characters');
            }
            
            if (strlen($content) < 10) {
                throw new Exception('Content must be at least 10 characters');
            }
            
            $data = [
                'subject_id' => $subject_id,
                'title' => $title,
                'content' => $content
            ];
            
            $lessons->update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Lesson updated successfully']);
            break;
            
        case 'delete_lesson':
            $id = $_POST['id'] ?? '';
            if (empty($id)) {
                throw new Exception('Lesson ID is required');
            }
            
            $lessons->delete($id);
            echo json_encode(['success' => true, 'message' => 'Lesson deleted successfully']);
            break;
            
        case 'get_subjects':
            // Get all subjects for dropdown
            $subjects = $lessons->getAllSubjects();
            echo json_encode(['success' => true, 'data' => $subjects]);
            break;
            
        case 'get_lessons_by_subject':
            $subjectId = $_GET['subject_id'] ?? '';
            if (empty($subjectId)) {
                throw new Exception('Subject ID is required');
            }
            
            $lessonsData = $lessons->getBySubjectId($subjectId);
            echo json_encode(['success' => true, 'data' => $lessonsData]);
            break;
            
        case 'statistics':
            $stats = $lessons->getStatistics();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        case 'lessons_by_subject_stats':
            $stats = $lessons->getLessonsCountBySubject();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
