<!-- jQuery (required) -->
<script src="assets/vendor/jquery/js/jquery-3.7.1.min.js"></script>

<!-- jQuery UI (autocomplete, datepicker, etc.) -->
<script src="assets/vendor/jquery/jquery-ui.min.js"></script>

<!-- Vendor JS -->
<script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="assets/vendor/apexcharts/apexcharts.min.js"></script>
<script src="assets/vendor/chart.js/chart.umd.js"></script>
<script src="assets/vendor/echarts/echarts.min.js"></script>
<script src="assets/vendor/quill/quill.js"></script>
<script src="assets/vendor/simple-datatables/simple-datatables.js"></script>

<!-- Utilities -->
<script src="assets/js/moment/moment.min.js"></script>
<script src="assets/toastr/js/toastr.min.js"></script>
<script src="assets/toastr/js/option.js"></script>
<script src="assets/js/utils/helpers.js"></script>

<!-- DataTables -->
<script src="assets/js/dataTables/dataTables.js" defer></script>
<script src="assets/js/dataTables/dataTables.bootstrap5.js" defer></script>
<script src="assets/js/dataTables/datatables-common.js" defer></script>
<script src="assets/js/dataTables/activitiesDataTables.js" defer></script>
<script src="assets/js/dataTables/quizzesDataTables.js" defer></script>
<script src="assets/js/dataTables/studentsDataTables.js" defer></script>
<script src="assets/js/dataTables/gradesDataTables.js" defer></script>
<script src="assets/js/dataTables/announcementsDataTables.js" defer></script>
<script src="assets/js/dataTables/interventionsDataTables.js" defer></script>
<script src="assets/js/dataTables/teachersDataTables.js" defer></script>
<script src="assets/js/dataTables/lessonsDataTables.js" defer></script>
<script src="assets/js/dataTables/myActivitiesDataTables.js" defer></script>
<script src="assets/js/dataTables/quizSubmissionsDataTables.js" defer></script>
<script src="assets/js/dataTables/examSubmissionsDataTables.js" defer></script>
<script src="assets/js/dataTables/myQuizzesDataTables.js" defer></script>
<script src="assets/js/dataTables/gradingPeriodsDataTables.js" defer></script>
<script src="assets/js/dataTables/semestersDataTables.js" defer></script>
<script src="assets/js/dataTables/subjectsDataTables.js" defer></script>

<!-- Main Template -->
<script src="assets/js/main.js" defer></script>

<script>
    $(document).ready(function() {
        // Initialize dropdowns after DOM ready
        setTimeout(() => {
            document.querySelectorAll('.dropdown-toggle').forEach(el => {
                new bootstrap.Dropdown(el);
            });
        }, 100);

        // Mobile sidebar toggle
        $('#mobileMenuBtn').on('click', () => {
            $('#sidebar').toggleClass('sidebar-show');
            $('body').toggleClass('sidebar-open');
        });

        // Close sidebar when clicking outside (mobile only)
        $(document).on('click', (e) => {
            if ($(window).width() < 992 && !$(e.target).closest('#sidebar, #mobileMenuBtn').length) {
                $('#sidebar').removeClass('sidebar-show');
                $('body').removeClass('sidebar-open');
            }
        });

        // Manual dropdown toggle (fallback)
        $(document).on('click', '.nav-profile', function(e) {
            e.preventDefault();
            $(this).next('.dropdown-menu').toggleClass('show');
        });

        // Re-init dropdowns on window load
        $(window).on('load', () => {
            setTimeout(() => {
                document.querySelectorAll('.dropdown-toggle:not(.dropdown-initialized)')
                    .forEach(el => {
                        new bootstrap.Dropdown(el);
                        el.classList.add('dropdown-initialized');
                    });
            }, 200);
        });
    });

    // Logout confirmation
    function clearSession() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Sign Out',
                text: 'Are you sure you want to sign out?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Sign Out',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: 'btn btn-danger',
                    cancelButton: 'btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'logout.php';
                }
            });
        } else {
            if (confirm('Are you sure you want to sign out?')) {
                window.location.href = 'logout.php';
            }
        }
    }

    // Placeholder for upcoming features
    function commingSoon() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Almost There!',
                text: "We're working on this feature.",
                icon: 'info',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-primary'
                },
                buttonsStyling: false
            });
        }
    }
</script>

<?php if (session_status() === PHP_SESSION_NONE) {
    session_start();
} ?>
<?php if (!empty($_SESSION['idAccount'])): ?>
<script>
    // Mark this tab as authenticated without forcing navigation
    try {
        sessionStorage.setItem('loggedIn', '1');
        sessionStorage.removeItem('loggedOut');
    } catch (e) {}

    // Handle BFCache restore: if user logged out in this tab, bounce to login
    window.addEventListener('pageshow', (evt) => {
        if (!evt.persisted) return;
        try {
            if (sessionStorage.getItem('loggedOut') === '1') {
                window.location.replace('login.php');
            } else {
                sessionStorage.setItem('loggedIn', '1');
                sessionStorage.removeItem('loggedOut');
            }
        } catch (e) {}
    });
</script>
<?php endif; ?>
