/**
 * Grades DataTables Configuration and Functions
 */

// Global variables
let gradesTable;
let currentGradeEditId = null;

$(document).ready(function() {
    initializeGradesTable();
    setupModalEvents();
    
    // Only load students for admin/teacher views
    if (!window.isStudent) {
        loadStudents();
    }
});

/**
 * Initialize Grades DataTable
 */
function initializeGradesTable() {
    // Check if table is already initialized
    if ($.fn.DataTable.isDataTable('#gradesTable')) {
        $('#gradesTable').DataTable().destroy();
    }
    
    gradesTable = $('#gradesTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiGrades.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load grades data.'
                });
            }
        },
        "columns": (function() {
            // Define columns based on user role
            if (window.isStudent) {
                // Student view - only show grade columns
                return [
                    { "data": "activity_score", "width": "20%" },
                    { "data": "quiz_score", "width": "20%" },
                    { "data": "exam_score", "width": "20%" },
                    { "data": "final_grade", "width": "20%" },
                    { 
                        "data": "status", 
                        "orderable": false, 
                        "width": "20%",
                        "render": function(data, type, row) {
                            let badgeClass = '';
                            let badgeText = '';
                            
                            switch(data) {
                                case 'pass':
                                    badgeClass = 'badge bg-success';
                                    badgeText = 'Pass';
                                    break;
                                case 'fail':
                                    badgeClass = 'badge bg-danger';
                                    badgeText = 'Fail';
                                    break;
                                case 'pending':
                                    badgeClass = 'badge bg-warning';
                                    badgeText = 'Pending';
                                    break;
                                default:
                                    badgeClass = 'badge bg-secondary';
                                    badgeText = data;
                            }
                            
                            return `<span class="${badgeClass}">${badgeText}</span>`;
                        }
                    }
                ];
            } else {
                // Admin/Teacher view - show all columns with actions
                return [
                    { "data": "id", "width": "5%" },
                    { "data": "full_name", "width": "15%" },
                    { "data": "email", "width": "15%" },
                    { "data": "course", "width": "10%" },
                    { "data": "year_level", "width": "10%" },
                    { "data": "activity_score", "width": "10%" },
                    { "data": "quiz_score", "width": "10%" },
                    { "data": "exam_score", "width": "10%" },
                    { "data": "final_grade", "width": "10%" },
                    { 
                        "data": "status", 
                        "orderable": false, 
                        "width": "10%",
                        "render": function(data, type, row) {
                            let badgeClass = '';
                            let badgeText = '';
                            
                            switch(data) {
                                case 'pass':
                                    badgeClass = 'badge bg-success';
                                    badgeText = 'Pass';
                                    break;
                                case 'fail':
                                    badgeClass = 'badge bg-danger';
                                    badgeText = 'Fail';
                                    break;
                                case 'pending':
                                    badgeClass = 'badge bg-warning';
                                    badgeText = 'Pending';
                                    break;
                                default:
                                    badgeClass = 'badge bg-secondary';
                                    badgeText = data;
                            }
                            
                            return `<span class="${badgeClass}">${badgeText}</span>`;
                        }
                    },
                    { 
                        "data": "actions", 
                        "orderable": false,
                        "width": "10%",
                        "render": function(data, type, row) {
                            let actions = '';
                            
                            // Check permissions based on role
                            if (window.canManageGrades) {
                                actions = '<div class="btn-group gap-2" role="group">';
                                
                                // Edit button
                                actions += `
                                    <button class="btn btn-outline-primary" onclick="editGrade(${row.id})" title="Edit">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                `;
                                
                                // Delete button
                                actions += `
                                    <button class="btn btn-outline-danger" onclick="deleteGrade(${row.id})" title="Delete">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                `;
                                
                                actions += '</div>';
                            }
                            
                            return actions;
                        }
                    }
                ];
            }
        })(),
        "order": window.isStudent ? [[4, "desc"]] : [[0, "desc"]],
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading grades...",
            "emptyTable": "No grades found",
            "zeroRecords": "No matching grades found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#gradeModal').on('hidden.bs.modal', function () {
        resetGradeForm();
    });
    
    // Form validation
    $('#gradeForm').on('submit', function(e) {
        e.preventDefault();
        saveGrade();
    });
    
    // Auto calculate final grade
    $('#autoCalculateBtn').on('click', function() {
        autoCalculateGrade();
    });
    
    // Auto calculate on input change
    $('#activity_score, #quiz_score, #exam_score').on('input', function() {
        autoCalculateGrade();
    });
}

