/**
 * Quizzes DataTables Configuration and Functions
 */

// Global variables
var quizzesTable;
var currentQuizEditId = null;

$(document).ready(function() {
    console.log('Document ready - initializing quizzes...');
    // Prevent multiple initializations
    if (window.quizzesTableInitialized) {
        console.log('Quizzes already initialized, skipping...');
        return;
    }
    
    initializeQuizzesTable();
    setupModalEvents();
    
    // Load lessons immediately to ensure they're available
    console.log('Loading lessons on document ready...');
    loadLessons();
    
    window.quizzesTableInitialized = true;
    console.log('Quizzes initialization complete');
    // Note: loadLessons() will also be called when modal opens
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
        "columns": (function() {
            // Define columns based on user role
            if (window.isStudent) {
                // Student view - no ID column, no Actions column
                return [
                    { "data": "title", "width": "30%" },
                    { "data": "lesson_title", "width": "25%" },
                    { "data": "max_score", "width": "10%" },
                    { "data": "time_limit_minutes", "width": "15%" },
                    { "data": "created_at", "width": "20%" }
                ];
            } else {
                // Admin/Teacher view - full columns
                return [
                    { "data": "id", "width": "5%" },
                    { "data": "title", "width": "25%" },
                    { "data": "lesson_title", "width": "20%" },
                    { "data": "max_score", "width": "10%" },
                    { "data": "time_limit_minutes", "width": "15%" },
                    { "data": "created_at", "width": "10%" },
                    { "data": "status", "orderable": false, "width": "10%" },
                    { 
                        "data": "actions", 
                        "orderable": false,
                        "width": "15%",
                        "render": function(data, type, row) {
                            let actions = '';
                            
                            // Check permissions based on role
                            if (window.canEditQuizzes || window.canDeleteQuizzes) {
                                actions = '<div class="btn-group gap-2" role="group">';
                                
                                // Edit button
                                if (window.canEditQuizzes) {
                                    actions += `
                                        <button class="btn btn-outline-primary" onclick="editQuiz(${data})" title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    `;
                                }
                                
                                // Delete button
                                if (window.canDeleteQuizzes) {
                                    actions += `
                                        <button class="btn btn-outline-danger" onclick="deleteQuiz(${data})" title="Delete">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    `;
                                }
                                
                                actions += '</div>';
                            }
                            
                            return actions;
                        }
                    }
                ];
            }
        })(),
        "order": [[0, "desc"]],
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
    
    // Load lessons when modal is shown
    $('#quizModal').on('shown.bs.modal', function () {
        console.log('Modal shown event triggered');
        loadLessons();
    });
    
    // Also try loading lessons when modal is about to show
    $('#quizModal').on('show.bs.modal', function () {
        console.log('Modal show event triggered');
        loadLessons();
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
    console.log('Loading lessons...');
    
    // Wait a bit to ensure the modal is fully loaded
    setTimeout(() => {
        fetch("app/API/apiQuizzes.php?action=get_lessons")
            .then((response) => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then((data) => {
                console.log('API Response:', data);
                if (data.success) {
                    const select = document.getElementById("lesson_id");
                    console.log('Select element found:', select);
                    if (select) {
                        select.innerHTML = '<option value="">Select Lesson</option>';
                        if (data.data && data.data.length > 0) {
                            console.log('Adding lessons:', data.data.length);
                            data.data.forEach((lesson) => {
                                const option = document.createElement("option");
                                option.value = lesson.id;
                                option.textContent = lesson.title;
                                select.appendChild(option);
                                console.log('Added lesson:', lesson.title);
                            });
                        } else {
                            console.log('No lessons data found');
                            select.innerHTML = '<option value="">No lessons available</option>';
                        }
                    } else {
                        console.error('Select element not found!');
                        // Try again after a short delay
                        setTimeout(() => {
                            const select2 = document.getElementById("lesson_id");
                            if (select2) {
                                console.log('Select element found on retry');
                                select2.innerHTML = '<option value="">Select Lesson</option>';
                                if (data.data && data.data.length > 0) {
                                    data.data.forEach((lesson) => {
                                        const option = document.createElement("option");
                                        option.value = lesson.id;
                                        option.textContent = lesson.title;
                                        select2.appendChild(option);
                                    });
                                }
                            }
                        }, 500);
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
 * Reset quiz form
 */
function resetQuizForm() {
    document.getElementById('quizForm').reset();
    document.getElementById('formAction').value = 'create_quiz';
    document.getElementById('modalTitle').textContent = 'Add New Quiz';
    document.getElementById('quizId').value = '';
    currentQuizEditId = null;
    
    // Reload lessons after form reset
    loadLessons();
    
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
    const requiredFields = ['lesson_id', 'title', 'max_score'];
    
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
    console.log('Loading lessons for edit mode...');
    
    fetch("app/API/apiQuizzes.php?action=get_lessons")
        .then((response) => response.json())
        .then((data) => {
            console.log('Lessons loaded for edit:', data);
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
                        
                        // Now populate the form with quiz data
                        populateQuizForm(quizData);
                        
                        // Set form action and title
                        document.getElementById('formAction').value = 'update_quiz';
                        document.getElementById('modalTitle').textContent = 'Edit Quiz';
                        
                        // Show the modal
                        $('#quizModal').modal('show');
                    } else {
                        console.log('No lessons data found');
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
 * Populate quiz form with data
 */
function populateQuizForm(quiz) {
    console.log('Populating quiz form with data:', quiz);
    document.getElementById('quizId').value = quiz.id;
    document.getElementById('lesson_id').value = quiz.lesson_id;
    document.getElementById('title').value = quiz.title;
    document.getElementById('max_score').value = quiz.max_score;
    document.getElementById('time_limit_minutes').value = quiz.time_limit_minutes || '';
    
    console.log('Form populated. Lesson ID set to:', quiz.lesson_id);
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
            Swal.fire({
                title: 'Quiz Details',
                html: `
                    <div class="text-start">
                        <p><strong>Title:</strong> ${quiz.title}</p>
                        <p><strong>Lesson:</strong> ${quiz.lesson_title || 'N/A'}</p>
                        <p><strong>Max Score:</strong> ${quiz.max_score}</p>
                        <p><strong>Time Limit:</strong> ${quiz.time_limit_minutes ? quiz.time_limit_minutes + ' minutes' : 'No limit'}</p>
                        <p><strong>Created:</strong> ${new Date(quiz.created_at).toLocaleDateString()}</p>
                    </div>
                `,
                icon: 'info',
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
            text: 'Failed to load quiz details.'
        });
    });
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
