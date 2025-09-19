/**
 * My Quizzes DataTables Configuration and Functions
 */

// Prevent multiple initialization
if (typeof window.myQuizzesDataTablesInitialized !== 'undefined') {
    // Script already loaded, skip initialization
} else {
    window.myQuizzesDataTablesInitialized = true;

// Global variables
let myQuizzesTable;

$(document).ready(function() {
    initializeMyQuizzesTable();
    
    // Reset modal when closed
    $('#quizDetailsModal').on('hidden.bs.modal', function () {
        document.getElementById('quizDetailsContent').innerHTML = '';
    });
});

/**
 * Initialize My Quizzes DataTable
 */
function initializeMyQuizzesTable() {
    // Check if table is already initialized
    if ($.fn.DataTable.isDataTable('#myQuizzesTable')) {
        $('#myQuizzesTable').DataTable().destroy();
    }
    
    myQuizzesTable = $('#myQuizzesTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiMyQuizzes.php",
            "type": "GET",
            "data": function(d) {
                d.action = 'datatable';
                if (window.periodFilter) {
                    d.period = window.periodFilter;
                }
                return d;
            },
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load quizzes data.'
                });
            }
        },
        "columns": [
            { "data": "title", "width": "25%" },
            { 
                "data": "description", 
                "width": "25%",
                "render": function(data, type, row) {
                    if (data && data.length > 60) {
                        return data.substring(0, 60) + '...';
                    }
                    return data || '';
                }
            },
            { 
                "data": "time_limit_minutes", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data ? data + ' mins' : 'No limit';
                }
            },
            { 
                "data": "attempts_allowed", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data || '1';
                }
            },
            { 
                "data": "status", 
                "width": "15%",
                "render": function(data, type, row) {
                    const now = new Date();
                    const openAt = new Date(row.open_at);
                    const closeAt = new Date(row.close_at);
                    
                    if (now < openAt) {
                        return '<span class="badge bg-secondary">Not Open</span>';
                    } else if (now > closeAt) {
                        return '<span class="badge bg-danger">Closed</span>';
                    } else {
                        return '<span class="badge bg-success">Available</span>';
                    }
                }
            },
            { 
                "data": "score", 
                "width": "10%",
                "render": function(data, type, row) {
                    if (row.score !== null && row.score !== undefined) {
                        return '<span class="badge bg-primary">' + row.score + '/' + row.max_score + '</span>';
                    } else {
                        return '<span class="badge bg-light text-dark">Not Taken</span>';
                    }
                }
            },
            { 
                "data": "actions", 
                "orderable": false, 
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = '<div class="btn-group gap-1" role="group">';
                    
                    // View Details button
                    actions += `
                        <button class="btn btn-outline-info" onclick="viewStudentQuizDetails(${row.id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;
                    
                    // Take Quiz button (only if available and not taken)
                    const now = new Date();
                    const openAt = new Date(row.open_at);
                    const closeAt = new Date(row.close_at);
                    
                    if (now >= openAt && now <= closeAt && window.canTakeQuizzes) {
                        if (row.score === null || row.score === undefined) {
                            actions += `
                                <button class="btn btn-outline-primary" onclick="takeQuiz(${row.id})" title="Take Quiz">
                                    <i class="bi bi-play-circle"></i>
                                </button>
                            `;
                        } else {
                            actions += `
                                <button class="btn btn-outline-secondary" onclick="viewQuizResult(${row.id})" title="View Result">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                            `;
                        }
                    }
                    
                    actions += '</div>';
                    return actions;
                }
            }
        ],
        "order": [[4, "desc"]], // Sort by status
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading quizzes...",
            "emptyTable": "No quizzes found",
            "zeroRecords": "No matching quizzes found"
        }
    });
}

/**
 * View Quiz Details (Student Version)
 */
function viewStudentQuizDetails(id) {
    // Show loading
    Swal.fire({
        title: 'Loading...',
        text: 'Please wait while we load the quiz details.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    fetch(`app/API/apiMyQuizzes.php?action=get_quiz&id=${id}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Get as text first to check for HTML errors
    })
    .then(text => {
        try {
            return JSON.parse(text); // Try to parse as JSON
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Server returned invalid response');
        }
    })
    .then(data => {
        Swal.close(); // Close loading
        
        if (data.success) {
            const quiz = data.data;
            populateQuizDetailsModal(quiz);
            $('#quizDetailsModal').modal('show');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: data.message || 'Failed to load quiz details.'
            });
        }
    })
    .catch(error => {
        Swal.close(); // Close loading
        console.error('Error loading quiz details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load quiz details. Please check your connection and try again.'
        });
    });
}

/**
 * Populate quiz details modal
 */
