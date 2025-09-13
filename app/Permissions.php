<?php 

class Permission {
    
    /**
     * Get current user role from session
     */
    private static function getUserRole(): string {
        return $_SESSION['user']['role'] ?? '';
    }
    
    // ========================
    // USER MANAGEMENT PERMISSIONS
    // ========================
    
    /**
     * Can manage users (Admin only)
     */
    public static function canManageUsers(): bool {
        return self::getUserRole() === 'admin';
    }
    
    /**
     * Can add users (Admin only)
     */
    public static function canAddUsers(): bool {
        return self::getUserRole() === 'admin';
    }
    
    /**
     * Can edit users (Admin only)
     */
    public static function canEditUsers(): bool {
        return self::getUserRole() === 'admin';
    }
    
    /**
     * Can delete users (Admin only)
     */
    public static function canDeleteUsers(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // STUDENT MANAGEMENT PERMISSIONS
    // ========================
    
    /**
     * Can manage students (Admin and Teacher)
     */
    public static function canManageStudents(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can add students (Admin and Teacher)
     */
    public static function canAddStudents(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can edit students (Admin and Teacher)
     */
    public static function canEditStudents(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can delete students (Admin only)
     */
    public static function canDeleteStudents(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // ACTIVITIES PERMISSIONS
    // ========================
    
    /**
     * Can manage activities (Admin and Teacher)
     */
    public static function canManageActivities(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can add activities (Admin and Teacher)
     */
    public static function canAddActivities(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can edit activities (Admin and Teacher)
     */
    public static function canEditActivities(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can delete activities (Admin only)
     */
    public static function canDeleteActivities(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // QUIZZES PERMISSIONS
    // ========================
    
    /**
     * Can manage quizzes (Admin and Teacher)
     */
    public static function canManageQuizzes(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can add quizzes (Admin and Teacher)
     */
    public static function canAddQuizzes(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can edit quizzes (Admin and Teacher)
     */
    public static function canEditQuizzes(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can delete quizzes (Admin only)
     */
    public static function canDeleteQuizzes(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // GRADES PERMISSIONS
    // ========================
    
    /**
     * Can manage grades (Admin and Teacher)
     */
    public static function canManageGrades(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can view own grades (Student)
     */
    public static function canViewOwnGrades(): bool {
        return self::getUserRole() === 'student';
    }
    
    // ========================
    // INTERVENTIONS PERMISSIONS
    // ========================
    
    /**
     * Can manage interventions (Admin and Teacher)
     */
    public static function canManageInterventions(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can add interventions (Admin and Teacher)
     */
    public static function canAddInterventions(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can edit interventions (Admin and Teacher)
     */
    public static function canEditInterventions(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can delete interventions (Admin only)
     */
    public static function canDeleteInterventions(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // ANNOUNCEMENTS PERMISSIONS
    // ========================
    
    /**
     * Can manage announcements (Admin and Teacher)
     */
    public static function canManageAnnouncements(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can add announcements (Admin and Teacher)
     */
    public static function canAddAnnouncements(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can edit announcements (Admin and Teacher)
     */
    public static function canEditAnnouncements(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
    
    /**
     * Can delete announcements (Admin only)
     */
    public static function canDeleteAnnouncements(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // SYSTEM SETTINGS PERMISSIONS
    // ========================
    
    /**
     * Can manage system settings (Admin only)
     */
    public static function canManageSettings(): bool {
        return self::getUserRole() === 'admin';
    }
    
    // ========================
    // UTILITY METHODS
    // ========================
    
    /**
     * Check if user is admin
     */
    public static function isAdmin(): bool {
        return self::getUserRole() === 'admin';
    }
    
    /**
     * Check if user is teacher
     */
    public static function isTeacher(): bool {
        return self::getUserRole() === 'teacher';
    }
    
    /**
     * Check if user is student
     */
    public static function isStudent(): bool {
        return self::getUserRole() === 'student';
    }
    
    /**
     * Check if user is admin or teacher
     */
    public static function isAdminOrTeacher(): bool {
        $role = self::getUserRole();
        return in_array($role, ['admin', 'teacher']);
    }
}
?>