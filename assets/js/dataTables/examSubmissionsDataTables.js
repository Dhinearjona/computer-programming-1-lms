/**
 * Exam Submissions DataTables Configuration and Functions
 */

// Global variables - use window object to avoid redeclaration
window.examSubmissionsTable = window.examSubmissionsTable || null;

$(document).ready(function() {
    initializeExamSubmissionsTable();
    setupExamModalEvents();
});


/**
 * Initialize Exam Submissions DataTable
 */
function initializeExamSubmissionsTable() {
    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable('#examSubmissionsTable')) {
        $('#examSubmissionsTable').DataTable().destroy();
    }
    
    window.examSubmissionsTable = $('#examSubmissionsTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiExamSubmissions.php?action=datatable",
            "type": "GET",
            "data": function(d) {
                const gradingPeriodEl = document.getElementById('examSubmissionsGradingPeriodFilter');
                const statusEl = document.getElementById('examSubmissionsStatusFilter');
                const gradingPeriod = gradingPeriodEl ? gradingPeriodEl.value : '';
                const status = statusEl ? statusEl.value : '';
                
                console.log('Exam Submissions DataTable - Sending filters:', {
                    grading_period: gradingPeriod,
                    status: status,
                    gradingPeriodElementFound: !!gradingPeriodEl,
                    statusElementFound: !!statusEl
                });
                
                if (gradingPeriod && gradingPeriod !== '') {
                    d.grading_period = gradingPeriod;
                }
                if (status && status !== '') {
                    d.status = status;
                }
                
                return d;
            },
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                console.error('Response:', xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load exam submissions data.'
                });
            }
        },
        "columns": [
            { "data": "student_name", "width": "18%" },
            { "data": "exam_title", "width": "20%" },
            { "data": "subject_name", "width": "12%" },
            { "data": "grading_period", "width": "10%" },
            { "data": "score", "width": "12%", "className": "text-center" },
            { "data": "status", "width": "10%", "className": "text-center", "orderable": false },
            { "data": "submitted_at", "width": "13%" },
            { "data": "actions", "width": "10%", "className": "text-center", "orderable": false }
        ],
        "order": [[6, "desc"]], // Sort by submitted_at descending
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading exam submissions...",
            "emptyTable": "No exam submissions found",
            "zeroRecords": "No matching exam submissions found"
        }
    });
}

/**
 * Setup modal events
 */
function setupExamModalEvents() {
    // Reset modals when closed
    $('#examSubmissionDetailsModal').on('hidden.bs.modal', function () {
        $('#examSubmissionDetailsContent').html('');
    });
    
    $('#gradeExamSubmissionModal').on('hidden.bs.modal', function () {
        resetGradeExamForm();
    });
}

/**
 * Filter by grading period
 */
function filterByGradingPeriod() {
    const gradingPeriodEl = document.getElementById('examSubmissionsGradingPeriodFilter');
    const selectedValue = gradingPeriodEl ? gradingPeriodEl.value : '';
    console.log('Exam Submissions - Grading Period Filter Changed:', selectedValue);
    console.log('Exam Submissions - Element found:', !!gradingPeriodEl);
    
    if (window.examSubmissionsTable) {
        console.log('Exam Submissions - Reloading table with grading period filter');
        window.examSubmissionsTable.ajax.reload(null, false);
    } else {
        console.error('Exam Submissions - Table not found!');
    }
}

/**
 * Filter by status
 */
function filterByStatus() {
    const statusEl = document.getElementById('examSubmissionsStatusFilter');
    const selectedValue = statusEl ? statusEl.value : '';
    console.log('Exam Submissions - Status Filter Changed:', selectedValue);
    console.log('Exam Submissions - Element found:', !!statusEl);
    
    if (window.examSubmissionsTable) {
        console.log('Exam Submissions - Reloading table with status filter');
        window.examSubmissionsTable.ajax.reload(null, false);
    } else {
        console.error('Exam Submissions - Table not found!');
    }
}

/**
 * View exam submission details
 */
