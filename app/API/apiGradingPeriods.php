<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if logged in
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include required files
require_once __DIR__ . '/../Permissions.php';
require_once __DIR__ . '/../GradingPeriods.php';

// Check permissions
if (!Permission::canManageGradingPeriods()) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

$gradingPeriods = new GradingPeriods();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet($gradingPeriods);
            break;
        case 'POST':
            handlePost($gradingPeriods);
            break;
        case 'PUT':
            handlePut($gradingPeriods);
            break;
        case 'DELETE':
            handleDelete($gradingPeriods);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleGet($gradingPeriods) {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'datatable':
            $draw = intval($_GET['draw'] ?? 1);
            $start = intval($_GET['start'] ?? 0);
            $length = intval($_GET['length'] ?? 10);
            $search = $_GET['search']['value'] ?? '';
            $orderColumn = intval($_GET['order'][0]['column'] ?? 0);
            $orderDir = $_GET['order'][0]['dir'] ?? 'desc';
            
            $data = $gradingPeriods->getPaginated($start, $length, $search, $orderColumn, $orderDir);
            $totalRecords = $gradingPeriods->getTotalCount();
            $filteredRecords = $gradingPeriods->getTotalCount($search);
            
            echo json_encode([
                'draw' => $draw,
                'recordsTotal' => $totalRecords,
                'recordsFiltered' => $filteredRecords,
                'data' => $data
            ]);
            break;
            
        case 'get':
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                return;
            }
            
            $gradingPeriod = $gradingPeriods->getById($id);
            if (!$gradingPeriod) {
                http_response_code(404);
                echo json_encode(['error' => 'Grading period not found']);
                return;
            }
            
            echo json_encode(['success' => true, 'data' => $gradingPeriod]);
            break;
            
        case 'semesters':
            $semesters = $gradingPeriods->getAllSemesters();
            echo json_encode(['success' => true, 'data' => $semesters]);
            break;
            
        case 'dropdown':
            $semesterId = $_GET['semester_id'] ?? null;
            $periods = $gradingPeriods->getForDropdown($semesterId);
            echo json_encode(['success' => true, 'data' => $periods]);
            break;
            
        case 'current':
            $current = $gradingPeriods->getCurrentActive();
            echo json_encode(['success' => true, 'data' => $current]);
            break;
            
        case 'statistics':
            $stats = $gradingPeriods->getStatistics();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        default:
            $allPeriods = $gradingPeriods->getAllForDataTable();
            echo json_encode(['success' => true, 'data' => $allPeriods]);
            break;
    }
}

function handlePost($gradingPeriods) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create_grading_period':
            $data = [
                'semester_id' => $input['semester_id'] ?? '',
                'name' => $input['name'] ?? '',
                'start_date' => $input['start_date'] ?? '',
                'end_date' => $input['end_date'] ?? '',
                'weight_percent' => $input['weight_percent'] ?? 0,
                'status' => $input['status'] ?? 'pending'
            ];
            
            // Validate required fields
            $required = ['semester_id', 'name', 'start_date', 'end_date', 'weight_percent'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                    return;
                }
            }
            
            // Validate dates
            if (strtotime($data['start_date']) >= strtotime($data['end_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'End date must be after start date']);
                return;
            }
            
            // Check for date conflicts
            if (!$gradingPeriods->validateDates($data['semester_id'], $data['start_date'], $data['end_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Date range conflicts with existing grading period']);
                return;
            }
            
            $id = $gradingPeriods->create($data);
            echo json_encode(['success' => true, 'message' => 'Grading period created successfully', 'id' => $id]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePut($gradingPeriods) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'update_grading_period':
            $id = $input['id'] ?? '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                return;
            }
            
            $data = [
                'semester_id' => $input['semester_id'] ?? '',
                'name' => $input['name'] ?? '',
                'start_date' => $input['start_date'] ?? '',
                'end_date' => $input['end_date'] ?? '',
                'weight_percent' => $input['weight_percent'] ?? 0,
                'status' => $input['status'] ?? 'pending'
            ];
            
            // Validate required fields
            $required = ['semester_id', 'name', 'start_date', 'end_date', 'weight_percent'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                    return;
                }
            }
            
            // Validate dates
            if (strtotime($data['start_date']) >= strtotime($data['end_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'End date must be after start date']);
                return;
            }
            
            // Check for date conflicts (excluding current record)
            if (!$gradingPeriods->validateDates($data['semester_id'], $data['start_date'], $data['end_date'], $id)) {
                http_response_code(400);
                echo json_encode(['error' => 'Date range conflicts with existing grading period']);
                return;
            }
            
            $gradingPeriods->update($id, $data);
            echo json_encode(['success' => true, 'message' => 'Grading period updated successfully']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handleDelete($gradingPeriods) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'delete_grading_period':
            $id = $input['id'] ?? '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                return;
            }
            
            // Check if user can delete
            if (!Permission::canDeleteGradingPeriods()) {
                http_response_code(403);
                echo json_encode(['error' => 'You do not have permission to delete grading periods']);
                return;
            }
            
            $gradingPeriods->delete($id);
            echo json_encode(['success' => true, 'message' => 'Grading period deleted successfully']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}
?>
