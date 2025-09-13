<?php

require_once 'Db.php';

class Grades {
    private $pdo;
    
    public function __construct() {
        $this->pdo = Db::getConnection();
    }
    
    /**
     * Create a new grade
     */
    public function create($data) {
        try {
            $sql = "INSERT INTO grades (student_id, activity_score, quiz_score, exam_score, final_grade, status) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['student_id'],
                $data['activity_score'],
                $data['quiz_score'],
                $data['exam_score'],
                $data['final_grade'],
                $data['status']
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Get all grades with student information
     */
    public function getAll() {
        $sql = "SELECT 
                    g.id,
                    g.student_id,
                    g.activity_score,
                    g.quiz_score,
                    g.exam_score,
                    g.final_grade,
                    g.status,
                    g.created_at,
                    s.course,
                    s.year_level,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM grades g
                INNER JOIN students s ON g.student_id = s.id
                INNER JOIN users u ON s.user_id = u.id
                ORDER BY g.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get grades data for DataTable
     */
    public function getAllForDataTable() {
        $grades = $this->getAll();
        
        $data = [];
        foreach ($grades as $grade) {
            $data[] = [
                'id' => $grade['id'],
                'student_id' => $grade['student_id'],
                'full_name' => $grade['first_name'] . ' ' . $grade['last_name'],
                'email' => $grade['email'],
                'course' => $grade['course'],
                'year_level' => $grade['year_level'],
                'activity_score' => $grade['activity_score'],
                'quiz_score' => $grade['quiz_score'],
                'exam_score' => $grade['exam_score'],
                'final_grade' => $grade['final_grade'],
                'status' => $grade['status'],
                'created_at' => date('M d, Y', strtotime($grade['created_at']))
            ];
        }
        
        return $data;
    }
    
    /**
     * Get grades data for DataTable by student ID (for student view)
     */
    public function getByStudentIdForDataTable($studentId) {
        $grades = $this->getByStudentId($studentId);
        
        $data = [];
        foreach ($grades as $grade) {
            $data[] = [
                'id' => $grade['id'],
                'activity_score' => $grade['activity_score'],
                'quiz_score' => $grade['quiz_score'],
                'exam_score' => $grade['exam_score'],
                'final_grade' => $grade['final_grade'],
                'status' => $grade['status'],
                'created_at' => date('M d, Y', strtotime($grade['created_at']))
            ];
        }
        
        return $data;
    }
    
    /**
     * Get grade by ID
     */
    public function getById($id) {
        $sql = "SELECT 
                    g.id,
                    g.student_id,
                    g.activity_score,
                    g.quiz_score,
                    g.exam_score,
                    g.final_grade,
                    g.status,
                    g.created_at,
                    s.course,
                    s.year_level,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM grades g
                INNER JOIN students s ON g.student_id = s.id
                INNER JOIN users u ON s.user_id = u.id
                WHERE g.id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update grade
     */
    public function update($id, $data) {
        try {
            $sql = "UPDATE grades SET student_id = ?, activity_score = ?, quiz_score = ?, exam_score = ?, final_grade = ?, status = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['student_id'],
                $data['activity_score'],
                $data['quiz_score'],
                $data['exam_score'],
                $data['final_grade'],
                $data['status'],
                $id
            ]);
            
            return true;
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Delete grade
     */
    public function delete($id) {
        try {
            $sql = "DELETE FROM grades WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            
            return true;
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Get grades by student ID
     */
    public function getByStudentId($studentId) {
        $sql = "SELECT 
                    g.id,
                    g.student_id,
                    g.activity_score,
                    g.quiz_score,
                    g.exam_score,
                    g.final_grade,
                    g.status,
                    g.created_at,
                    s.course,
                    s.year_level,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM grades g
                INNER JOIN students s ON g.student_id = s.id
                INNER JOIN users u ON s.user_id = u.id
                WHERE g.student_id = ?
                ORDER BY g.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get student ID by user ID
     */
    public function getStudentIdByUserId($userId) {
        $sql = "SELECT id FROM students WHERE user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    /**
     * Get all students for dropdown
     */
    public function getAllStudents() {
        $sql = "SELECT 
                    s.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    s.course,
                    s.year_level
                FROM students s
                INNER JOIN users u ON s.user_id = u.id
                ORDER BY u.first_name, u.last_name ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get grade statistics
     */
    public function getStatistics() {
        $sql = "SELECT 
                    COUNT(*) as total_grades,
                    AVG(g.final_grade) as average_grade,
                    COUNT(CASE WHEN g.final_grade >= 75 THEN 1 END) as passing_grades,
                    COUNT(CASE WHEN g.final_grade < 75 THEN 1 END) as failing_grades
                FROM grades g";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get paginated grades
     */
    public function getPaginated($start = 0, $length = 10, $search = '', $orderColumn = 0, $orderDir = 'desc') {
        $columns = ['g.id', 'u.first_name', 'u.last_name', 'u.email', 's.course', 's.year_level', 'g.final_grade', 'g.created_at'];
        $orderBy = $columns[$orderColumn] ?? 'g.created_at';
        
        $whereClause = '';
        $params = [];
        
        if (!empty($search)) {
            $whereClause = "WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.course LIKE ? OR s.year_level LIKE ?)";
            $searchParam = "%{$search}%";
            $params = [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam];
        }
        
        $sql = "SELECT 
                    g.id,
                    g.student_id,
                    g.activity_score,
                    g.quiz_score,
                    g.exam_score,
                    g.final_grade,
                    g.status,
                    g.created_at,
                    s.course,
                    s.year_level,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM grades g
                INNER JOIN students s ON g.student_id = s.id
                INNER JOIN users u ON s.user_id = u.id
                {$whereClause}
                ORDER BY {$orderBy} {$orderDir}
                LIMIT {$start}, {$length}";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format data for DataTable
        $formattedData = [];
        foreach ($data as $grade) {
            $formattedData[] = [
                'id' => $grade['id'],
                'student_id' => $grade['student_id'],
                'full_name' => $grade['first_name'] . ' ' . $grade['last_name'],
                'email' => $grade['email'],
                'course' => $grade['course'],
                'year_level' => $grade['year_level'],
                'activity_score' => $grade['activity_score'],
                'quiz_score' => $grade['quiz_score'],
                'exam_score' => $grade['exam_score'],
                'final_grade' => $grade['final_grade'],
                'status' => $grade['status'],
                'created_at' => date('M d, Y', strtotime($grade['created_at']))
            ];
        }
        
        return $formattedData;
    }
    
    /**
     * Get total count for pagination
     */
    public function getTotalCount($search = '') {
        $whereClause = '';
        $params = [];
        
        if (!empty($search)) {
            $whereClause = "WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.course LIKE ? OR s.year_level LIKE ?)";
            $searchParam = "%{$search}%";
            $params = [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam];
        }
        
        $sql = "SELECT COUNT(*) as count 
                FROM grades g
                INNER JOIN students s ON g.student_id = s.id
                INNER JOIN users u ON s.user_id = u.id
                {$whereClause}";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'];
    }
}
?>