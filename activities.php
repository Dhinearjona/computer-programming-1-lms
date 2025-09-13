<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

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

// Check if user has permission to view activities
if (!Permission::canManageActivities() && !Permission::isStudent()) {
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
            <?php if (Permission::isTeacher()): ?>
            My Activities Management
            <?php elseif (Permission::isStudent()): ?>
            Activities
            <?php else: ?>
            Activities Management
            <?php endif; ?>
        </h1>
        <nav>
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php">Home</a></li>
                <li class="breadcrumb-item active">Activities</li>
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
                                <?php if (Permission::isTeacher()): ?>
                                My Activities List
                                <?php elseif (Permission::isStudent()): ?>
                                Available Activities
                                <?php else: ?>
                                Activities List
                                <?php endif; ?>
                            </h5>
                            <?php if (Permission::canAddActivities()): ?>
                            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#activityModal">
                                Add New Activity
                            </button>
                            <?php endif; ?>
                        </div>

                        <!-- DataTable -->
                        <div class="table-responsive">
                            <table class="table table-striped" id="activitiesTable">
                                <thead>
                                    <tr>
                                        <?php if (!Permission::isStudent()): ?>
                                        <th>ID</th>
                                        <?php endif; ?>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <?php if (Permission::canManageActivities()): ?>
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

<!-- Activity Modal -->
<?php if (Permission::canAddActivities()): ?>
<div class="modal fade" id="activityModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">Add New Activity</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="activityForm">
                    <input type="hidden" id="activityId" name="id">
                    <input type="hidden" name="action" id="formAction" value="create_activity">

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="subject_id" class="form-label">Subject <span class="text-danger">*</span></label>
                            <select class="form-control" id="subject_id" name="subject_id" required>
                                <option value="">Select Subject</option>
                                <!-- Options will be populated via JavaScript -->
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="title" class="form-label">Activity Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="title" name="title" required>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="description" class="form-label">Description <span class="text-danger">*</span></label>
                        <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label for="allow_from" class="form-label">Allow From <span class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="allow_from" name="allow_from" required>
                        </div>
                        <div class="col-md-4">
                            <label for="due_date" class="form-label">Due Date <span class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="due_date" name="due_date" required>
                        </div>
                        <div class="col-md-4">
                            <label for="cutoff_date" class="form-label">Cutoff Date</label>
                            <input type="date" class="form-control" id="cutoff_date" name="cutoff_date">
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="reminder_date" class="form-label">Reminder Date</label>
                            <input type="date" class="form-control" id="reminder_date" name="reminder_date">
                        </div>
                        <div class="col-md-6">
                            <label for="deduction_percent" class="form-label">Deduction Percent</label>
                            <input type="number" class="form-control" id="deduction_percent" name="deduction_percent" 
                                   min="0" max="100" step="0.01" placeholder="0.00">
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="missed">Missed</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveActivity()">Submit</button>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<script>
// Set current user role and permissions for JavaScript use
window.currentUserRole = '<?php echo $userRole; ?>';
window.canAddActivities = <?php echo Permission::canAddActivities() ? 'true' : 'false'; ?>;
window.canEditActivities = <?php echo Permission::canEditActivities() ? 'true' : 'false'; ?>;
window.canDeleteActivities = <?php echo Permission::canDeleteActivities() ? 'true' : 'false'; ?>;
window.isStudent = <?php echo Permission::isStudent() ? 'true' : 'false'; ?>;
</script>

<?php require_once __DIR__ . '/components/footer.php'; ?>

</body>

</html>
</html>