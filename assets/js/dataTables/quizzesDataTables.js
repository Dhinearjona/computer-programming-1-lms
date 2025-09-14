/**
 * Quizzes DataTables Configuration and Functions
 */

// Global variables
var quizzesTable;
var currentQuizEditId = null;

$(document).ready(function() {
    // Prevent multiple initializations
    if (window.quizzesTableInitialized) {
        return;
    }
    
    initializeQuizzesTable();
    setupModalEvents();
    window.quizzesTableInitialized = true;
});

/**
 * Initialize Quizzes DataTable
 */
function initializeQuizzesTable() {
    // Check if DataTable already exists
    if ($.fn.DataTable.isDataTable('#quizzesTable')) {
        quizzesTable = $('#quizzesTable').DataTable();
        return;
    }
    
    quizzesTable = $('#quizzesTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiQuizzes.php?action=datatable",
            "type": "GET",
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
            { 
                "data": "title", 
                "width": "25%",
                "render": function(data, type, row) {
                    return `<strong>${data}</strong>`;
                }
            },
            { 
                "data": "lesson_title", 
                "width": "20%",
                "render": function(data, type, row) {
                    return data || 'N/A';
                }
            },
            { 
                "data": "grading_period_name", 
                "width": "15%",
                "render": function(data, type, row) {
                    if (data) {
                        let badgeClass = 'badge bg-primary';
                        if (data.toLowerCase().includes('prelim')) badgeClass = 'badge bg-info';
                        else if (data.toLowerCase().includes('midterm')) badgeClass = 'badge bg-warning';
                        else if (data.toLowerCase().includes('finals')) badgeClass = 'badge bg-danger';
                        return `<span class="${badgeClass}">${data}</span>`;
                    }
                    return '<span class="badge bg-secondary">N/A</span>';
                }
            },
            { 
                "data": "max_score", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data ? `${data}` : '0';
                }
            },
            { 
                "data": "time_limit_minutes", 
                "width": "12%",
                "render": function(data, type, row) {
                    return data ? `${data} min` : 'No limit';
                }
            },
            { 
                "data": "created_at", 
                "width": "13%",
                "render": function(data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        return date.toLocaleDateString();
                    }
                    return 'N/A';
                }
            },
            { 
                "data": "status", 
                "orderable": false, 
                "width": "10%",
                "render": function(data, type, row) {
                    let badgeClass = '';
                    let badgeText = '';
                    
                    switch(data) {
                        case 'active':
                            badgeClass = 'badge bg-success';
                            badgeText = 'Active';
                            break;
                        case 'inactive':
                            badgeClass = 'badge bg-secondary';
                            badgeText = 'Inactive';
                            break;
                        case 'completed':
                            badgeClass = 'badge bg-info';
                            badgeText = 'Completed';
                            break;
                        default:
                            badgeClass = 'badge bg-success';
                            badgeText = 'Active';
                    }
                    
                    return `<span class="${badgeClass}">${badgeText}</span>`;
                }
            },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = '<div class="btn-group gap-1" role="group">';
                    
                    // View Details button (always available)
                    actions += `
                        <button class="btn btn-outline-info" onclick="viewQuiz(${data})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;
                    
                    // Edit button (for admin/teacher)
                    if (window.canEditQuizzes) {
                        actions += `
                            <button class="btn btn-outline-primary" onclick="editQuiz(${data})" title="Edit Quiz">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                    }
                    
                    // Delete button (only for admin)
                    if (window.canDeleteQuizzes && window.isAdmin) {
                        actions += `
                            <button class="btn btn-outline-danger" onclick="deleteQuiz(${data})" title="Delete Quiz">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                    }
                    
                    actions += '</div>';
                    return actions;
                }
            }
        ],
        "order": [[0, "asc"]],
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
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#quizModal').on('hidden.bs.modal', function () {
        resetQuizForm();
    });
    
    // Clear quiz details modal content when closed
    $('#quizDetailsModal').on('hidden.bs.modal', function () {
        document.getElementById('quizDetailsContent').innerHTML = '';
    });
    
    // Load lessons and grading periods when modal is shown
    $('#quizModal').on('shown.bs.modal', function () {
        loadLessons();
        loadGradingPeriods();
    });
    
    // Also try loading lessons and grading periods when modal is about to show
    $('#quizModal').on('show.bs.modal', function () {
        loadLessons();
        loadGradingPeriods();
    });
    
    // Form validation
    $('#quizForm').on('submit', function(e) {
        e.preventDefault();
        saveQuiz();
    });
}

/**
 * Load lessons for dropdown
 */
function loadLessons() {
    const select = document.getElementById("lesson_id");
    
    // Wait a bit to ensure the modal is fully loaded
    setTimeout(() => {
        fetch("app/API/apiQuizzes.php?action=get_lessons")
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    if (select) {
                        select.innerHTML = '<option value="">Select Lesson</option>';
                        if (data.data && data.data.length > 0) {
                            data.data.forEach((lesson) => {
                                const option = document.createElement("option");
                                option.value = lesson.id;
                                option.textContent = lesson.title;
                                select.appendChild(option);
                            });
                        } else {
                            select.innerHTML = '<option value="">No lessons available</option>';
                        }
                    } else {
                        console.error('Select element not found!');
                    }
                } else {
                    console.error('API returned error:', data.message);
                }
            })
            .catch((error) => {
                console.error("Error loading lessons:", error);
            });
    }, 100);
}

/**
 * Load grading periods for dropdown
 */
function loadGradingPeriods() {
    const select = document.getElementById("grading_period_id");
    
    // Wait a bit to ensure the modal is fully loaded
    setTimeout(() => {
        fetch("app/API/apiQuizzes.php?action=get_grading_periods")
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    if (select) {
                        select.innerHTML = '<option value="">Select Grading Period</option>';
                        if (data.data && data.data.length > 0) {
                            data.data.forEach((period) => {
                                const option = document.createElement("option");
                                option.value = period.id;
                                option.textContent = `${period.name} (${period.semester_name} ${period.academic_year})`;
                                select.appendChild(option);
                            });
                        } else {
                            select.innerHTML = '<option value="">No grading periods available</option>';
                        }
                    } else {
                        console.error('Grading period select element not found!');
                    }
                } else {
                    console.error('Grading periods API returned error:', data.message);
                }
            })
            .catch((error) => {
                console.error("Error loading grading periods:", error);
            });
    }, 100);
}

/**
 * Reset quiz form
 */
function resetQuizForm() {
    document.getElementById('quizForm').reset();
    document.getElementById('formAction').value = 'create_quiz';
    document.getElementById('modalTitle').textContent = 'Add New Quiz';
    document.getElementById('quizId').value = '';
    currentQuizEditId = null;
    
    // Reload lessons and grading periods after form reset
    loadLessons();
    loadGradingPeriods();
    
    // Reset validation classes
    $('#quizForm .form-control').removeClass('is-valid is-invalid');
}

/**
 * Save Quiz (Create or Update)
 */
function saveQuiz() {
    const form = document.getElementById('quizForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateQuizForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiQuizzes.php';
    
    fetch(url, {
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
                $('#quizModal').modal('hide');
                quizzesTable.ajax.reload();
                resetQuizForm();
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
            text: 'An error occurred while saving the quiz.'
        });
    });
}

/**
 * Validate quiz form
 */
function validateQuizForm() {
    let isValid = true;
    const requiredFields = ['lesson_id', 'grading_period_id', 'title', 'max_score'];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            isValid = false;
        } else {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
        }
    });
    
    return isValid;
}

/**
 * Edit Quiz
 */
function editQuiz(id) {
    currentQuizEditId = id;
    
    fetch(`app/API/apiQuizzes.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_quiz&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Load lessons first, then populate form
            loadLessonsForEdit(data.data);
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
            text: 'Failed to load quiz data.'
        });
    });
}

