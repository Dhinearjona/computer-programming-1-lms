<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../Grades.php';
require_once '../Permissions.php';

// Check if user is logged in
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Check permissions
if (!Permission::canManageGrades() && !Permission::canViewOwnGrades()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$grades = new Grades();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'datatable':
            // Check if user is student - show only their grades
            if (Permission::isStudent()) {
                $userId = $_SESSION['user']['id'];
                $studentId = $grades->getStudentIdByUserId($userId);
                
                if (!$studentId) {
                    echo json_encode([
                        'draw' => intval($_GET['draw'] ?? 1),
                        'recordsTotal' => 0,
                        'recordsFiltered' => 0,
                        'data' => []
                    ]);
                    break;
                }
                
                $data = $grades->getByStudentIdForDataTable($studentId);
                echo json_encode([
                    'draw' => intval($_GET['draw'] ?? 1),
                    'recordsTotal' => count($data),
                    'recordsFiltered' => count($data),
                    'data' => $data
                ]);
            } else {
                // Admin/Teacher view - show all grades
                $draw = intval($_GET['draw'] ?? 1);
                $start = intval($_GET['start'] ?? 0);
                $length = intval($_GET['length'] ?? 10);
                $search = $_GET['search']['value'] ?? '';
                $orderColumn = intval($_GET['order'][0]['column'] ?? 0);
                $orderDir = $_GET['order'][0]['dir'] ?? 'desc';
                
                $data = $grades->getPaginated($start, $length, $search, $orderColumn, $orderDir);
                $totalRecords = $grades->getTotalCount();
                $filteredRecords = $grades->getTotalCount($search);
                
                echo json_encode([
                    'draw' => $draw,
                    'recordsTotal' => $totalRecords,
                    'recordsFiltered' => $filteredRecords,
                    'data' => $data
                ]);
            }
            break;
            
        case 'list':
            // Get all grades for export
            $data = $grades->getAllForDataTable();
            echo json_encode(['success' => true, 'data' => $data]);
            break;
            
        case 'get_grade':
            $id = $_POST['id'] ?? '';
            if (empty($id)) {
                throw new Exception('Grade ID is required');
            }
            
            $grade = $grades->getById($id);
            if (!$grade) {
                throw new Exception('Grade not found');
            }
            
            echo json_encode(['success' => true, 'data' => $grade]);
            break;
            
        case 'create_grade':
            if (!Permission::canManageGrades()) {
                throw new Exception('Access denied');
            }
            
            $student_id = $_POST['student_id'] ?? '';
            $activity_score = $_POST['activity_score'] ?? '';
            $quiz_score = $_POST['quiz_score'] ?? '';
            $exam_score = $_POST['exam_score'] ?? '';
            $final_grade = $_POST['final_grade'] ?? '';
            
            // Validation
            if (empty($student_id) || empty($activity_score) || empty($quiz_score) || empty($exam_score) || empty($final_grade)) {
                throw new Exception('All fields are required');
            }
            
            if (!is_numeric($student_id)) {
                throw new Exception('Invalid student selection');
            }
            
            if (!is_numeric($activity_score) || !is_numeric($quiz_score) || !is_numeric($exam_score) || !is_numeric($final_grade)) {
                throw new Exception('All scores must be numeric');
            }
            
            if ($activity_score < 0 || $activity_score > 100 || $quiz_score < 0 || $quiz_score > 100 || $exam_score < 0 || $exam_score > 100 || $final_grade < 0 || $final_grade > 100) {
                throw new Exception('All scores must be between 0 and 100');
            }
            
            // Determine status based on final grade
            $status = ($final_grade >= 75) ? 'pass' : 'fail';
            
            $data = [
                'student_id' => $student_id,
                'activity_score' => $activity_score,
                'quiz_score' => $quiz_score,
                'exam_score' => $exam_score,
                'final_grade' => $final_grade,
                'status' => $status
            ];
            
            $gradeId = $grades->create($data);
            echo json_encode(['success' => true, 'message' => 'Grade created successfully', 'id' => $gradeId]);
            break;
            
        case 'update_grade':
            if (!Permission::canManageGrades()) {
                throw new Exception('Access denied');
            }
            
            $id = $_POST['id'] ?? '';
            $student_id = $_POST['student_id'] ?? '';
            $activity_score = $_POST['activity_score'] ?? '';
            $quiz_score = $_POST['quiz_score'] ?? '';
            $exam_score = $_POST['exam_score'] ?? '';
            $final_grade = $_POST['final_grade'] ?? '';
            
            // Validation
            if (empty($id) || empty($student_id) || empty($activity_score) || empty($quiz_score) || empty($exam_score) || empty($final_grade)) {
                throw new Exception('All fields are required');
            }
            
            if (!is_numeric($id) || !is_numeric($student_id)) {
                throw new Exception('Invalid ID or student selection');
            }
            
            if (!is_numeric($activity_score) || !is_numeric($quiz_score) || !is_numeric($exam_score) || !is_numeric($final_grade)) {
                throw new Exception('All scores must be numeric');
            }
            
            if ($activity_score < 0 || $activity_score > 100 || $quiz_score < 0 || $quiz_score > 100 || $exam_score < 0 || $exam_score > 100 || $final_grade < 0 || $final_grade > 100) {
                throw new Exception('All scores must be between 0 and 100');
            }
            
            // Determine status based on final grade
            $status = ($final_grade >= 75) ? 'pass' : 'fail';
            
            $data = [
                'student_id' => $student_id,
                'activity_score' => $activity_score,
                'quiz_score' => $quiz_score,
                'exam_score' => $exam_score,
                'final_grade' => $final_grade,
                'status' => $status
            ];
            
            $grades->update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Grade updated successfully']);
            break;
            
        case 'delete_grade':
            if (!Permission::canManageGrades()) {
                throw new Exception('Access denied');
            }
            
            $id = $_POST['id'] ?? '';
            if (empty($id)) {
                throw new Exception('Grade ID is required');
            }
            
            $grades->delete($id);
            echo json_encode(['success' => true, 'message' => 'Grade deleted successfully']);
            break;
            
        case 'get_students':
            if (!Permission::canManageGrades()) {
                throw new Exception('Access denied');
            }
            
            $students = $grades->getAllStudents();
            echo json_encode(['success' => true, 'data' => $students]);
            break;
            
        case 'statistics':
            $stats = $grades->getStatistics();
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