<?php
// Include Permissions class
require_once __DIR__ . '/../app/Permissions.php';

$pageName = basename($_SERVER['PHP_SELF']);

// Default collapsed
$navItems = [
    'index' => 'collapsed',
    'students' => 'collapsed',
    'teachers' => 'collapsed',
    'subjects' => 'collapsed',
    'lessons' => 'collapsed',
    'activities' => 'collapsed',
    'teacherActivities' => 'collapsed',
    'myActivities' => 'collapsed',
    'quizzes' => 'collapsed',
    'myQuizzes' => 'collapsed',
    'grades' => 'collapsed',
    'myGrades' => 'collapsed',
    'interventions' => 'collapsed',
    'announcements' => 'collapsed',
    'semester' => 'collapsed',
    'gradingPeriods' => 'collapsed',
    'settings' => 'collapsed',
];

// Mark active
$key = str_replace('.php', '', $pageName);
if (array_key_exists($key, $navItems)) {
    $navItems[$key] = '';
}
?>

<!-- ======= Sidebar ======= -->
<aside id="sidebar" class="sidebar">
    <ul class="sidebar-nav" id="sidebar-nav">

        <!-- Dashboard -->
        <li class="nav-item">
            <a class="nav-link <?= $navItems['index'] ?>" href="index.php">
                <i class="bi bi-grid"></i><span>Dashboard</span>
            </a>
        </li>

        <!-- ===================== -->
        <!-- ADMIN NAVIGATION -->
        <!-- ===================== -->
        <?php if (Permission::isAdmin()): ?>
        <li class="nav-heading">Academic Management</li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['students'] ?>" href="students.php">
                <i class="bi bi-people"></i><span>Students</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['teachers'] ?>" href="teachers.php">
                <i class="bi bi-person-workspace"></i><span>Teachers</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['subjects'] ?>" href="subjects.php">
                <i class="bi bi-book"></i><span>Subjects</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['lessons'] ?>" href="lessons.php">
                <i class="bi bi-journal-text"></i><span>Lessons</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['semester'] ?>" href="semester.php">
                <i class="bi bi-calendar3"></i><span>Semesters</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['gradingPeriods'] ?>" href="grading-periods.php">
                <i class="bi bi-calendar-week"></i><span>Grading Periods</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['activities'] ?>" href="activities.php">
                <i class="bi bi-file-earmark-text"></i><span>Activities</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['quizzes'] ?>" href="quizzes.php">
                <i class="bi bi-question-circle"></i><span>Quizzes</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['grades'] ?>" href="grades.php">
                <i class="bi bi-trophy"></i><span>Grades</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['interventions'] ?>" href="interventions.php">
                <i class="bi bi-heart-pulse"></i><span>Interventions</span>
            </a>
        </li>
        <?php endif; ?>

        <!-- ===================== -->
        <!-- TEACHER NAVIGATION -->
        <!-- ===================== -->
        <?php if (Permission::isTeacher()): ?>
        <li class="nav-heading">My Class (Computer Programming 1)</li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['students'] ?>" href="students.php">
                <i class="bi bi-people"></i><span>My Students</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['lessons'] ?>" href="lessons.php">
                <i class="bi bi-journal-text"></i><span>Lessons</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['activities'] ?>" href="activities.php">
                <i class="bi bi-file-earmark-text"></i><span>Activities</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['teacherActivities'] ?>" href="teacher-activities.php">
                <i class="bi bi-clipboard-check"></i><span>Student Submissions</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['quizzes'] ?>" href="quizzes.php">
                <i class="bi bi-question-circle"></i><span>Quizzes</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['grades'] ?>" href="grades.php">
                <i class="bi bi-trophy"></i><span>Grades</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['interventions'] ?>" href="interventions.php">
                <i class="bi bi-heart-pulse"></i><span>Interventions</span>
            </a>
        </li>
        <?php endif; ?>

        <!-- ===================== -->
        <!-- STUDENT NAVIGATION -->
        <!-- ===================== -->
        <?php if (Permission::isStudent()): ?>
        <li class="nav-heading">Computer Programming 1</li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['lessons'] ?>" href="lessons.php">
                <i class="bi bi-journal-text"></i><span>Lessons</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['myActivities'] ?>" href="my-activities.php">
                <i class="bi bi-file-earmark-text"></i><span>My Activities</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['myQuizzes'] ?>" href="my-quizzes.php">
                <i class="bi bi-pencil-square"></i><span>My Quizzes</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['myGrades'] ?>" href="grades.php">
                <i class="bi bi-award"></i><span>My Grades</span>
            </a>
        </li>
        <?php endif; ?>

        <!-- Common Nav -->
        <li class="nav-heading">General</li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['announcements'] ?>" href="announcement.php">
                <i class="bi bi-megaphone"></i><span>Announcements</span>
            </a>
        </li>

        <?php if (Permission::canManageSettings()): ?>
        <li class="nav-item">
            <a class="nav-link <?= $navItems['settings'] ?>" href="settings.php">
                <i class="bi bi-gear"></i><span>Settings</span>
            </a>
        </li>
        <?php endif; ?>
    </ul>
</aside>
<!-- End Sidebar -->