/**
 * Load lessons for edit mode
 */
function loadLessonsForEdit(quizData) {
    fetch("app/API/apiQuizzes.php?action=get_lessons")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const select = document.getElementById("lesson_id");
                if (select) {
                    select.innerHTML = '<option value="">Select Lesson</option>';
                    if (data.data && data.data.length > 0) {
                        data.data.forEach((lesson) => {
                            const option = document.createElement("option");
                            option.value = lesson.id;
                            option.textContent = lesson.title;
                            select.appendChild(option);
                        });
                        
                        // Load grading periods for edit mode
                        loadGradingPeriodsForEdit(quizData);
                    } else {
                        select.innerHTML = '<option value="">No lessons available</option>';
                    }
                } else {
                    console.error('Select element not found!');
                }
            } else {
                console.error('API returned error:', data.message);
            }
        })
        .catch((error) => {
            console.error("Error loading lessons for edit:", error);
        });
}

/**
 * Load grading periods for edit mode
 */
function loadGradingPeriodsForEdit(quizData) {
    fetch("app/API/apiQuizzes.php?action=get_grading_periods")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const select = document.getElementById("grading_period_id");
                if (select) {
                    select.innerHTML = '<option value="">Select Grading Period</option>';
                    if (data.data && data.data.length > 0) {
                        data.data.forEach((period) => {
                            const option = document.createElement("option");
                            option.value = period.id;
                            option.textContent = `${period.name} (${period.semester_name} ${period.academic_year})`;
                            select.appendChild(option);
                        });
                        
                        // Now populate the form with quiz data
                        populateQuizForm(quizData);
                        
                        // Set form action and title
                        document.getElementById('formAction').value = 'update_quiz';
                        document.getElementById('modalTitle').textContent = 'Edit Quiz';
                        document.getElementById('submitButtonText').textContent = 'Update';
                        
                        // Show the modal
                        $('#quizModal').modal('show');
                    } else {
                        select.innerHTML = '<option value="">No grading periods available</option>';
                    }
                } else {
                    console.error('Grading period select element not found!');
                }
            } else {
                console.error('API returned error:', data.message);
            }
        })
        .catch((error) => {
            console.error("Error loading grading periods for edit:", error);
        });
}