function viewExamSubmissionDetails(submissionId) {
    if (!submissionId) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Invalid submission ID'
        });
        return;
    }
    
    // Show loading
    $('#examSubmissionDetailsContent').html(`
        <div class="text-center p-4">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading submission details...</p>
        </div>
    `);
    
    $('#examSubmissionDetailsModal').modal('show');
    
    // Fetch submission details
    fetch(`app/API/apiExamSubmissions.php?action=get_submission_details&id=${submissionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayExamSubmissionDetails(data.data);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#examSubmissionDetailsContent').html(`
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error loading submission details: ${error.message}
                </div>
            `);
        });
}

/**
 * Display exam submission details
 */
function displayExamSubmissionDetails(submission) {
    const percentage = submission.max_score > 0 ? 
        ((submission.score / submission.max_score) * 100).toFixed(2) : 0;
    
    const startedAt = submission.started_at ? 
        new Date(submission.started_at).toLocaleString() : 'N/A';
    
    const completedAt = submission.completed_at ? 
        new Date(submission.completed_at).toLocaleString() : 'Not completed';
    
    const timeSpent = submission.time_spent_seconds ? 
        formatDuration(submission.time_spent_seconds) : 'N/A';
    
    let detailsHtml = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>Student Information</h6>
                <table class="table table-sm table-borderless">
                    <tr><td><strong>Name:</strong></td><td>${submission.student_name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${submission.student_email}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Exam Information</h6>
                <table class="table table-sm table-borderless">
                    <tr><td><strong>Exam:</strong></td><td>${submission.exam_title}</td></tr>
                    <tr><td><strong>Subject:</strong></td><td>${submission.subject_name}</td></tr>
                    <tr><td><strong>Grading Period:</strong></td><td>${submission.grading_period}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-primary">${submission.score}/${submission.max_score}</h5>
                        <p class="card-text">Score (${percentage}%)</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-warning">${timeSpent}</h5>
                        <p class="card-text">Time Spent</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-success">${submission.completed_at ? 'Completed' : 'In Progress'}</h5>
                        <p class="card-text">Status</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-info">${submission.time_limit_minutes || 'No limit'}</h5>
                        <p class="card-text">Time Limit (min)</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <p><strong>Started At:</strong> ${startedAt}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Completed At:</strong> ${completedAt}</p>
            </div>
        </div>
    `;
    
    if (submission.answers && Object.keys(submission.answers).length > 0) {
        detailsHtml += `
            <div class="mb-4">
                <h6>Exam Answers</h6>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    Exam answers are stored in JSON format and can be viewed in detail by the system administrator.
                </div>
                <pre class="bg-light p-3 rounded">${JSON.stringify(submission.answers, null, 2)}</pre>
            </div>
        `;
    }
    
    $('#examSubmissionDetailsTitle').text(`Exam Submission - ${submission.student_name}`);
    $('#examSubmissionDetailsContent').html(detailsHtml);
}

/**
 * Grade exam submission (add comments)
 */
