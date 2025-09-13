/**
 * Students DataTables Configuration and Functions
 */

// Global variables
let studentsTable;
let currentStudentEditId = null;

$(document).ready(function() {
    initializeStudentsTable();
    setupModalEvents();
});

/**
 * Initialize Students DataTable
 */
function initializeStudentsTable() {
    studentsTable = $('#studentsTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiStudents.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load students data.'
                });
            }
        },
        "columns": [
            { "data": "id", "width": "5%" },
            { "data": "full_name", "width": "20%" },
            { "data": "email", "width": "20%" },
            { "data": "course", "width": "15%" },
            { "data": "year_level", "width": "10%" },
            { "data": "activity_submissions", "orderable": false, "width": "8%" },
            { "data": "quiz_submissions", "orderable": false, "width": "8%" },
            { "data": "average_grade", "orderable": false, "width": "8%" },
            { "data": "created_at", "width": "10%" },
            { "data": "status", "orderable": false, "width": "10%" },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = '';
                    
                    // Check permissions based on role
                    if (window.canEditStudents || window.canDeleteStudents) {
                        actions = '<div class="btn-group gap-2" role="group">';
                        
                        // Edit button
                        if (window.canEditStudents) {
                            actions += `
                                <button class="btn btn-outline-primary" onclick="editStudent(${data})" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            `;
                        }
                        
                        // Delete button
                        if (window.canDeleteStudents) {
                            actions += `
                                <button class="btn btn-outline-danger" onclick="deleteStudent(${data})" title="Delete">
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
            "processing": "Loading students...",
            "emptyTable": "No students found",
            "zeroRecords": "No matching students found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#studentModal').on('hidden.bs.modal', function () {
        resetStudentForm();
    });
    
    // Form validation
    $('#studentForm').on('submit', function(e) {
        e.preventDefault();
        saveStudent();
    });
    
    // Real-time validation for email
    $('#email').on('blur', function() {
        validateEmail();
    });
}

/**
 * Reset student form
 */
function resetStudentForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('formAction').value = 'create_student';
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('studentId').value = '';
    currentStudentEditId = null;
    
    // Set default course and year level
    document.getElementById('course').value = 'BSIT';
    document.getElementById('year_level').value = '1st';
    
    // Reset validation classes
    $('#studentForm .form-control').removeClass('is-valid is-invalid');
    $('#studentForm .form-text').remove();
}

/**
 * Save Student (Create or Update)
 */
function saveStudent() {
    const form = document.getElementById('studentForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateStudentForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiStudents.php';
    
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
                $('#studentModal').modal('hide');
                studentsTable.ajax.reload();
                resetStudentForm();
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
            text: 'An error occurred while saving the student.'
        });
    });
}

/**
 * Validate student form
 */
function validateStudentForm() {
    let isValid = true;
    const requiredFields = ['first_name', 'last_name', 'email', 'password'];
    
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
    const excludeId = currentStudentEditId;
    
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
    
    let url = `app/API/apiStudents.php?action=check_email&email=${encodeURIComponent(email)}`;
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
 * Edit Student
 */
function editStudent(id) {
    currentStudentEditId = id;
    
    fetch(`app/API/apiStudents.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_student&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateStudentForm(data.data);
            document.getElementById('formAction').value = 'update_student';
            document.getElementById('modalTitle').textContent = 'Edit Student';
            $('#studentModal').modal('show');
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
            text: 'Failed to load student data.'
        });
    });
}

/**
 * Populate student form with data
 */
function populateStudentForm(student) {
    document.getElementById('studentId').value = student.id;
    document.getElementById('first_name').value = student.first_name;
    document.getElementById('last_name').value = student.last_name;
    document.getElementById('email').value = student.email;
    
    // Course and year level are automatically set to BSIT - 1st Year
    document.getElementById('course').value = 'BSIT';
    document.getElementById('year_level').value = '1st';
    
    // Clear password field for edit
    document.getElementById('password').value = '';
    
    // Make password optional for edit
    $('#password').removeAttr('required');
    $('#password').prev('label').html('Password <small class="text-muted">(leave blank to keep current)</small>');
}

