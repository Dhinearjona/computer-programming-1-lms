<?php
// Include Permissions class
require_once __DIR__ . '/../app/Permissions.php';

$pageName = basename($_SERVER['PHP_SELF']);

// Initialize all menu items as collapsed
$index = 'collapsed';
$activities = 'collapsed';
$myActivities = 'collapsed';
$myQuizzes = 'collapsed';
$myGrades = 'collapsed';
$quizzes = 'collapsed';
$students = 'collapsed';
$teachers = 'collapsed';
$subjects = 'collapsed';
$lessons = 'collapsed';
$grades = 'collapsed';
$interventions = 'collapsed';
$announcements = 'collapsed';
$reports = 'collapsed';
$settings = 'collapsed';

// Set active page
if ($pageName == 'index.php') {
    $index = '';
} elseif ($pageName == 'activities.php') {
    $activities = '';
} elseif ($pageName == 'my-activities.php') {
    $myActivities = '';
} elseif ($pageName == 'my-quizzes.php') {
    $myQuizzes = '';
} elseif ($pageName == 'quizzes.php') {
    $quizzes = '';
} elseif ($pageName == 'students.php') {
    $students = '';
} elseif ($pageName == 'teachers.php') {
    $teachers = '';
} elseif ($pageName == 'subjects.php') {
    $subjects = '';
} elseif ($pageName == 'lessons.php') {
    $lessons = '';
} elseif ($pageName == 'grades.php') {
    // Check if user is student to set myGrades, otherwise set grades
    if (Permission::isStudent()) {
        $myGrades = '';
    } else {
        $grades = '';
    }
} elseif ($pageName == 'interventions.php') {
    $interventions = '';
} elseif ($pageName == 'announcement.php') {
    $announcements = '';
} elseif ($pageName == 'reports.php') {
    $reports = '';
} elseif ($pageName == 'settings.php') {
    $settings = '';
}
?>

<!-- ======= Sidebar ======= -->
<aside id="sidebar" class="sidebar">

    <ul class="sidebar-nav" id="sidebar-nav">

        <!-- Dashboard -->
        <li class="nav-item">
            <a class="nav-link <?php echo $index; ?>" href="index.php">
                <i class="bi bi-grid"></i>
                <span>Dashboard</span>
            </a>
        </li><!-- End Dashboard Nav -->

        <!-- Computer Programming 1 Section -->
        <?php if (Permission::isAdminOrTeacher()): ?>
        <li class="nav-heading">Computer Programming 1</li>
        <?php endif; ?>

        <!-- Activities Management -->
        <?php if (Permission::canManageActivities()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $activities; ?>" href="activities.php">
                <i class="bi bi-file-earmark-text"></i>
                <span>Activities</span>
            </a>
        </li><!-- End Activities Nav -->
        <?php endif; ?>

        <!-- Quizzes Management -->
        <?php if (Permission::canManageQuizzes()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $quizzes; ?>" href="quizzes.php">
                <i class="bi bi-question-circle"></i>
                <span>Quizzes</span>
            </a>
        </li><!-- End Quizzes Nav -->
        <?php endif; ?>

        <!-- Advisory Teacher Section -->
        <?php if (Permission::isTeacher()): ?>
        <li class="nav-heading">Advisory Teacher</li>
        <li class="nav-item">
            <a class="nav-link <?php echo $students; ?>" href="students.php">
                <i class="bi bi-people"></i>
                <span>My Students (1st Year BSIT)</span>
            </a>
        </li><!-- End My Students Nav -->
        <?php endif; ?>

        <!-- Students Management (Admin only) -->
        <?php if (Permission::canManageStudents() && Permission::isAdmin()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $students; ?>" href="students.php">
                <i class="bi bi-people"></i>
                <span>All Students</span>
            </a>
        </li><!-- End All Students Nav -->
        <?php endif; ?>

        <!-- Teachers Management -->
        <?php if (Permission::canManageUsers()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $teachers; ?>" href="teachers.php">
                <i class="bi bi-person-workspace"></i>
                <span>Teachers</span>
            </a>
        </li><!-- End Teachers Nav -->
        <?php endif; ?>

        <!-- Lessons Management (Computer Programming 1) -->
        <?php if (Permission::isAdminOrTeacher()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $lessons; ?>" href="lessons.php">
                <i class="bi bi-journal-text"></i>
                <span>Lessons</span>
            </a>
        </li><!-- End Lessons Nav -->
        <?php endif; ?>

        <!-- Grades Management -->
        <?php if (Permission::canManageGrades()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $grades; ?>" href="grades.php">
                <i class="bi bi-trophy"></i>
                <span>Grades</span>
            </a>
        </li><!-- End Grades Nav -->
        <?php endif; ?>

        <!-- My Grades (Student only) -->
        <?php if (Permission::canViewOwnGrades()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $myGrades; ?>" href="grades.php">
                <i class="bi bi-award"></i>
                <span>My Grades</span>
            </a>
        </li><!-- End My Grades Nav -->
        <?php endif; ?>

        <!-- Student-specific navigation (1st Year BSIT) -->
        <?php if (Permission::isStudent()): ?>
        <li class="nav-heading">Computer Programming 1</li>
        <li class="nav-item">
            <a class="nav-link <?php echo $myActivities; ?>" href="my-activities.php">
                <i class="bi bi-file-earmark-text"></i>
                <span>My Activities</span>
            </a>
        </li><!-- End My Activities Nav -->
        
        <li class="nav-item">
            <a class="nav-link <?php echo $myQuizzes; ?>" href="my-quizzes.php">
                <i class="bi bi-pencil-square"></i>
                <span>My Quizzes</span>
            </a>
        </li><!-- End My Quizzes Nav -->
        <?php endif; ?>

        <!-- Interventions -->
        <?php if (Permission::canManageInterventions()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $interventions; ?>" href="interventions.php">
                <i class="bi bi-heart-pulse"></i>
                <span>Interventions</span>
            </a>
        </li><!-- End Interventions Nav -->
        <?php endif; ?>

        <!-- Announcements -->
        <li class="nav-item">
            <a class="nav-link <?php echo $announcements; ?>" href="announcement.php">
                <i class="bi bi-megaphone"></i>
                <span>Announcements</span>
            </a>
        </li><!-- End Announcements Nav -->

        <!-- Reports -->
        <li class="nav-item">
            <a class="nav-link <?php echo $reports; ?>" href="reports.php">
                <i class="bi bi-graph-up"></i>
                <span>Reports</span>
            </a>
        </li><!-- End Reports Nav -->

        <!-- System Settings -->
        <?php if (Permission::canManageSettings()): ?>
        <li class="nav-item">
            <a class="nav-link <?php echo $settings; ?>" href="settings.php">
                <i class="bi bi-gear"></i>
                <span>Settings</span>
            </a>
        </li><!-- End Settings Nav -->
        <?php endif; ?>
    </ul>
</aside><!-- End Sidebar-->
