<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if logged in
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    error_log("Teacher Submissions API - No user session found");
    error_log("Session data: " . print_r($_SESSION, true));
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - No user session']);
    exit();
}


require_once __DIR__ . '/../Db.php';
require_once __DIR__ . '/../Activities.php';
require_once __DIR__ . '/../Permissions.php';

// Check if user is teacher or admin
if (!Permission::isAdminOrTeacher()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied - Teachers only']);
    exit();
}

$userId = $_SESSION['user']['id'];

header('Content-Type: application/json');

try {
    $pdo = Db::getConnection();
    $activitiesModel = new Activities($pdo);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'datatable';
        
        
        switch ($action) {
            case 'datatable':
                // Check if activity_grades table exists, if not create it
                try {
                    $checkTable = $pdo->query("SHOW TABLES LIKE 'activity_grades'");
                    if ($checkTable->rowCount() == 0) {
                        // Create the table if it doesn't exist
                        $createTable = $pdo->exec("
                            CREATE TABLE activity_grades (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                submission_id INT NOT NULL,
                                score DECIMAL(5,2) NOT NULL,
                                max_score DECIMAL(5,2) NOT NULL,
                                comments TEXT,
                                graded_by INT NOT NULL,
                                graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (submission_id) REFERENCES activity_submissions(id),
                                FOREIGN KEY (graded_by) REFERENCES users(id)
                            )
                        ");
                        error_log("Created activity_grades table");
                    }
                } catch (Exception $e) {
                    error_log("Error checking/creating activity_grades table: " . $e->getMessage());
                }
                
                // Get all student submissions with activity and student details
                $stmt = $pdo->prepare("
                    SELECT 
                        asub.id as submission_id,
                        asub.activity_id,
                        asub.student_id,
                        asub.submission_link,
                        asub.submission_text,
                        asub.status as submission_status,
                        asub.submitted_at,
                        asub.updated_at,
                        a.title as activity_title,
                        a.description as activity_description,
                        a.due_date,
                        a.cutoff_date,
                        100 as max_score,
                        s.name as subject_name,
                        u.first_name,
                        u.last_name,
                        u.email as student_email,
                        ag.score,
                        ag.max_score as grade_max_score,
                        ag.comments as grade_comments,
                        ag.graded_at
                    FROM activity_submissions asub
                    LEFT JOIN activities a ON asub.activity_id = a.id
                    LEFT JOIN subjects s ON a.subject_id = s.id
                    LEFT JOIN students st ON asub.student_id = st.id
                    LEFT JOIN users u ON st.user_id = u.id
                    LEFT JOIN activity_grades ag ON asub.id = ag.submission_id
                    WHERE a.subject_id = 1  -- Computer Programming 1
                    ORDER BY asub.submitted_at DESC
                ");
                
                $stmt->execute();
                $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // If no submissions found, return empty array with proper structure
                if (empty($submissions)) {
                    // No submissions found - this is normal for new installations
                }
                
                // Format data for DataTables
                $formattedData = [];
                foreach ($submissions as $submission) {
                    $formattedData[] = [
                        'submission_id' => $submission['submission_id'],
                        'activity_id' => $submission['activity_id'],
                        'student_id' => $submission['student_id'],
                        'student_name' => $submission['first_name'] . ' ' . $submission['last_name'],
                        'student_email' => $submission['student_email'],
                        'activity_title' => $submission['activity_title'],
                        'subject_name' => $submission['subject_name'],
                        'submission_link' => $submission['submission_link'],
                        'submission_text' => $submission['submission_text'],
                        'submission_status' => $submission['submission_status'],
                        'submitted_at' => $submission['submitted_at'],
                        'updated_at' => $submission['updated_at'],
                        'due_date' => $submission['due_date'],
                        'cutoff_date' => $submission['cutoff_date'],
                        'max_score' => $submission['max_score'],
                        'grade_score' => $submission['score'],
                        'grade_max_score' => $submission['grade_max_score'],
                        'grade_comments' => $submission['grade_comments'],
                        'graded_at' => $submission['graded_at']
                    ];
                }
                
                // Return DataTables format
                $response = [
                    'draw' => intval($_GET['draw'] ?? 1),
                    'recordsTotal' => count($formattedData),
                    'recordsFiltered' => count($formattedData),
                    'data' => $formattedData
                ];
                
                
                echo json_encode($response);
                break;
                
            case 'get_submission':
                $submissionId = (int)($_GET['id'] ?? 0);
                
                if ($submissionId <= 0) {
                    throw new Exception('Invalid submission ID');
                }
                
                $stmt = $pdo->prepare("
                    SELECT 
                        asub.id as submission_id,
                        asub.activity_id,
                        asub.student_id,
                        asub.submission_link,
                        asub.submission_text,
                        asub.status as submission_status,
                        asub.submitted_at,
                        asub.updated_at,
                        a.title as activity_title,
                        a.description as activity_description,
                        a.due_date,
                        a.cutoff_date,
                        100 as max_score,
                        s.name as subject_name,
                        u.first_name,
                        u.last_name,
                        u.email as student_email,
                        ag.score,
                        ag.max_score as grade_max_score,
                        ag.comments as grade_comments,
                        ag.graded_at
                    FROM activity_submissions asub
                    LEFT JOIN activities a ON asub.activity_id = a.id
                    LEFT JOIN subjects s ON a.subject_id = s.id
                    LEFT JOIN students st ON asub.student_id = st.id
                    LEFT JOIN users u ON st.user_id = u.id
                    LEFT JOIN activity_grades ag ON asub.id = ag.submission_id
                    WHERE asub.id = ?
                ");
                
                $stmt->execute([$submissionId]);
                $submission = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$submission) {
                    throw new Exception('Submission not found');
                }
                
                echo json_encode(['success' => true, 'data' => $submission]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'grade_submission':
                $submissionId = (int)($_POST['submission_id'] ?? 0);
                $score = (float)($_POST['score'] ?? 0);
                $maxScore = (float)($_POST['max_score'] ?? 100);
                $comments = $_POST['comments'] ?? '';
                
                if ($submissionId <= 0) {
                    throw new Exception('Invalid submission ID');
                }
                
                if ($score < 0 || $score > $maxScore) {
                    throw new Exception('Invalid score. Score must be between 0 and max score.');
                }
                
                // Check if submission exists
                $stmt = $pdo->prepare("SELECT id FROM activity_submissions WHERE id = ?");
                $stmt->execute([$submissionId]);
                if (!$stmt->fetch()) {
                    throw new Exception('Submission not found');
                }
                
                // Check if grade already exists
                $gradeStmt = $pdo->prepare("SELECT id FROM activity_grades WHERE submission_id = ?");
                $gradeStmt->execute([$submissionId]);
                $existingGrade = $gradeStmt->fetch();
                
                if ($existingGrade) {
                    // Update existing grade
                    $updateStmt = $pdo->prepare("
                        UPDATE activity_grades 
                        SET score = ?, max_score = ?, comments = ?, graded_at = CURRENT_TIMESTAMP 
                        WHERE submission_id = ?
                    ");
                    $updateStmt->execute([$score, $maxScore, $comments, $submissionId]);
                } else {
                    // Create new grade
                    $insertStmt = $pdo->prepare("
                        INSERT INTO activity_grades (submission_id, score, max_score, comments, graded_by, graded_at) 
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ");
                    $insertStmt->execute([$submissionId, $score, $maxScore, $comments, $userId]);
                }
                
                echo json_encode(['success' => true, 'message' => 'Grade submitted successfully']);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