/**
 * Reset grade form
 */
function resetGradeForm() {
    document.getElementById('gradeForm').reset();
    document.getElementById('formAction').value = 'create_grade';
    document.getElementById('modalTitle').textContent = 'Add New Grade';
    document.getElementById('gradeId').value = '';
    currentGradeEditId = null;
    
    // Reset validation classes
    $('#gradeForm .form-control').removeClass('is-valid is-invalid');
    $('#gradeForm .form-text').remove();
}

/**
 * Save Grade (Create or Update)
 */
function saveGrade() {
    const form = document.getElementById('gradeForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateGradeForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiGrades.php';
    
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
                $('#gradeModal').modal('hide');
                gradesTable.ajax.reload();
                resetGradeForm();
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
            text: 'An error occurred while saving the grade.'
        });
    });
}

/**
 * Validate grade form
 */
function validateGradeForm() {
    let isValid = true;
    const requiredFields = ['student_id', 'activity_score', 'quiz_score', 'exam_score', 'final_grade', 'status'];
    
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
 * Auto calculate final grade
 */
function autoCalculateGrade() {
    const activityScore = parseFloat($('#activity_score').val()) || 0;
    const quizScore = parseFloat($('#quiz_score').val()) || 0;
    const examScore = parseFloat($('#exam_score').val()) || 0;
    
    // Calculate weighted average: Activity (40%) + Quiz (30%) + Exam (30%)
    const finalGrade = (activityScore * 0.4) + (quizScore * 0.3) + (examScore * 0.3);
    
    $('#final_grade').val(finalGrade.toFixed(2));
}

/**
 * Load students for dropdown
 */
function loadStudents() {
    fetch('app/API/apiGrades.php?action=get_students')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const studentSelect = document.getElementById('student_id');
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            
            data.data.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.first_name} ${student.last_name} - ${student.course} ${student.year_level}`;
                studentSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading students:', error);
    });
}

/**
 * Edit Grade
 */
function editGrade(id) {
    console.log('Editing grade with ID:', id);
    currentGradeEditId = id;
    
    fetch(`app/API/apiGrades.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_grade&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateGradeForm(data.data);
            document.getElementById('formAction').value = 'update_grade';
            document.getElementById('modalTitle').textContent = 'Edit Grade';
            $('#gradeModal').modal('show');
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
            text: 'Failed to load grade data.'
        });
    });
}

/**
 * Populate grade form with data
 */
function populateGradeForm(grade) {
    document.getElementById('gradeId').value = grade.id;
    document.getElementById('student_id').value = grade.student_id;
    document.getElementById('activity_score').value = grade.activity_score;
    document.getElementById('quiz_score').value = grade.quiz_score;
    document.getElementById('exam_score').value = grade.exam_score;
    document.getElementById('final_grade').value = grade.final_grade;
    document.getElementById('status').value = grade.status;
}

/**
 * Delete Grade
 */
function deleteGrade(id) {
    console.log('Deleting grade with ID:', id);
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
            formData.append('action', 'delete_grade');
            formData.append('id', id);
            
            fetch('app/API/apiGrades.php', {
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
                        gradesTable.ajax.reload();
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
                    text: 'An error occurred while deleting the grade.'
                });
            });
        }
    });
}

/**
 * Refresh DataTable
 */
function refreshGradesTable() {
    if (gradesTable) {
        gradesTable.ajax.reload();
    }
}
