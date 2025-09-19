/**
 * Lessons DataTables Configuration and Functions
 */

// Global variables
let lessonsTable;
let currentLessonEditId = null;

$(document).ready(function() {
    initializeLessonsTable();
    setupModalEvents();
    // Note: CommonAPI.loadSubjects() will be called when modal opens
});

/**
 * Initialize Lessons DataTable
 */
function initializeLessonsTable() {
    lessonsTable = $('#lessonsTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiLessons.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load lessons data.'
                });
            }
        },
        "columns": [
            { "data": "title", "width": "30%" },
            { "data": "content", "width": "40%", "render": function(data, type, row) {
                if (type === 'display' && data && data.length > 100) {
                    return data.substr(0, 100) + '...';
                }
                return data;
            }},
            { "data": "created_at", "width": "15%" },
            { "data": "status", "orderable": false, "width": "10%" },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = '';
                    
                    // Check permissions based on role
                    if (window.canEditLessons || window.canDeleteLessons) {
                        actions = '<div class="btn-group gap-2" role="group">';
                        
                        // Edit button
                        if (window.canEditLessons) {
                            actions += `
                                <button class="btn btn-outline-primary" onclick="editLesson(${row.id})" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            `;
                        }
                        
                        // Delete button
                        if (window.canDeleteLessons) {
                            actions += `
                                <button class="btn btn-outline-danger" onclick="deleteLesson(${row.id})" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            `;
                        }
                        
                        actions += '</div>';
                    }
                    
                    return actions;
                }
            }
        ],
        "order": [[2, "desc"]],
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading lessons...",
            "emptyTable": "No lessons found",
            "zeroRecords": "No matching lessons found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#lessonModal').on('hidden.bs.modal', function () {
        resetLessonForm();
    });
    
    // Load subjects when modal is shown
    $('#lessonModal').on('shown.bs.modal', function () {
        CommonAPI.loadSubjects();
    });
    
    // Form validation
    $('#lessonForm').on('submit', function(e) {
        e.preventDefault();
        saveLesson();
    });
}

/**
 * Reset lesson form
 */
function resetLessonForm() {
    document.getElementById('lessonForm').reset();
    document.getElementById('formAction').value = 'create_lesson';
    document.getElementById('modalTitle').textContent = 'Add New Lesson';
    document.getElementById('lessonId').value = '';
    currentLessonEditId = null;
    
    // Reset validation classes
    $('#lessonForm .form-control').removeClass('is-valid is-invalid');
    $('#lessonForm .form-text').remove();
}

/**
 * Save Lesson (Create or Update)
 */
function saveLesson() {
    const form = document.getElementById('lessonForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateLessonForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiLessons.php';
    
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
                $('#lessonModal').modal('hide');
                lessonsTable.ajax.reload();
                resetLessonForm();
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
            text: 'An error occurred while saving the lesson.'
        });
    });
}

/**
 * Validate lesson form
 */
function validateLessonForm() {
    let isValid = true;
    const requiredFields = ['subject_id', 'title', 'content'];
    
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
    
    // Additional validation
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    
    if (title.length < 3) {
        document.getElementById('title').classList.add('is-invalid');
        isValid = false;
    }
    
    if (content.length < 10) {
        document.getElementById('content').classList.add('is-invalid');
        isValid = false;
    }
    
    return isValid;
}


/**
 * Edit Lesson
 */
function editLesson(id) {
    currentLessonEditId = id;
    
    const formData = new FormData();
    formData.append('action', 'get_lesson');
    formData.append('id', id);
    
    fetch(`app/API/apiLessons.php`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateLessonForm(data.data);
            document.getElementById('formAction').value = 'update_lesson';
            document.getElementById('modalTitle').textContent = 'Edit Lesson';
            $('#lessonModal').modal('show');
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
            text: 'Failed to load lesson data.'
        });
    });
}

/**
 * Populate lesson form with data
 */
function populateLessonForm(lesson) {
    document.getElementById('lessonId').value = lesson.id;
    document.getElementById('subject_id').value = lesson.subject_id;
    document.getElementById('title').value = lesson.title;
    document.getElementById('content').value = lesson.content;
}


/**
 * Delete Lesson
 */
function deleteLesson(id) {
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
            formData.append('action', 'delete_lesson');
            formData.append('id', id);
            
            fetch('app/API/apiLessons.php', {
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
                        lessonsTable.ajax.reload();
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
                    text: 'An error occurred while deleting the lesson.'
                });
            });
        }
    });
}

/**
 * Refresh DataTable
 */
function refreshLessonsTable() {
    if (lessonsTable) {
        lessonsTable.ajax.reload();
    }
}