/**
 * Populate quiz form with data
 */
function populateQuizForm(quiz) {
    document.getElementById('quizId').value = quiz.id;
    document.getElementById('lesson_id').value = quiz.lesson_id;
    document.getElementById('grading_period_id').value = quiz.grading_period_id;
    document.getElementById('title').value = quiz.title;
    document.getElementById('max_score').value = quiz.max_score;
    document.getElementById('time_limit_minutes').value = quiz.time_limit_minutes || '';
}

/**
 * View Quiz Details
 */
function viewQuiz(id) {
    fetch(`app/API/apiQuizzes.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_quiz&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const quiz = data.data;
            populateQuizDetailsModal(quiz);
            $('#quizDetailsModal').modal('show');
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
            text: 'Failed to load quiz details.'
        });
    });
}

/**
 * Populate quiz details modal
 */
function populateQuizDetailsModal(quiz) {
    const content = document.getElementById('quizDetailsContent');
    
    // Get grading period badge class
    let gradingPeriodBadgeClass = 'badge bg-primary';
    if (quiz.grading_period_name) {
        const periodName = quiz.grading_period_name.toLowerCase();
        if (periodName.includes('prelim')) gradingPeriodBadgeClass = 'badge bg-info';
        else if (periodName.includes('midterm')) gradingPeriodBadgeClass = 'badge bg-warning';
        else if (periodName.includes('finals')) gradingPeriodBadgeClass = 'badge bg-danger';
    }
    
    // Get status badge class
    let statusBadgeClass = 'badge bg-success';
    let statusText = 'Active';
    if (quiz.grading_period_status) {
        switch (quiz.grading_period_status) {
            case 'completed':
                statusBadgeClass = 'badge bg-info';
                statusText = 'Completed';
                break;
            case 'inactive':
                statusBadgeClass = 'badge bg-secondary';
                statusText = 'Inactive';
                break;
            case 'pending':
                statusBadgeClass = 'badge bg-warning';
                statusText = 'Pending';
                break;
        }
    }
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title text-primary">
                            <i class="bi bi-card-heading"></i> Quiz Information
                        </h6>
                        <div class="mb-2">
                            <strong>Title:</strong><br>
                            <span class="text-dark">${quiz.title}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Lesson:</strong><br>
                            <span class="text-muted">${quiz.lesson_title || 'N/A'}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Grading Period:</strong><br>
                            <span class="${gradingPeriodBadgeClass}">${quiz.grading_period_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title text-success">
                            <i class="bi bi-trophy"></i> Quiz Settings
                        </h6>
                        <div class="mb-2">
                            <strong>Max Score:</strong><br>
                            <span class="badge bg-primary">${quiz.max_score} points</span>
                        </div>
                        <div class="mb-2">
                            <strong>Time Limit:</strong><br>
                            <span class="text-muted">
                                ${quiz.time_limit_minutes ? quiz.time_limit_minutes + ' minutes' : 'No time limit'}
                            </span>
                        </div>
                        <div class="mb-2">
                            <strong>Status:</strong><br>
                            <span class="${statusBadgeClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title text-info">
                            <i class="bi bi-calendar"></i> Additional Information
                        </h6>
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Created:</strong><br>
                                <span class="text-muted">${new Date(quiz.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Subject:</strong><br>
                                <span class="text-muted">${quiz.subject_name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert alert-info mt-3">
            <h6><i class="bi bi-info-circle"></i> Quiz Guidelines</h6>
            <ul class="mb-0">
                <li>Students can take this quiz during the specified grading period</li>
                <li>Time limit applies if specified, otherwise no time restriction</li>
                <li>Quiz status depends on the grading period status</li>
                <li>All quiz attempts are recorded and graded automatically</li>
            </ul>
        </div>
    `;
}

/**
 * View Quiz Submissions
 */
function viewSubmissions(id) {
    fetch(`app/API/apiQuizzes.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_quiz_submissions&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const submissions = data.data;
            let submissionsHtml = '';
            
            if (submissions.length === 0) {
                submissionsHtml = '<p class="text-muted">No submissions yet.</p>';
            } else {
                submissionsHtml = `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Student Number</th>
                                    <th>Score</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                submissions.forEach(submission => {
                    submissionsHtml += `
                        <tr>
                            <td>${submission.first_name} ${submission.last_name}</td>
                            <td>${submission.student_number}</td>
                            <td>${submission.score}</td>
                            <td>${new Date(submission.created_at).toLocaleDateString()}</td>
                        </tr>
                    `;
                });
                
                submissionsHtml += '</tbody></table></div>';
            }
            
            Swal.fire({
                title: 'Quiz Submissions',
                html: submissionsHtml,
                icon: 'info',
                confirmButtonText: 'Close',
                width: '800px'
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
            text: 'Failed to load quiz submissions.'
        });
    });
}

/**
 * Delete Quiz
 */
function deleteQuiz(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
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
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        quizzesTable.ajax.reload();
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
                    text: 'An error occurred while deleting the quiz.'
                });
            });
        }
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

/**
 * Export quiz data to CSV
 */
function exportQuizzesData() {
    fetch('app/API/apiQuizzes.php?action=list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const quizzes = data.data;
            let csvContent = "ID,Title,Lesson,Max Score,Time Limit,Submissions,Created\n";
            
            quizzes.forEach(quiz => {
                csvContent += `"${quiz.id}","${quiz.title}","${quiz.lesson_title || 'N/A'}","${quiz.max_score}","${quiz.time_limit_minutes || 'No limit'}","${quiz.submission_count}","${quiz.created_at}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quizzes_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to export quiz data.'
        });
    });
}
