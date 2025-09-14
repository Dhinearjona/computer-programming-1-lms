<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Check if logged in
if (!isset($_SESSION['user']) || empty($_SESSION['user'])) {
    header('Location: login.php');
    exit();
}

// Get user information
$user = $_SESSION['user'];
$userRole = $user['role'];
$username = $user['first_name'] . ' ' . $user['last_name'];

// Include Permissions class
require_once __DIR__ . '/app/Permissions.php';

// Check if user has permission to view quizzes
// All roles can view quizzes, but only admin/teacher can manage them
if (!Permission::canManageQuizzes() && !Permission::isStudent()) {
    header('Location: index.php');
    exit();
}

// Include layout components
require_once __DIR__ . '/components/header.php';
require_once __DIR__ . '/components/topNav.php';
require_once __DIR__ . '/components/sideNav.php';
?>

<main id="main" class="main">
    <div class="pagetitle">
        <h1>
            <?php if (Permission::isAdmin()): ?>
            Quizzes Management
            <?php elseif (Permission::isTeacher()): ?>
            My Quizzes Management
            <?php elseif (Permission::isStudent()): ?>
            Quizzes
            <?php endif; ?>
        </h1>
        <nav>
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php">Home</a></li>
                <li class="breadcrumb-item active">Quizzes</li>
            </ol>
        </nav>
    </div>

    <section class="section">
        <div class="row">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title">
                                <?php if (Permission::isAdmin()): ?>
                                All Quizzes List
                                <?php elseif (Permission::isTeacher()): ?>
                                My Quizzes List
                                <?php elseif (Permission::isStudent()): ?>
                                Available Quizzes
                                <?php endif; ?>
                            </h5>
                            <div class="btn-group gap-2">
                                <button type="button" class="btn btn-outline-info" onclick="refreshQuizzesTable()"
                                    title="Refresh">
                                    <i class="bi bi-arrow-clockwise"></i> Refresh
                                </button>
                                <?php if (Permission::canManageQuizzes()): ?>
                                <button type="button" class="btn btn-outline-success" onclick="exportQuizzesData()"
                                    title="Export Data">
                                    <i class="bi bi-download"></i>
                                </button>
                                <?php if (Permission::canAddQuizzes()): ?>
                                <button type="button" class="btn btn-primary" data-bs-toggle="modal"
                                    data-bs-target="#quizModal">
                                    Add New Quiz
                                </button>
                                <?php endif; ?>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- DataTable -->
                        <div class="table-responsive">
                            <table class="table table-striped" id="quizzesTable">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Lesson</th>
                                        <th>Grading Period</th>
                                        <th>Max Score</th>
                                        <th>Time Limit</th>
                                        <th>Created</th>
                                        <th>Status</th>
                                        <?php if (Permission::canManageQuizzes()): ?>
                                        <th>Actions</th>
                                        <?php endif; ?>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Quiz Modal -->
<?php if (Permission::canAddQuizzes()): ?>
<div class="modal fade" id="quizModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">Add New Quiz</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="quizForm">
                    <input type="hidden" id="quizId" name="id">
                    <input type="hidden" name="action" id="formAction" value="create_quiz">

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="lesson_id" class="form-label">
                                <i class="bi bi-book"></i> Lesson <span class="text-danger">*</span>
                            </label>
                            <select class="form-control" id="lesson_id" name="lesson_id" required>
                                <option value="">Select Lesson</option>
                                <!-- Options will be populated via JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="grading_period_id" class="form-label">
                                <i class="bi bi-calendar-check"></i> Grading Period <span class="text-danger">*</span>
                            </label>
                            <select class="form-control" id="grading_period_id" name="grading_period_id" required>
                                <option value="">Select Grading Period</option>
                                <!-- Options will be populated via JavaScript -->
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="title" class="form-label">
                            <i class="bi bi-card-heading"></i> Quiz Title <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" id="title" name="title"
                            placeholder="Enter quiz title..." required>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="max_score" class="form-label">
                                <i class="bi bi-trophy"></i> Max Score <span class="text-danger">*</span>
                            </label>
                            <input type="number" class="form-control" id="max_score" name="max_score" value="100"
                                min="1" max="1000" placeholder="100" required>
                        </div>
                        <div class="col-md-6">
                            <label for="time_limit_minutes" class="form-label">
                                <i class="bi bi-clock"></i> Time Limit (minutes)
                            </label>
                            <input type="number" class="form-control" id="time_limit_minutes"
                                name="time_limit_minutes" min="1" max="300" placeholder="Optional">
                        </div>
                    </div>

                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle"></i> Quiz Guidelines</h6>
                        <ul class="mb-0">
                            <li>Choose appropriate lesson and grading period</li>
                            <li>Set reasonable time limits for students</li>
                            <li>Use clear and descriptive quiz titles</li>
                            <li>Consider the difficulty level when setting max score</li>
                        </ul>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary" onclick="saveQuiz()">
                    <span id="submitButtonText">Submit</span>
                </button>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- Quiz Details Modal -->
<div class="modal fade" id="quizDetailsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="quizDetailsModalTitle">
                    <i class="bi bi-info-circle"></i> Quiz Details
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="quizDetailsContent">
                    <!-- Content will be populated by JavaScript -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Vendor JS Files -->
<script src="assets/vendor/apexcharts/apexcharts.min.js"></script>
<script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="assets/vendor/chart.js/chart.umd.js"></script>
<script src="assets/vendor/echarts/echarts.min.js"></script>
<script src="assets/vendor/simple-datatables/simple-datatables.js"></script>
<script src="assets/vendor/tinymce/tinymce.min.js"></script>
<script src="assets/vendor/php-email-form/validate.js"></script>

<!-- Template Main JS File -->
<script src="assets/js/main.js"></script>

<!-- jQuery -->
<script src="assets/jquery/jquery-3.7.1.min.js"></script>

<!-- DataTables JS -->
<script src="assets/js/dataTables/dataTables.js"></script>
<script src="assets/js/dataTables/dataTables.bootstrap5.js"></script>

<!-- SweetAlert2 JS -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Quizzes DataTables JS -->
<script src="assets/js/dataTables/quizzesDataTables.js"></script>

<!-- Pass permissions to JavaScript -->
<script>
    window.currentUserRole = '<?php echo $userRole; ?>';
    window.canManageQuizzes = <?php echo Permission::canManageQuizzes() ? 'true' : 'false'; ?>;
    window.canAddQuizzes = <?php echo Permission::canAddQuizzes() ? 'true' : 'false'; ?>;
    window.canEditQuizzes = <?php echo Permission::canEditQuizzes() ? 'true' : 'false'; ?>;
    window.canDeleteQuizzes = <?php echo Permission::canDeleteQuizzes() ? 'true' : 'false'; ?>;
    window.isAdmin = <?php echo Permission::isAdmin() ? 'true' : 'false'; ?>;
    window.isTeacher = <?php echo Permission::isTeacher() ? 'true' : 'false'; ?>;
    window.isStudent = <?php echo Permission::isStudent() ? 'true' : 'false'; ?>;
    window.userId = <?php echo $user['id']; ?>;
</script>

<?php require_once __DIR__ . '/components/footer.php'; ?>
</body>

</html>
