/**
 * Quizzes DataTables Configuration and Functions (Teacher Side)
 */

// Prevent multiple initialization
if (typeof window.quizzesDataTablesInitialized !== 'undefined') {
    // Script already loaded, skip initialization
} else {
    window.quizzesDataTablesInitialized = true;

// Global variables
let quizzesTable;

$(document).ready(function() {
    initializeQuizzesTable();
    
    // Only load lessons and grading periods for teachers/admins who can manage quizzes
    if (window.canManageQuizzes) {
        loadLessons();
        loadGradingPeriods();
    }
    
    // Reset modal when closed
    $('#quizModal').on('hidden.bs.modal', function () {
        resetQuizForm();
    });
    
    $('#quizDetailsModal').on('hidden.bs.modal', function () {
        document.getElementById('quizDetailsContent').innerHTML = '';
    });
});

/**
 * Initialize Quizzes DataTable
 */
function initializeQuizzesTable() {
    // Check if table is already initialized
    if ($.fn.DataTable.isDataTable('#quizzesTable')) {
        $('#quizzesTable').DataTable().destroy();
    }
    
    // Define columns based on user role
    let columns = [];
    let columnIndex = 0;
    
    // Title column (always visible)
    columns.push({ "data": "title", "width": "25%" });
    columnIndex++;
    
    // Lesson column (only for teachers/admins)
    if (window.canManageQuizzes) {
        columns.push({ "data": "lesson_title", "width": "15%" });
        columnIndex++;
    }
    
    // Grading Period column (always visible)
    columns.push({ 
        "data": "grading_period_name", 
        "width": "12%",
        "render": function(data, type, row) {
            const badgeClass = {
                'prelim': 'bg-info',
                'midterm': 'bg-warning text-dark',
                'finals': 'bg-success'
            };
            const className = badgeClass[data.toLowerCase()] || 'bg-secondary';
            return `<span class="badge ${className}">${data.charAt(0).toUpperCase() + data.slice(1)}</span>`;
        }
    });
    columnIndex++;
    
    // Max Score column (always visible)
    columns.push({ "data": "max_score", "width": "8%" });
    columnIndex++;
    
    // Time Limit column (always visible)
    columns.push({ 
        "data": "time_limit_minutes", 
        "width": "10%",
        "render": function(data, type, row) {
            return data ? data + ' mins' : 'No limit';
        }
    });
    columnIndex++;
    
    // Attempts column (only for teachers/admins)
    if (window.canManageQuizzes) {
        columns.push({ "data": "attempts_allowed", "width": "8%" });
        columnIndex++;
    }
    
    // Status column (always visible)
    const statusColumnIndex = columnIndex;
    columns.push({ 
        "data": "status", 
        "width": "12%",
        "render": function(data, type, row) {
            const now = new Date();
            const openAt = new Date(row.open_at);
            const closeAt = new Date(row.close_at);
            
            if (now < openAt) {
                return '<span class="badge bg-secondary">Not Open</span>';
            } else if (now > closeAt) {
                return '<span class="badge bg-danger">Closed</span>';
            } else {
                return '<span class="badge bg-success">Active</span>';
            }
        }
    });
    columnIndex++;
    
    // Score column (only for students)
    if (window.canViewOwnQuizzes) {
        columns.push({ 
            "data": "score", 
            "width": "10%",
            "render": function(data, type, row) {
                if (row.score !== null && row.score !== undefined) {
                    return `<span class="badge bg-primary">${row.score}/${row.max_score}</span>`;
                } else {
                    return '<span class="badge bg-light text-dark">Not Taken</span>';
                }
            }
        });
        columnIndex++;
    }
    
    // Actions column (always visible but content varies by role)
    columns.push({ 
        "data": "actions", 
        "orderable": false, 
        "width": "20%",
        "render": function(data, type, row) {
            let actions = '<div class="btn-group gap-1" role="group">';
            
            // View Details button (always available)
            actions += `
                <button class="btn btn-outline-info" onclick="viewQuizDetails(${row.id})" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>
            `;
            
            // Teacher/Admin actions
            if (window.canManageQuizzes) {
                // Add Questions button
                actions += `
                    <button class="btn btn-outline-primary" onclick="manageQuestions(${row.id})" title="Manage Questions">
                        <i class="bi bi-question-circle"></i>
                    </button>
                `;
                
                if (window.canEditQuizzes) {
                    actions += `
                        <button class="btn btn-outline-warning" onclick="editQuiz(${row.id})" title="Edit Quiz">
                            <i class="bi bi-pencil"></i>
                        </button>
                    `;
                }
                
                if (window.canDeleteQuizzes) {
                    actions += `
                        <button class="btn btn-outline-danger" onclick="deleteQuiz(${row.id})" title="Delete Quiz">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
            
            // Student actions
            if (window.canTakeQuizzes) {
                const now = new Date();
                const openAt = new Date(row.open_at);
                const closeAt = new Date(row.close_at);
                
                if (now >= openAt && now <= closeAt) {
                    if (row.score === null || row.score === undefined) {
                        actions += `
                            <button class="btn btn-outline-primary" onclick="takeQuiz(${row.id})" title="Take Quiz">
                                Take Quiz
                            </button>
                        `;
                    } else {
                        actions += `
                            <button class="btn btn-outline-secondary" onclick="viewQuizResult(${row.id})" title="View Result">
                                View Result
                            </button>
                        `;
                    }
                }
            }
            
            actions += '</div>';
            return actions;
        }
    });
    
    // Determine API endpoint based on user role
    const apiUrl = window.canManageQuizzes ? "app/API/apiQuizzes.php" : "app/API/apiMyQuizzes.php";
    
    quizzesTable = $('#quizzesTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": apiUrl,
            "type": "GET",
            "data": function(d) {
                d.action = 'datatable';
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
        "columns": columns,
        "order": [[statusColumnIndex, "desc"]], // Sort by status column
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
 * Load Lessons for dropdown
 */
function loadLessons() {
    fetch('app/API/apiLessons.php?action=get_all', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const select = document.getElementById('lesson_id');
            if (select) {
                select.innerHTML = '<option value="">Select Lesson</option>';
                data.data.forEach(lesson => {
                    select.innerHTML += `<option value="${lesson.id}">${lesson.title}</option>`;
                });
            }
        } else {
            console.error('Failed to load lessons:', data.message);
        }
    })
    .catch(error => {
        console.error('Error loading lessons:', error);
    });
}

/**
 * Load Grading Periods for dropdown
 */
function loadGradingPeriods() {
    fetch('app/API/apiGradingPeriods.php?action=get_all', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const select = document.getElementById('grading_period_id');
            if (select) {
                select.innerHTML = '<option value="">Select Grading Period</option>';
                data.data.forEach(period => {
                    select.innerHTML += `<option value="${period.id}">${period.name.charAt(0).toUpperCase() + period.name.slice(1)}</option>`;
                });
            }
        } else {
            console.error('Failed to load grading periods:', data.message);
        }
    })
    .catch(error => {
        console.error('Error loading grading periods:', error);
    });
}

/**
 * Save Quiz (Create or Update)
 */
function saveQuiz() {
    const form = document.getElementById('quizForm');
    const formData = new FormData(form);
    
    // Validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Show loading
    const submitButton = document.getElementById('submitButtonText');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Saving...';
    
    fetch('app/API/apiQuizzes.php', {
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
                timer: 2000,
                showConfirmButton: false
            });
            
            $('#quizModal').modal('hide');
            refreshQuizzesTable();
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
            text: 'Failed to save quiz.'
        });
    })
    .finally(() => {
        submitButton.textContent = originalText;
    });
}

/**
 * View Quiz Details
 */
function viewQuizDetails(id) {
    // Show loading
    Swal.fire({
        title: 'Loading...',
        text: 'Please wait while we load the quiz details.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    fetch(`app/API/apiQuizzes.php?action=get_quiz&id=${id}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        Swal.close();
        if (data.success) {
            const quiz = data.data;
            populateQuizDetailsModal(quiz);
            $('#quizDetailsModal').modal('show');
        } else {
            console.error('API Error:', data.message);
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
    try {
        const now = new Date();
        const openAt = new Date(quiz.open_at);
        const closeAt = new Date(quiz.close_at);
        
        let statusBadge = '';
        if (now < openAt) {
            statusBadge = '<span class="badge bg-secondary">Not Open</span>';
        } else if (now > closeAt) {
            statusBadge = '<span class="badge bg-danger">Closed</span>';
        } else {
            statusBadge = '<span class="badge bg-success">Active</span>';
        }
        
        // Update modal title
        document.getElementById('quizDetailsModalTitle').textContent = `Quiz Details: ${quiz.title}`;
        
        document.getElementById('quizDetailsContent').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Title</label>
                        <p class="form-control-plaintext">${quiz.title || 'N/A'}</p>
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
                    <div class="mb-3">
                        <label class="form-label fw-bold">Subject</label>
                        <p class="form-control-plaintext">${quiz.subject_name || 'N/A'}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Grading Period</label>
                        <p class="form-control-plaintext">
                            <span class="badge ${getGradingPeriodBadgeClass(quiz.grading_period_name)}">
                                ${quiz.grading_period_name ? quiz.grading_period_name.charAt(0).toUpperCase() + quiz.grading_period_name.slice(1) : 'N/A'}
                            </span>
                        </p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Status</label>
                        <p class="form-control-plaintext">${statusBadge}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Max Score</label>
                        <p class="form-control-plaintext">${quiz.max_score || 'N/A'}</p>
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
                        <label class="form-label fw-bold">Display Mode</label>
                        <p class="form-control-plaintext">${getDisplayModeText(quiz.display_mode)}</p>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Open Date</label>
                        <p class="form-control-plaintext">${isValidDate(openAt) ? openAt.toLocaleDateString() + ' at ' + openAt.toLocaleTimeString() : 'Invalid date'}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Close Date</label>
                        <p class="form-control-plaintext">${isValidDate(closeAt) ? closeAt.toLocaleDateString() + ' at ' + closeAt.toLocaleTimeString() : 'Invalid date'}</p>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-12">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Created</label>
                        <p class="form-control-plaintext">${quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() + ' at ' + new Date(quiz.created_at).toLocaleTimeString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error populating quiz details modal:', error);
        document.getElementById('quizDetailsContent').innerHTML = `
            <div class="alert alert-danger">
                <h6>Error Loading Quiz Details</h6>
                <p class="mb-0">There was an error displaying the quiz details. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Helper function to get grading period badge class
 */
function getGradingPeriodBadgeClass(periodName) {
    if (!periodName) return 'bg-secondary';
    
    const badgeClass = {
        'prelim': 'bg-info',
        'midterm': 'bg-warning text-dark',
        'finals': 'bg-success'
    };
    return badgeClass[periodName.toLowerCase()] || 'bg-secondary';
}

/**
 * Helper function to check if date is valid
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

/**
 * Get display mode text
 */
function getDisplayModeText(mode) {
    switch(mode) {
        case 'single': return 'One question per page';
        case 'per_page': return 'Five questions per page';
        case 'all': return 'All questions in one page';
        default: return mode;
    }
}

/**
 * Edit Quiz
 */
function editQuiz(id) {
    // Fetch quiz data and populate the form
    fetch(`app/API/apiQuizzes.php?action=get_quiz&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const quiz = data.data;
            populateEditForm(quiz);
            $('#quizModal').modal('show');
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
            text: 'Failed to load quiz data for editing.'
        });
    });
}

/**
 * Populate edit form with quiz data
 */
function populateEditForm(quiz) {
    document.getElementById('quizId').value = quiz.id;
    document.getElementById('formAction').value = 'update_quiz';
    document.getElementById('modalTitle').textContent = 'Edit Quiz';
    document.getElementById('submitButtonText').textContent = 'Update';
    
    document.getElementById('lesson_id').value = quiz.lesson_id;
    document.getElementById('grading_period_id').value = quiz.grading_period_id;
    document.getElementById('title').value = quiz.title;
    document.getElementById('description').value = quiz.description || '';
    document.getElementById('max_score').value = quiz.max_score;
    document.getElementById('time_limit_minutes').value = quiz.time_limit_minutes || '';
    document.getElementById('attempts_allowed').value = quiz.attempts_allowed;
    document.getElementById('display_mode').value = quiz.display_mode;
    
    // Format datetime for input fields
    if (quiz.open_at) {
        const openAt = new Date(quiz.open_at);
        document.getElementById('open_at').value = openAt.toISOString().slice(0, 16);
    }
    if (quiz.close_at) {
        const closeAt = new Date(quiz.close_at);
        document.getElementById('close_at').value = closeAt.toISOString().slice(0, 16);
    }
}

/**
 * Manage Questions
 */
function manageQuestions(id) {
    // Store current quiz ID
    window.currentQuizId = id;
    
    // Get quiz title first
    fetch(`app/API/apiQuizzes.php?action=get_quiz&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('quizTitleForQuestions').textContent = data.data.title;
            loadQuestions(id);
            $('#questionsModal').modal('show');
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
            text: 'Failed to load quiz information.'
        });
    });
}

/**
 * Delete Quiz
 */
function deleteQuiz(id) {
    Swal.fire({
        title: 'Delete Quiz',
        text: 'Are you sure you want to delete this quiz? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('action', 'delete_quiz');
            formData.append('id', id);
            
            fetch('app/API/apiQuizzes.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: data.message,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    refreshQuizzesTable();
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
                    text: 'Failed to delete quiz.'
                });
            });
        }
    });
}

/**
 * Export Quizzes Data
 */
function exportQuizzesData() {
    // Show loading
    Swal.fire({
        title: 'Exporting Data',
        text: 'Please wait while we prepare your export...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Make export request
    fetch('app/API/apiQuizzes.php?action=export', {
        method: 'GET'
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        } else {
            throw new Error('Export failed');
        }
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quizzes_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Complete!',
            text: 'Your quiz data has been downloaded.',
            timer: 2000,
            showConfirmButton: false
        });
    })
    .catch(error => {
        console.error('Export error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'Failed to export quiz data. Please try again.'
        });
    });
}

/**
 * Reset Quiz Form
 */
function resetQuizForm() {
    document.getElementById('quizForm').reset();
    document.getElementById('quizId').value = '';
    document.getElementById('formAction').value = 'create_quiz';
    document.getElementById('modalTitle').textContent = 'Add New Quiz';
    document.getElementById('submitButtonText').textContent = 'Submit';
}

/**
 * Take Quiz (Student function)
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
 * View Quiz Result (Student function)
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
 * Refresh DataTable
 */
function refreshQuizzesTable() {
    if (quizzesTable) {
        quizzesTable.ajax.reload();
    }
}

// ========================
// QUESTION MANAGEMENT FUNCTIONS
// ========================

/**
 * Load Questions for Quiz
 */
function loadQuestions(quizId) {
    document.getElementById('questionsList').innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading questions...</p>
        </div>
    `;
    
    fetch(`app/API/apiQuizQuestions.php?action=get_questions&quiz_id=${quizId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayQuestions(data.data);
        } else {
            document.getElementById('questionsList').innerHTML = `
                <div class="text-center py-4">
                    <div class="alert alert-info">
                        <h6>No Questions Found</h6>
                        <p class="mb-0">This quiz doesn't have any questions yet. Click "Add Question" to get started.</p>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('questionsList').innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-danger">
                    <h6>Error Loading Questions</h6>
                    <p class="mb-0">Failed to load questions. Please try again.</p>
                </div>
            </div>
        `;
    });
}

/**
 * Display Questions List
 */
function displayQuestions(questions) {
    if (!questions || questions.length === 0) {
        document.getElementById('questionsList').innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-info">
                    <h6>No Questions Found</h6>
                    <p class="mb-0">This quiz doesn't have any questions yet. Click "Add Question" to get started.</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    questions.forEach((question, index) => {
        const typeLabels = {
            'multiple_choice': 'Multiple Choice',
            'checkbox': 'Checkbox',
            'text': 'Text Answer'
        };
        
        html += `
            <div class="card mb-3">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title">Question ${index + 1}</h6>
                            <p class="card-text">${question.question_text}</p>
                            <div class="d-flex gap-3">
                                <small class="text-muted">
                                    <strong>Type:</strong> ${typeLabels[question.question_type] || question.question_type}
                                </small>
                                <small class="text-muted">
                                    <strong>Points:</strong> ${question.score}
                                </small>
                            </div>
                            ${question.choices && question.choices.length > 0 ? `
                                <div class="mt-2">
                                    <small class="text-muted"><strong>Choices:</strong></small>
                                    <ul class="list-unstyled ms-3">
                                        ${question.choices.map(choice => `
                                            <li class="small ${choice.is_correct ? 'text-success fw-bold' : ''}">
                                                ${choice.is_correct ? '✓' : '○'} ${choice.choice_text}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        <div class="btn-group gap-1">
                            <button class="btn btn-outline-warning" onclick="editQuestion(${question.id})" title="Edit Question">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteQuestion(${question.id})" title="Delete Question">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('questionsList').innerHTML = html;
}

/**
 * Add New Question
 */
function addNewQuestion() {
    resetQuestionForm();
    document.getElementById('questionQuizId').value = window.currentQuizId;
    $('#questionModal').modal('show');
}

/**
 * Handle Question Type Change
 */
function handleQuestionTypeChange() {
    const questionType = document.getElementById('questionType').value;
    const choicesSection = document.getElementById('choicesSection');
    const textAnswerSection = document.getElementById('textAnswerSection');
    
    if (questionType === 'multiple_choice' || questionType === 'checkbox') {
        choicesSection.style.display = 'block';
        textAnswerSection.style.display = 'none';
        
        // Add default choices if none exist
        const choicesList = document.getElementById('choicesList');
        if (choicesList.children.length === 0) {
            addChoice();
            addChoice();
        }
    } else if (questionType === 'text') {
        choicesSection.style.display = 'none';
        textAnswerSection.style.display = 'block';
    } else {
        choicesSection.style.display = 'none';
        textAnswerSection.style.display = 'none';
    }
}

/**
 * Add Choice Input
 */
function addChoice() {
    const choicesList = document.getElementById('choicesList');
    const choiceIndex = choicesList.children.length;
    const questionType = document.getElementById('questionType').value;
    const inputType = questionType === 'multiple_choice' ? 'radio' : 'checkbox';
    
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'input-group mb-2';
    choiceDiv.innerHTML = `
        <div class="input-group-text">
            <input class="form-check-input mt-0" type="${inputType}" 
                name="${questionType === 'multiple_choice' ? 'correct_choice' : 'correct_choice[]'}" 
                value="${choiceIndex}" id="choice_${choiceIndex}">
        </div>
        <input type="text" class="form-control" name="choices[]" placeholder="Enter choice text..." required>
        <button class="btn btn-outline-danger" type="button" onclick="removeChoice(this)"><i class="bi bi-trash"></i></button>
    `;
    
    choicesList.appendChild(choiceDiv);
}

/**
 * Remove Choice Input
 */
function removeChoice(button) {
    button.parentElement.remove();
}

/**
 * Save Question
 */
function saveQuestion() {
    const form = document.getElementById('questionForm');
    const formData = new FormData(form);
    
    // Validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const questionType = document.getElementById('questionType').value;
    
    // Validate choices for MCQ and Checkbox
    if (questionType === 'multiple_choice' || questionType === 'checkbox') {
        const choices = formData.getAll('choices[]');
        let correctChoices;
        
        if (questionType === 'multiple_choice') {
            correctChoices = formData.getAll('correct_choice');
        } else {
            correctChoices = formData.getAll('correct_choice[]');
        }
        
        if (choices.length < 2) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please add at least 2 choices.'
            });
            return;
        }
        
        if (correctChoices.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please select at least one correct answer.'
            });
            return;
        }
    }
    
    // Show loading
    const submitButton = document.getElementById('questionSubmitButtonText');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Saving...';
    
    fetch('app/API/apiQuizQuestions.php', {
        method: 'POST',
        body: formData
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
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });
            
            $('#questionModal').modal('hide');
            loadQuestions(window.currentQuizId);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: data.message
            });
        }
    })
    .catch(error => {
        console.error('Error saving question:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to save question. Please check the console for details.'
        });
    })
    .finally(() => {
        submitButton.textContent = originalText;
    });
}

