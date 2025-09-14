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

// Check if user can view their own activities
if (!Permission::canViewOwnActivities()) {
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
        <h1>My Activities</h1>
        <nav>
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php">Home</a></li>
                <li class="breadcrumb-item active">My Activities</li>
            </ol>
        </nav>
    </div>

    <section class="section">
        <div class="row">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title">My Activities List</h5>
                            <div class="btn-group">
                                <button type="button" class="btn btn-outline-info" onclick="refreshActivitiesTable()"
                                    title="Refresh">
                                    <i class="bi bi-arrow-clockwise"></i> Refresh
                                </button>
                            </div>
                        </div>

                        <!-- DataTable -->
                        <div class="table-responsive">
                            <table class="table table-striped" id="myActivitiesTable">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Description</th>
                                        <th>Due Date</th>
                                        <th>Grading Period</th>
                                        <th>Submission Status</th>
                                        <th>Grade</th>
                                        <th>Actions</th>
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

<!-- Activity Details Modal -->
<div class="modal fade" id="activityDetailsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="activityDetailsTitle">Activity Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="activityDetailsContent">
                    <!-- Activity details will be loaded here -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Submission Modal -->
<div class="modal fade" id="submissionModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="submissionModalTitle">Submit Activity</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="submissionForm">
                    <input type="hidden" id="submissionActivityId" name="activity_id">
                    <input type="hidden" id="submissionAction" name="action" value="submit_activity">

                    <!-- Activity Info Display -->
                    <div class="mb-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-title" id="submissionActivityTitle">Activity Title</h6>
                                <p class="card-text" id="submissionActivityDescription">Activity Description</p>
                                <small class="text-muted">
                                    <strong>Due Date:</strong> <span id="submissionDueDate"></span>
                                </small>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="submissionLink" class="form-label">
                            Submission Link <span class="text-danger">*</span>
                        </label>
                        <input type="url" class="form-control" id="submissionLink" name="submission_link"
                            placeholder="https://drive.google.com/file/d/..." required>

                    </div>

                    <div class="mb-3">
                        <label for="submissionText" class="form-label">
                            Additional Notes (Optional)
                        </label>
                        <textarea class="form-control" id="submissionText" name="submission_text" rows="3"
                            placeholder="Add any additional notes or comments about your submission..."></textarea>
                    </div>

                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        <strong>Note:</strong> You can submit and update your work until the due date.
                        Make sure your link is accessible and contains your completed work.
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="submitActivityForm()">
                    Submit
                </button>
            </div>
        </div>
    </div>
</div>

<!-- SweetAlert2 JS -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Pass permissions to JavaScript -->
<script>
    window.currentUserRole = '<?php echo $userRole; ?>';
    window.isStudent = <?php echo Permission::isStudent() ? 'true' : 'false'; ?>;
    window.canViewOwnActivities = <?php echo Permission::canViewOwnActivities() ? 'true' : 'false'; ?>;
    window.canSubmitActivities = <?php echo Permission::canSubmitActivities() ? 'true' : 'false'; ?>;
    window.userId = <?php echo $user['id']; ?>;
</script>

<?php require_once __DIR__ . '/components/footer.php'; ?>
</body>

</html>
