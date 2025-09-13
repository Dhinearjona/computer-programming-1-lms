/**
 * Teachers DataTables Configuration and Functions
 */

// Global variables
let teachersTable;
let currentTeacherEditId = null;

$(document).ready(function() {
    initializeTeachersTable();
    setupModalEvents();
});

/**
 * Initialize Teachers DataTable
 */
function initializeTeachersTable() {
    teachersTable = $('#teachersTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiTeachers.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load teachers data.'
                });
            }
        },
        "columns": [
            { "data": "id", "width": "5%" },
            { "data": "full_name", "width": "20%" },
            { "data": "email", "width": "25%" },
            { "data": "department", "width": "20%" },
            { "data": "created_at", "width": "15%" },
            { "data": "status", "orderable": false, "width": "10%" },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = '';
                    
                    // Check permissions based on role
                    if (window.canEditTeachers || window.canDeleteTeachers) {
                        actions = '<div class="btn-group gap-2" role="group">';
                        
                        // Edit button
                        if (window.canEditTeachers) {
                            actions += `
                                <button class="btn btn-outline-primary" onclick="editTeacher(${row.id})" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            `;
                        }
                        
                        // Delete button
                        if (window.canDeleteTeachers) {
                            actions += `
                                <button class="btn btn-outline-danger" onclick="deleteTeacher(${row.id})" title="Delete">
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
        "order": [[0, "desc"]],
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading teachers...",
            "emptyTable": "No teachers found",
            "zeroRecords": "No matching teachers found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#teacherModal').on('hidden.bs.modal', function () {
        resetTeacherForm();
    });
    
    // Form validation
    $('#teacherForm').on('submit', function(e) {
        e.preventDefault();
        saveTeacher();
    });
    
    // Real-time validation for email
    $('#email').on('blur', function() {
        validateEmail();
    });
}

/**
 * Reset teacher form
 */
function resetTeacherForm() {
    document.getElementById('teacherForm').reset();
    document.getElementById('formAction').value = 'create_teacher';
    document.getElementById('modalTitle').textContent = 'Add New Teacher';
    document.getElementById('teacherId').value = '';
    currentTeacherEditId = null;
    
    // Reset validation classes
    $('#teacherForm .form-control').removeClass('is-valid is-invalid');
    $('#teacherForm .form-text').remove();
    
    // Reset password field
    $('#password').attr('required', 'required');
    $('#password').prev('label').html('Password <span class="text-danger">*</span>');
}

/**
 * Save Teacher (Create or Update)
 */
function saveTeacher() {
    const form = document.getElementById('teacherForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateTeacherForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiTeachers.php';
    
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
                $('#teacherModal').modal('hide');
                teachersTable.ajax.reload();
                resetTeacherForm();
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
            text: 'An error occurred while saving the teacher.'
        });
    });
}

/**
 * Validate teacher form
 */
function validateTeacherForm() {
    let isValid = true;
    const requiredFields = ['first_name', 'last_name', 'email', 'password', 'department'];
    
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
 * Validate email uniqueness
 */
function validateEmail() {
    const email = $('#email').val();
    const excludeId = currentTeacherEditId;
    
    if (!email) return;
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const element = $('#email');
    
    if (!emailRegex.test(email)) {
        element.removeClass('is-valid').addClass('is-invalid');
        element.next('.form-text').remove();
        element.after('<div class="form-text text-danger">Invalid email format</div>');
        return;
    }
    
    let url = `app/API/apiTeachers.php?action=check_email&email=${encodeURIComponent(email)}`;
    if (excludeId) {
        url += `&exclude_id=${excludeId}`;
    }
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            element.removeClass('is-valid').addClass('is-invalid');
            element.next('.form-text').remove();
            element.after('<div class="form-text text-danger">Email already exists</div>');
        } else {
            element.removeClass('is-invalid').addClass('is-valid');
            element.next('.form-text').remove();
            element.after('<div class="form-text text-success">Email is available</div>');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * Edit Teacher
 */
function editTeacher(id) {
    console.log('Editing teacher with ID:', id);
    currentTeacherEditId = id;
    
    fetch(`app/API/apiTeachers.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_teacher&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateTeacherForm(data.data);
            document.getElementById('formAction').value = 'update_teacher';
            document.getElementById('modalTitle').textContent = 'Edit Teacher';
            $('#teacherModal').modal('show');
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
            text: 'Failed to load teacher data.'
        });
    });
}

/**
 * Populate teacher form with data
 */
function populateTeacherForm(teacher) {
    document.getElementById('teacherId').value = teacher.id;
    document.getElementById('first_name').value = teacher.first_name;
    document.getElementById('last_name').value = teacher.last_name;
    document.getElementById('email').value = teacher.email;
    document.getElementById('department').value = teacher.department;
    
    // Clear password field for edit
    document.getElementById('password').value = '';
    
    // Make password optional for edit
    $('#password').removeAttr('required');
    $('#password').prev('label').html('Password <small class="text-muted">(leave blank to keep current)</small>');
}


/**
 * Delete Teacher
 */
function deleteTeacher(id) {
    console.log('Deleting teacher with ID:', id);
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
            formData.append('action', 'delete_teacher');
            formData.append('id', id);
            
            fetch('app/API/apiTeachers.php', {
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
                        teachersTable.ajax.reload();
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
                    text: 'An error occurred while deleting the teacher.'
                });
            });
        }
    });
}

/**
 * Refresh DataTable
 */
function refreshTeachersTable() {
    if (teachersTable) {
        teachersTable.ajax.reload();
    }
}

