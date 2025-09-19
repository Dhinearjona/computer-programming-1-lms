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
    'my-activities-prelim' => 'collapsed',
    'my-activities-midterm' => 'collapsed',
    'my-activities-finals' => 'collapsed',
    'quizzes' => 'collapsed',
    'quizzes-submissions' => 'collapsed',
    'exam-submissions' => 'collapsed',
    'myQuizzes' => 'collapsed',
    'my-quizzes-prelim' => 'collapsed',
    'my-quizzes-midterm' => 'collapsed',
    'my-quizzes-finals' => 'collapsed',
    'exam' => 'collapsed',
    'myExams' => 'collapsed',
    'my-exams-prelim' => 'collapsed',
    'my-exams-midterm' => 'collapsed',
    'my-exams-finals' => 'collapsed',
    'grades' => 'collapsed',
    'myGrades' => 'collapsed',
    'interventions' => 'collapsed',
    'announcements' => 'collapsed',
    'semester' => 'collapsed',
    'gradingPeriods' => 'collapsed',
    'attendance' => 'collapsed',
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
            <a class="nav-link <?= $navItems['quizzes-submissions'] ?>" href="quizzes-submissions.php">
                <i class="bi bi-clipboard-data"></i><span>Quiz Submissions</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['exam'] ?>" href="exam.php">
                <i class="bi bi-file-earmark-check"></i><span>Exams</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['exam-submissions'] ?>" href="exam-submissions.php">
                <i class="bi bi-clipboard-check"></i><span>Exam Submissions</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['attendance'] ?>" href="attendance.php">
                <i class="bi bi-calendar-check"></i><span>Attendance</span>
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
            <a class="nav-link <?= $navItems['quizzes-submissions'] ?>" href="quizzes-submissions.php">
                <i class="bi bi-clipboard-data"></i><span>Quiz Submissions</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['exam'] ?>" href="exam.php">
                <i class="bi bi-file-earmark-check"></i><span>Exams</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['exam-submissions'] ?>" href="exam-submissions.php">
                <i class="bi bi-clipboard-check"></i><span>Exam Submissions</span>
            </a>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['attendance'] ?>" href="attendance.php">
                <i class="bi bi-calendar-check"></i><span>Attendance</span>
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
            <a class="nav-link <?= $navItems['myActivities'] ?>" data-bs-toggle="collapse" href="#myActivitiesNav" role="button" aria-expanded="false" aria-controls="myActivitiesNav">
                <i class="bi bi-file-earmark-text"></i><span>My Activities</span><i class="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="myActivitiesNav" class="nav-content collapse <?= $navItems['myActivities'] === '' ? 'show' : '' ?>">
                <li>
                    <a href="my-activities.php" class="<?= $pageName === 'my-activities.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>All Activities</span>
                    </a>
                </li>
                <li>
                    <a href="my-activities-prelim.php" class="<?= $pageName === 'my-activities-prelim.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Prelim</span>
                    </a>
                </li>
                <li>
                    <a href="my-activities-midterm.php" class="<?= $pageName === 'my-activities-midterm.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Midterm</span>
                    </a>
                </li>
                <li>
                    <a href="my-activities-finals.php" class="<?= $pageName === 'my-activities-finals.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Finals</span>
                    </a>
                </li>
            </ul>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['myQuizzes'] ?>" data-bs-toggle="collapse" href="#myQuizzesNav" role="button" aria-expanded="false" aria-controls="myQuizzesNav">
                <i class="bi bi-pencil-square"></i><span>My Quizzes</span><i class="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="myQuizzesNav" class="nav-content collapse <?= $navItems['myQuizzes'] === '' ? 'show' : '' ?>">
                <li>
                    <a href="my-quizzes.php" class="<?= $pageName === 'my-quizzes.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>All Quizzes</span>
                    </a>
                </li>
                <li>
                    <a href="my-quizzes-prelim.php" class="<?= $pageName === 'my-quizzes-prelim.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Prelim</span>
                    </a>
                </li>
                <li>
                    <a href="my-quizzes-midterm.php" class="<?= $pageName === 'my-quizzes-midterm.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Midterm</span>
                    </a>
                </li>
                <li>
                    <a href="my-quizzes-finals.php" class="<?= $pageName === 'my-quizzes-finals.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Finals</span>
                    </a>
                </li>
            </ul>
        </li>

        <li class="nav-item">
            <a class="nav-link <?= $navItems['myExams'] ?>" data-bs-toggle="collapse" href="#myExamsNav" role="button" aria-expanded="false" aria-controls="myExamsNav">
                <i class="bi bi-file-earmark-check"></i><span>My Exams</span><i class="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="myExamsNav" class="nav-content collapse <?= $navItems['myExams'] === '' ? 'show' : '' ?>">
                <li>
                    <a href="my-exams.php" class="<?= $pageName === 'my-exams.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>All Exams</span>
                    </a>
                </li>
                <li>
                    <a href="my-exams-prelim.php" class="<?= $pageName === 'my-exams-prelim.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Prelim</span>
                    </a>
                </li>
                <li>
                    <a href="my-exams-midterm.php" class="<?= $pageName === 'my-exams-midterm.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Midterm</span>
                    </a>
                </li>
                <li>
                    <a href="my-exams-finals.php" class="<?= $pageName === 'my-exams-finals.php' ? 'active' : '' ?>">
                        <i class="bi bi-circle"></i><span>Finals</span>
                    </a>
                </li>
            </ul>
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
