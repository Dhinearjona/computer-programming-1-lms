/**
 * Quiz Submissions DataTables Configuration and Functions
 */

// Global variables - use window object to avoid redeclaration
window.quizSubmissionsTable = window.quizSubmissionsTable || null;

$(document).ready(function() {
    initializeQuizSubmissionsTable();
    setupModalEvents();
});

/**
 * Get current filter values
 */
function getCurrentFilters() {
    const gradingPeriodEl = document.getElementById('quizSubmissionsGradingPeriodFilter');
    const statusEl = document.getElementById('quizSubmissionsStatusFilter');
    
    const filters = {
        grading_period: gradingPeriodEl ? gradingPeriodEl.value : '',
        status: statusEl ? statusEl.value : ''
    };
    
    console.log('getCurrentFilters - Found elements:', {
        gradingPeriodEl: !!gradingPeriodEl,
        statusEl: !!statusEl,
        values: filters
    });
    
    return filters;
}

/**
 * Initialize Quiz Submissions DataTable
 */
function initializeQuizSubmissionsTable() {
    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable('#quizSubmissionsTable')) {
        $('#quizSubmissionsTable').DataTable().destroy();
    }
    
    window.quizSubmissionsTable = $('#quizSubmissionsTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiQuizSubmissions.php?action=datatable",
            "type": "GET",
            "data": function(d) {
                const filters = getCurrentFilters();
                console.log('Quiz Submissions DataTable - Sending filters:', filters);
                
                // Add filter parameters
                if (filters.grading_period && filters.grading_period !== '') {
                    d.grading_period = filters.grading_period;
                }
                if (filters.status && filters.status !== '') {
                    d.status = filters.status;
                }
                
                return d;
            },
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                console.error('Response:', xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load quiz submissions data.'
                });
            }
        },
        "columns": [
            { "data": "student_name", "width": "15%" },
            { "data": "quiz_title", "width": "20%" },
            { "data": "subject_name", "width": "12%" },
            { "data": "grading_period", "width": "10%" },
            { "data": "attempt_number", "width": "8%", "className": "text-center" },
            { "data": "score", "width": "12%", "className": "text-center" },
            { "data": "status", "width": "10%", "className": "text-center", "orderable": false },
            { "data": "submitted_at", "width": "13%" },
            { "data": "actions", "width": "10%", "className": "text-center", "orderable": false }
        ],
        "order": [[7, "desc"]], // Sort by submitted_at descending
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading quiz submissions...",
            "emptyTable": "No quiz submissions found",
            "zeroRecords": "No matching quiz submissions found"
        },
        "initComplete": function(settings, json) {
            console.log('Quiz Submissions DataTable - Initialization complete');
            console.log('Quiz Submissions DataTable - Filter elements check:', {
                gradingPeriodFilter: !!document.getElementById('quizSubmissionsGradingPeriodFilter'),
                statusFilter: !!document.getElementById('quizSubmissionsStatusFilter')
            });
        }
    });
}


/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modals when closed
    $('#quizSubmissionDetailsModal').on('hidden.bs.modal', function () {
        $('#quizSubmissionDetailsContent').html('');
    });
    
    $('#gradeQuizSubmissionModal').on('hidden.bs.modal', function () {
        resetGradeQuizForm();
    });
}

/**
 * Filter by grading period
 */
function filterByGradingPeriod() {
    const gradingPeriodEl = document.getElementById('quizSubmissionsGradingPeriodFilter');
    const selectedValue = gradingPeriodEl ? gradingPeriodEl.value : '';
    console.log('Quiz Submissions - Grading Period Filter Changed:', selectedValue);
    console.log('Quiz Submissions - Element found:', !!gradingPeriodEl);
    
    if (window.quizSubmissionsTable) {
        console.log('Quiz Submissions - Reloading table with grading period filter');
        window.quizSubmissionsTable.ajax.reload(null, false); // false = don't reset paging
    } else {
        console.error('Quiz Submissions - Table not found!');
    }
}

/**
 * Filter by status
 */
