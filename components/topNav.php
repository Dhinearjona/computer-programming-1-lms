<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Get user information and student details if applicable
$userInfo = $_SESSION['user'] ?? null;
$studentInfo = null;

if ($userInfo && $userInfo['role'] === 'student') {
    // Get student information from database
    require_once __DIR__ . '/../app/Db.php';
    try {
        $pdo = Db::getConnection();
        $stmt = $pdo->prepare("
            SELECT s.*, u.first_name, u.last_name, u.email 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.id = ?
        ");
        $stmt->execute([$userInfo['id']]);
        $studentInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // Handle error silently
        $studentInfo = null;
    }
}
?>

<header id="header" class="header fixed-top d-flex align-items-center">
    <div class="d-flex align-items-center justify-content-between">
        <a href="index.php" class="logo d-flex align-items-center">
            <span class="d-lg-block fs-4">Student Evaluation</span>
        </a>
        <i class="bi bi-list toggle-sidebar-btn d-lg-none" id="mobileMenuBtn"></i>
    </div>

    <nav class="header-nav ms-auto d-flex justify-content-center align-items-center">
        <ul class="d-flex align-items-center">
            <li class="nav-item dropdown pe-3">
                <a class="nav-link nav-profile d-flex align-items-center tx-base-color pe-0 ps-2 dropdown-toggle"
                    href="#" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle fs-1"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end profile me-3">
                    <li class="dropdown-header text-start">
                        <h6><b><?php 
                            if ($studentInfo) {
                                echo htmlspecialchars($studentInfo['first_name'] . ' ' . $studentInfo['last_name']);
                            } elseif (isset($_SESSION['user']['first_name']) && isset($_SESSION['user']['last_name'])) {
                                echo htmlspecialchars($_SESSION['user']['first_name'] . ' ' . $_SESSION['user']['last_name']);
                            } else {
                                echo 'User';
                            }
                        ?></b></h6>
                        <span><?php 
                            if ($studentInfo) {
                                echo htmlspecialchars($studentInfo['course'] . ' • ' . $studentInfo['year_level']);
                            } elseif (isset($_SESSION['user']['role'])) {
                                echo ucfirst($_SESSION['user']['role']);
                            } else {
                                echo 'User';
                            }
                        ?></span>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>

                    <li>
                        <?php if ($studentInfo): ?>
                        <a class="dropdown-item d-flex align-items-center" href="grades.php">
                            <i class="bi bi-award"></i>
                            <span>My Grades</span>
                        </a>
                        <?php else: ?>
                        <a class="dropdown-item d-flex align-items-center" href="javascript:void(0)"
                            onclick="commingSoon()">
                            <i class="bi bi-gear"></i>
                            <span>My Account</span>
                        </a>
                        <?php endif; ?>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>

                    <li>
                        <a class="dropdown-item d-flex align-items-center" href="javascript:void(0)"
                            onclick="commingSoon()">
                            <i class="bi bi-question-circle"></i>
                            <span>Support Center</span>
                        </a>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>

                    <li>
                        <a class="dropdown-item d-flex align-items-center" href="javascript:void(0)"
                            onclick="clearSession()">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Sign Out</span>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>
</header>