/**
 * Edit Question
 */
function editQuestion(id) {
    // Fetch question data and populate the form
    fetch(`app/API/apiQuizQuestions.php?action=get_question&id=${id}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Server returned invalid response');
        }
    })
    .then(data => {
        if (data.success) {
            const question = data.data;
            populateQuestionEditForm(question);
            $('#questionModal').modal('show');
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
            text: 'Failed to load question data for editing.'
        });
    });
}

/**
 * Populate Question Edit Form
 */
function populateQuestionEditForm(question) {
    // Set form to edit mode
    document.getElementById('questionId').value = question.id;
    document.getElementById('questionQuizId').value = question.quiz_id;
    document.getElementById('questionFormAction').value = 'update_question';
    document.getElementById('questionModalTitle').textContent = 'Edit Question';
    document.getElementById('questionSubmitButtonText').textContent = 'Update';
    
    // Fill form fields
    document.getElementById('questionText').value = question.question_text;
    document.getElementById('questionType').value = question.question_type;
    document.getElementById('questionScore').value = question.score;
    
    // Trigger question type change to show appropriate sections
    handleQuestionTypeChange();
    
    // Populate choices if available
    if (question.choices && question.choices.length > 0) {
        const choicesList = document.getElementById('choicesList');
        choicesList.innerHTML = ''; // Clear existing choices
        
        question.choices.forEach((choice, index) => {
            // Add choice input
            addChoice();
            
            // Get the last added choice element
            const lastChoice = choicesList.lastElementChild;
            const textInput = lastChoice.querySelector('input[name="choices[]"]');
            const correctInput = lastChoice.querySelector('input[type="radio"], input[type="checkbox"]');
            
            // Set choice text
            textInput.value = choice.choice_text;
            
            // Set correct answer
            if (choice.is_correct == 1) {
                correctInput.checked = true;
            }
            
            // Update the value to match the current index
            correctInput.value = index;
        });
    }
}

/**
 * Delete Question
 */
function deleteQuestion(id) {
    Swal.fire({
        title: 'Delete Question',
        text: 'Are you sure you want to delete this question? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('action', 'delete_question');
            formData.append('id', id);
            
            fetch('app/API/apiQuizQuestions.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: data.message,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    loadQuestions(window.currentQuizId);
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
                    text: 'Failed to delete question.'
                });
            });
        }
    });
}

/**
 * Reset Question Form
 */
function resetQuestionForm() {
    document.getElementById('questionForm').reset();
    document.getElementById('questionId').value = '';
    document.getElementById('questionFormAction').value = 'create_question';
    document.getElementById('questionModalTitle').textContent = 'Add Question';
    document.getElementById('questionSubmitButtonText').textContent = 'Save Question';
    document.getElementById('choicesList').innerHTML = '';
    document.getElementById('choicesSection').style.display = 'none';
    document.getElementById('textAnswerSection').style.display = 'none';
}

} // End of initialization guard