function populateQuizDetailsModal(quiz) {
    const now = new Date();
    const openAt = new Date(quiz.open_at);
    const closeAt = new Date(quiz.close_at);
    
    let statusBadge = '';
    if (now < openAt) {
        statusBadge = '<span class="badge bg-secondary">Not Open</span>';
    } else if (now > closeAt) {
        statusBadge = '<span class="badge bg-danger">Closed</span>';
    } else {
        statusBadge = '<span class="badge bg-success">Available</span>';
    }
    
    // Check if student can take the quiz
    const canTakeNow = now >= openAt && now <= closeAt && (quiz.score === null || quiz.score === undefined);
    const hasCompleted = quiz.score !== null && quiz.score !== undefined;
    
    document.getElementById('quizDetailsContent').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Title</label>
                    <p class="form-control-plaintext">${quiz.title}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Description</label>
                    <div class="form-control-plaintext border rounded p-3 bg-light">
                        ${quiz.description || 'No description provided'}
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Lesson</label>
                    <p class="form-control-plaintext">${quiz.lesson_title || 'N/A'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Status</label>
                    <p class="form-control-plaintext">${statusBadge}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Time Limit</label>
                    <p class="form-control-plaintext">${quiz.time_limit_minutes ? quiz.time_limit_minutes + ' minutes' : 'No limit'}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Attempts Allowed</label>
                    <p class="form-control-plaintext">${quiz.attempts_allowed || 1}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Max Score</label>
                    <p class="form-control-plaintext">${quiz.max_score}</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Open Date</label>
                    <p class="form-control-plaintext">${formatQuizDate(quiz.open_at)}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Close Date</label>
                    <p class="form-control-plaintext">${formatQuizDate(quiz.close_at)}</p>
                </div>
            </div>
        </div>
        
        ${hasCompleted ? `
        <div class="alert alert-success">
            <h6>Your Result</h6>
            <p class="mb-0"><strong>Score:</strong> ${quiz.score}/${quiz.max_score}</p>
            <p class="mb-0"><strong>Percentage:</strong> ${Math.round((quiz.score / quiz.max_score) * 100)}%</p>
            ${quiz.taken_at ? `<p class="mb-0"><strong>Completed:</strong> ${formatQuizDate(quiz.taken_at)}</p>` : ''}
        </div>
        ` : ''}
        
        ${canTakeNow ? `
        <div class="alert alert-primary">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">Ready to Take Quiz?</h6>
                    <p class="mb-0">The quiz is currently available. Click the button to start.</p>
                </div>
                <button class="btn btn-primary" onclick="takeQuiz(${quiz.id})">
                    <i class="bi bi-play-circle"></i> Take Quiz
                </button>
            </div>
        </div>
        ` : ''}
        
        <div class="alert alert-info">
            <h6>Quiz Information</h6>
            <ul class="mb-0">
                <li>You can take this quiz during the open period</li>
                <li>Make sure you have a stable internet connection</li>
                <li>The timer will start when you begin the quiz</li>
                <li>You have ${quiz.attempts_allowed || 1} attempt(s) to complete this quiz</li>
            </ul>
        </div>
    `;
    
    // Update modal footer with action buttons
    const modalFooter = document.querySelector('#quizDetailsModal .modal-footer');
    if (modalFooter) {
        let footerButtons = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`;
        
        if (canTakeNow) {
            footerButtons = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="takeQuiz(${quiz.id})">
                    <i class="bi bi-play-circle"></i> Take Quiz
                </button>
            `;
        } else if (hasCompleted) {
            footerButtons = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-outline-primary" onclick="viewQuizResult(${quiz.id})">
                    <i class="bi bi-check-circle"></i> View Result
                </button>
            `;
        }
        
        modalFooter.innerHTML = footerButtons;
    }
}

/**
 * Format quiz date helper function
 */
function formatQuizDate(dateString) {
    if (!dateString) return 'Not set';
    
    try {
        const date = new Date(dateString);
        if (isValidDate(date)) {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        } else {
            return 'Invalid date';
        }
    } catch (e) {
        console.error('Date formatting error:', e);
        return 'Invalid date';
    }
}

/**
 * Take Quiz
 */
function takeQuiz(id) {
    Swal.fire({
        title: 'Start Quiz',
        text: 'Are you ready to start the quiz? The timer will begin immediately.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Start Quiz',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirect to quiz taking page
            window.location.href = `take-quiz.php?id=${id}`;
        }
    });
}

/**
 * View Quiz Result
 */
function viewQuizResult(id) {
    fetch(`app/API/apiMyQuizzes.php?action=get_result&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const result = data.data;
            Swal.fire({
                icon: 'info',
                title: 'Quiz Result',
                html: `
                    <div class="text-start">
                        <p><strong>Quiz:</strong> ${result.quiz_title}</p>
                        <p><strong>Score:</strong> ${result.score}/${result.max_score}</p>
                        <p><strong>Percentage:</strong> ${Math.round((result.score / result.max_score) * 100)}%</p>
                        <p><strong>Date Taken:</strong> ${new Date(result.taken_at).toLocaleDateString()}</p>
                    </div>
                `,
                confirmButtonText: 'Close'
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
            text: 'Failed to load quiz result.'
        });
    });
}

/**
 * Helper function to check if date is valid
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

/**
 * Refresh DataTable
 */
function refreshQuizzesTable() {
    if (myQuizzesTable) {
        myQuizzesTable.ajax.reload();
    }
}

/**
 * Wrapper function for backward compatibility
 * This ensures that if viewQuizDetails is called on student pages, it uses the student version
 */
if (window.isStudent) {
    window.viewQuizDetails = viewStudentQuizDetails;
}

} // End of initialization guard