function gradeExamSubmission(submissionId) {
    if (!submissionId) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Invalid submission ID'
        });
        return;
    }
    
    // Fetch submission details first
    fetch(`app/API/apiExamSubmissions.php?action=get_submission_details&id=${submissionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateGradeExamForm(data.data);
                $('#gradeExamSubmissionModal').modal('show');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to load submission details: ' + error.message
            });
        });
}

/**
 * Populate grade exam form
 */
function populateGradeExamForm(submission) {
    const percentage = submission.max_score > 0 ? 
        ((submission.score / submission.max_score) * 100).toFixed(2) : 0;
    
    const timeSpent = submission.time_spent_seconds ? 
        formatDuration(submission.time_spent_seconds) : 'N/A';
    
    const startedAt = submission.started_at ? 
        new Date(submission.started_at).toLocaleString() : 'N/A';
    
    document.getElementById('gradeExamSubmissionId').value = submission.id;
    document.getElementById('examScore').value = submission.score;
    document.getElementById('examMaxScore').value = submission.max_score;
    document.getElementById('examPercentage').value = percentage + '%';
    document.getElementById('examTimeSpent').value = timeSpent;
    document.getElementById('examStartedAt').value = startedAt;
    document.getElementById('examTeacherComments').value = '';
    
    document.getElementById('gradeExamSubmissionTitle').textContent = 
        `Review Exam Submission - ${submission.student_name}`;
}

/**
 * Submit exam grade (comments)
 */
function submitExamGrade() {
    const form = document.getElementById('gradeExamSubmissionForm');
    const formData = new FormData(form);
    
    fetch('app/API/apiExamSubmissions.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: data.message,
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                $('#gradeExamSubmissionModal').modal('hide');
                window.examSubmissionsTable.ajax.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: data.message
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while saving comments.'
        });
    });
}

/**
 * Reset grade exam form
 */
function resetGradeExamForm() {
    document.getElementById('gradeExamSubmissionForm').reset();
}

/**
 * Print exam submission
 */
function printExamSubmission() {
    const content = document.getElementById('examSubmissionDetailsContent');
    if (!content) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'No content to print'
        });
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Exam Submission Details</title>
                <link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .no-print { display: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Exam Submission Details</h2>
                    ${content.innerHTML}
                </div>
                <script>
                    window.onload = function() { 
                        window.print(); 
                        window.onafterprint = function() { window.close(); }
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Export exam submissions data
 */
function exportExamSubmissionsData() {
    Swal.fire({
        title: 'Export Exam Submissions',
        text: 'Choose export format:',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'CSV',
        cancelButtonText: 'Cancel',
        showDenyButton: true,
        denyButtonText: 'PDF'
    }).then((result) => {
        if (result.isConfirmed) {
            exportToCSV();
        } else if (result.isDenied) {
            exportToPDF();
        }
    });
}

/**
 * Export to CSV
 */
function exportToCSV() {
    // Implementation for CSV export
    Swal.fire({
        icon: 'info',
        title: 'Coming Soon!',
        text: 'CSV export functionality will be available soon.'
    });
}

/**
 * Export to PDF
 */
function exportToPDF() {
    // Implementation for PDF export
    Swal.fire({
        icon: 'info',
        title: 'Coming Soon!',
        text: 'PDF export functionality will be available soon.'
    });
}

/**
 * Format duration from seconds to readable format (HH:MM:SS)
 */
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Test exam filters function
 */
function testExamFilters() {
    console.log('=== EXAM SUBMISSIONS FILTER DEBUG ===');
    
    // Check DOM elements
    const gradingPeriodEl = document.getElementById('examSubmissionsGradingPeriodFilter');
    const statusEl = document.getElementById('examSubmissionsStatusFilter');
    const tableWrapper = document.getElementById('examSubmissionsTable_wrapper');
    
    console.log('DOM Elements Check:', {
        gradingPeriodFilter: !!gradingPeriodEl,
        statusFilter: !!statusEl,
        tableWrapper: !!tableWrapper,
        gradingPeriodValue: gradingPeriodEl ? gradingPeriodEl.value : 'ELEMENT NOT FOUND',
        statusValue: statusEl ? statusEl.value : 'ELEMENT NOT FOUND'
    });
    
    if (gradingPeriodEl) {
        console.log('Grading Period Element Details:', {
            id: gradingPeriodEl.id,
            value: gradingPeriodEl.value,
            parentElement: gradingPeriodEl.parentElement?.className
        });
    }
    
    if (statusEl) {
        console.log('Status Element Details:', {
            id: statusEl.id,
            value: statusEl.value,
            parentElement: statusEl.parentElement?.className
        });
    }
    
    const gradingPeriod = gradingPeriodEl ? gradingPeriodEl.value : '';
    const status = statusEl ? statusEl.value : '';
    
    // Test API directly
    const testUrl = `app/API/apiExamSubmissions.php?action=datatable&draw=999&start=0&length=10&grading_period=${gradingPeriod}&status=${status}`;
    console.log('Test URL:', testUrl);
    
    fetch(testUrl)
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);
            alert(`API Test Results:\nTotal Records: ${data.recordsTotal}\nFiltered Records: ${data.recordsFiltered}\nData Count: ${data.data.length}\n\nCheck console for full response.`);
        })
        .catch(error => {
            console.error('API Test Error:', error);
            alert('API Test Failed - Check console for details');
        });
}

/**
 * Refresh DataTable
 */
function refreshExamSubmissionsTable() {
    if (window.examSubmissionsTable) {
        window.examSubmissionsTable.ajax.reload();
    }
}