function filterByStatus() {
    const statusEl = document.getElementById('quizSubmissionsStatusFilter');
    const selectedValue = statusEl ? statusEl.value : '';
    console.log('Quiz Submissions - Status Filter Changed:', selectedValue);
    console.log('Quiz Submissions - Element found:', !!statusEl);
    
    if (window.quizSubmissionsTable) {
        console.log('Quiz Submissions - Reloading table with status filter');
        window.quizSubmissionsTable.ajax.reload(null, false); // false = don't reset paging
    } else {
        console.error('Quiz Submissions - Table not found!');
    }
}

/**
 * View quiz submission details
 */
function viewQuizSubmissionDetails(submissionId) {
    if (!submissionId) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Invalid submission ID'
        });
        return;
    }
    
    // Show loading
    $('#quizSubmissionDetailsContent').html(`
        <div class="text-center p-4">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading submission details...</p>
        </div>
    `);
    
    $('#quizSubmissionDetailsModal').modal('show');
    
    // Fetch submission details
    fetch(`app/API/apiQuizSubmissions.php?action=get_submission_details&id=${submissionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayQuizSubmissionDetails(data.data);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#quizSubmissionDetailsContent').html(`
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error loading submission details: ${error.message}
                </div>
            `);
        });
}

/**
 * Display quiz submission details
 */
function displayQuizSubmissionDetails(submission) {
    const percentage = submission.max_score > 0 ? 
        ((submission.score / submission.max_score) * 100).toFixed(2) : 0;
    
    const startedAt = submission.started_at ? 
        new Date(submission.started_at).toLocaleString() : 'N/A';
    
    const finishedAt = submission.finished_at ? 
        new Date(submission.finished_at).toLocaleString() : 'Not finished';
    
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
                <h6>Quiz Information</h6>
                <table class="table table-sm table-borderless">
                    <tr><td><strong>Quiz:</strong></td><td>${submission.quiz_title}</td></tr>
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
                        <h5 class="card-title text-info">${submission.attempt_number}</h5>
                        <p class="card-text">Attempt Number</p>
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
                        <h5 class="card-title text-success">${submission.status}</h5>
                        <p class="card-text">Status</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <p><strong>Started At:</strong> ${startedAt}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Finished At:</strong> ${finishedAt}</p>
            </div>
        </div>
    `;
    
    // Teacher comments functionality removed since it's not in the database schema
    // Can be added later when the database is updated
    
    if (submission.answers && submission.answers.length > 0) {
        detailsHtml += `
            <div class="mb-4">
                <h6>Quiz Answers</h6>
                <div class="accordion" id="answersAccordion">
        `;
        
        submission.answers.forEach((answer, index) => {
            const isCorrect = answer.is_correct;
            const cardClass = isCorrect ? 'border-success' : 'border-danger';
            const headerClass = isCorrect ? 'bg-light-success' : 'bg-light-danger';
            
            detailsHtml += `
                <div class="accordion-item ${cardClass}">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button collapsed ${headerClass}" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                            <div class="d-flex justify-content-between w-100 me-3">
                                <span>Question ${index + 1}</span>
                                <span class="badge ${isCorrect ? 'bg-success' : 'bg-danger'}">
                                    ${isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" 
                         data-bs-parent="#answersAccordion">
                        <div class="accordion-body">
                            <p><strong>Question:</strong> ${answer.question_text}</p>
                            <p><strong>Student Answer:</strong> ${answer.answer_text || 'No answer provided'}</p>
                            ${answer.question_type === 'multiple_choice' && answer.options ? 
                                generateMultipleChoiceDisplay(answer) : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        detailsHtml += `
                </div>
            </div>
        `;
    }
    
    $('#quizSubmissionDetailsTitle').text(`Quiz Submission - ${submission.student_name}`);
    $('#quizSubmissionDetailsContent').html(detailsHtml);
}

/**
 * Generate multiple choice options display
 */
function generateMultipleChoiceDisplay(answer) {
    if (!answer.options) return '';
    
    let optionsHtml = '<p><strong>Options:</strong></p><ul>';
    answer.options.forEach(option => {
        const isSelected = answer.choice_id === option.id;
        const isCorrect = option.is_correct;
        let className = '';
        
        if (isSelected && isCorrect) {
            className = 'text-success fw-bold';
        } else if (isSelected && !isCorrect) {
            className = 'text-danger fw-bold';
        } else if (!isSelected && isCorrect) {
            className = 'text-success';
        }
        
        optionsHtml += `<li class="${className}">
            ${option.choice_text}
            ${isSelected ? ' (Selected)' : ''}
            ${isCorrect ? ' ✓' : ''}
        </li>`;
    });
    optionsHtml += '</ul>';
    
    return optionsHtml;
}

/**
 * Grade quiz submission (add comments)
 */
function gradeQuizSubmission(submissionId) {
    if (!submissionId) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Invalid submission ID'
        });
        return;
    }
    
    // Fetch submission details first
    fetch(`app/API/apiQuizSubmissions.php?action=get_submission_details&id=${submissionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateGradeQuizForm(data.data);
                $('#gradeQuizSubmissionModal').modal('show');
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
 * Populate grade quiz form
 */
function populateGradeQuizForm(submission) {
    const percentage = submission.max_score > 0 ? 
        ((submission.score / submission.max_score) * 100).toFixed(2) : 0;
    
    const timeSpent = submission.time_spent_seconds ? 
        formatDuration(submission.time_spent_seconds) : 'N/A';
    
    document.getElementById('gradeQuizSubmissionId').value = submission.id;
    document.getElementById('quizScore').value = submission.score;
    document.getElementById('quizMaxScore').value = submission.max_score;
    document.getElementById('quizPercentage').value = percentage + '%';
    document.getElementById('quizTimeSpent').value = timeSpent;
    document.getElementById('quizAttemptNumber').value = submission.attempt_number;
    document.getElementById('quizTeacherComments').value = '';
    
    document.getElementById('gradeQuizSubmissionTitle').textContent = 
        `Review Quiz Submission - ${submission.student_name}`;
}

/**
 * Submit quiz grade (comments)
 */
function submitQuizGrade() {
    const form = document.getElementById('gradeQuizSubmissionForm');
    const formData = new FormData(form);
    
    fetch('app/API/apiQuizSubmissions.php', {
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
                $('#gradeQuizSubmissionModal').modal('hide');
                if (window.quizSubmissionsTable) {
                    window.quizSubmissionsTable.ajax.reload();
                }
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
 * Reset grade quiz form
 */
function resetGradeQuizForm() {
    document.getElementById('gradeQuizSubmissionForm').reset();
}

/**
 * Print quiz submission
 */
function printQuizSubmission() {
    const content = document.getElementById('quizSubmissionDetailsContent');
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
                <title>Quiz Submission Details</title>
                <link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .no-print { display: none; }
                    @media print {
                        .accordion-button { display: none; }
                        .accordion-collapse { display: block !important; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Quiz Submission Details</h2>
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
 * Export quiz submissions data
 */
function exportQuizSubmissionsData() {
    Swal.fire({
        title: 'Export Quiz Submissions',
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
 * Test filters function
 */
function testFilters() {
    console.log('=== QUIZ SUBMISSIONS FILTER DEBUG ===');
    
    // Check DOM elements
    const gradingPeriodEl = document.getElementById('gradingPeriodFilter');
    const statusEl = document.getElementById('statusFilter');
    const tableWrapper = document.getElementById('quizSubmissionsTable_wrapper');
    
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
    
    const filters = getCurrentFilters();
    console.log('Current filter values:', filters);
    
    // Test API directly
    const testUrl = `app/API/apiQuizSubmissions.php?action=datatable&draw=999&start=0&length=10&grading_period=${filters.grading_period}&status=${filters.status}`;
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
function refreshQuizSubmissionsTable() {
    if (window.quizSubmissionsTable) {
        window.quizSubmissionsTable.ajax.reload();
    }
}