/**
 * View Student Details
 */
function viewStudent(id) {
    fetch(`app/API/apiStudents.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_student&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const student = data.data;
            Swal.fire({
                title: 'Student Details',
                html: `
                    <div class="text-start">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Name:</strong> ${student.first_name} ${student.last_name}</p>
                                <p><strong>Email:</strong> ${student.email}</p>
                                <p><strong>Course:</strong> ${student.course}</p>
                                <p><strong>Year Level:</strong> ${student.year_level}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Created:</strong> ${new Date(student.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Close',
                width: '700px'
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
            text: 'Failed to load student details.'
        });
    });
}

/**
 * View Student Submissions
 */
function viewSubmissions(id) {
    fetch(`app/API/apiStudents.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_student_submissions&id=${id}`
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
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                submissions.forEach(submission => {
                    const typeBadge = submission.type === 'activity' ? 'badge bg-primary' : 'badge bg-info';
                    const statusBadge = submission.grading_status === 'graded' ? 'badge bg-success' : 'badge bg-warning';
                    
                    submissionsHtml += `
                        <tr>
                            <td><span class="${typeBadge}">${submission.type}</span></td>
                            <td>${submission.title}</td>
                            <td><span class="${statusBadge}">${submission.status || submission.grading_status}</span></td>
                            <td>${submission.score || 'N/A'}</td>
                            <td>${new Date(submission.submitted_at).toLocaleDateString()}</td>
                        </tr>
                    `;
                });
                
                submissionsHtml += '</tbody></table></div>';
            }
            
            Swal.fire({
                title: 'Student Submissions',
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
            text: 'Failed to load student submissions.'
        });
    });
}

/**
 * View Student Statistics
 */
function viewStatistics(id) {
    fetch(`app/API/apiStudents.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_student_statistics&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.data;
            Swal.fire({
                title: 'Student Statistics',
                html: `
                    <div class="text-start">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Activity Submissions</h6>
                                <p><strong>Total:</strong> ${stats.total_activity_submissions}</p>
                                <p><strong>Graded:</strong> ${stats.graded_activities}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Quiz Performance</h6>
                                <p><strong>Total Quizzes:</strong> ${stats.total_quiz_submissions}</p>
                                <p><strong>Average Score:</strong> ${stats.average_quiz_score ? stats.average_quiz_score.toFixed(2) : 'N/A'}</p>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Overall Performance</h6>
                                <p><strong>Final Grade:</strong> ${stats.overall_grade ? stats.overall_grade.toFixed(2) : 'N/A'}</p>
                            </div>
                        </div>
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
            text: 'Failed to load student statistics.'
        });
    });
}

/**
 * Delete Student
 */
function deleteStudent(id) {
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
            formData.append('action', 'delete_student');
            formData.append('id', id);
            
            fetch('app/API/apiStudents.php', {
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
                        studentsTable.ajax.reload();
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
                    text: 'An error occurred while deleting the student.'
                });
            });
        }
    });
}

/**
 * Refresh DataTable
 */
function refreshStudentsTable() {
    if (studentsTable) {
        studentsTable.ajax.reload();
    }
}

/**
 * Export students data to CSV
 */
function exportStudentsData() {
    fetch('app/API/apiStudents.php?action=list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const students = data.data;
            let csvContent = "ID,Full Name,Email,Course,Year Level,Activity Submissions,Quiz Submissions,Average Grade,Created\n";
            
            students.forEach(student => {
                csvContent += `"${student.id}","${student.first_name} ${student.last_name}","${student.email}","${student.course}","${student.year_level}","${student.activity_submissions}","${student.quiz_submissions}","${student.average_grade || 'N/A'}","${student.created_at}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'students_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to export student data.'
        });
    });
}
