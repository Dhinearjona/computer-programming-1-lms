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
            <?php if (Permission::isStudent()): ?>
            My Quizzes
            <?php else: ?>
            Quizzes Management
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
                                <?php if (Permission::isStudent()): ?>
                                Available Quizzes
                                <?php else: ?>
                                Quizzes List
                                <?php endif; ?>
                            </h5>
                            <div class="btn-group">
                                <?php if (Permission::canManageQuizzes()): ?>
                                <button type="button" class="btn btn-success" onclick="exportQuizzesData()">
                                    <i class="bi bi-download"></i> Export
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
                                        <?php if (!Permission::isStudent()): ?>
                                        <th>ID</th>
                                        <?php endif; ?>
                                        <th>Title</th>
                                        <th>Lesson</th>
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
                            <label for="lesson_id" class="form-label">Lesson <span class="text-danger">*</span></label>
                            <select class="form-control" id="lesson_id" name="lesson_id" required>
                                <option value="">Select Lesson</option>
                                <!-- Options will be populated via JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="title" class="form-label">Quiz Title <span
                                    class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="title" name="title" required>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="max_score" class="form-label">Max Score <span
                                    class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="max_score" name="max_score" value="100"
                                min="1" max="1000" required>
                        </div>
                        <div class="col-md-6">
                            <label for="time_limit_minutes" class="form-label">Time Limit (minutes)</label>
                            <input type="number" class="form-control" id="time_limit_minutes" name="time_limit_minutes"
                                min="1" max="300" placeholder="Optional">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveQuiz()">Submit</button>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<script>
    // Set current user role and permissions for JavaScript use
    window.currentUserRole = '<?php echo $userRole; ?>';
    window.canAddQuizzes = <?php echo Permission::canAddQuizzes() ? 'true' : 'false'; ?>;
    window.canEditQuizzes = <?php echo Permission::canEditQuizzes() ? 'true' : 'false'; ?>;
    window.canDeleteQuizzes = <?php echo Permission::canDeleteQuizzes() ? 'true' : 'false'; ?>;
    window.isStudent = <?php echo Permission::isStudent() ? 'true' : 'false'; ?>;
</script>

<?php require_once __DIR__ . '/components/footer.php'; ?>
</body>

</html>
