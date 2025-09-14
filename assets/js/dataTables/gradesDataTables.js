/**
 * Grades DataTables Configuration and Functions
 */

// Global variables
var gradesTable;
var currentGradeEditId = null;

$(document).ready(function() {
    // Prevent multiple initializations
    if (typeof window.gradesTableInitialized === 'undefined') {
        window.gradesTableInitialized = true;
        initializeGradesTable();
        setupModalEvents();
        
        // Note: Dropdowns will be loaded when modal opens to avoid 401 errors
        
        // Note: Auto calculate button will be checked when modal is shown
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
                    { "data": "subject_name", "width": "15%" },
                    { "data": "semester_name", "width": "15%" },
                    { "data": "grading_period_name", "width": "15%" },
                    { "data": "activity_score", "width": "15%" },
                    { "data": "quiz_score", "width": "15%" },
                    { "data": "exam_score", "width": "15%" },
                    { "data": "period_grade", "width": "10%" },
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
                // Admin/Teacher view - simplified columns
                return [
                    { "data": "full_name", "width": "20%" },
                    { "data": "grading_period_name", "width": "15%" },
                    { "data": "activity_score", "width": "12%" },
                    { "data": "quiz_score", "width": "12%" },
                    { "data": "exam_score", "width": "12%" },
                    { "data": "period_grade", "width": "12%" },
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
                        "width": "7%",
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
    
    // Auto-calculate when modal is shown (for editing)
    $('#gradeModal').on('shown.bs.modal', function () {
        // Load dropdowns when modal opens (only for admin/teacher)
        if (!window.isStudent) {
            loadStudents();
            loadSubjects();
            loadSemesters();
            loadGradingPeriods();
        }
        
        // Check if button exists when modal is shown
        const autoCalcBtn = document.getElementById('autoCalculateBtn');
        
        // If we have values in the score fields, auto-calculate
        const activityScore = $('#activity_score').val();
        const quizScore = $('#quiz_score').val();
        const examScore = $('#exam_score').val();
        
        if (activityScore || quizScore || examScore) {
            autoCalculateGrade();
        }
        
        // Add direct event listener to button when modal is shown
        if (autoCalcBtn) {
            autoCalcBtn.addEventListener('click', function() {
                autoCalculateGrade();
            });
        }
    });
    
    // Form validation
    $('#gradeForm').on('submit', function(e) {
        e.preventDefault();
        saveGrade();
    });
    
    // Auto calculate final grade - jQuery event
    $(document).on('click', '#autoCalculateBtn', function() {
        autoCalculateGrade();
    });
    
    // Auto calculate final grade - Vanilla JS backup
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'autoCalculateBtn') {
            autoCalculateGrade();
        }
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
    
    // Reset period grade and status display
    $('#period_grade').val('');
    $('#status').val('pending');
    $('#status_display').val('Pending').removeClass('text-warning text-success text-danger').addClass('text-warning');
    
    // Remove read-only attributes for create mode
    document.getElementById('subject_id').removeAttribute('readonly');
    document.getElementById('semester_id').removeAttribute('readonly');
    document.getElementById('grading_period_id').removeAttribute('readonly');
    
    // Remove read-only styling
    $('#subject_id, #semester_id, #grading_period_id').removeClass('bg-light').css('cursor', '');
    
    // Reset validation classes
    $('#gradeForm .form-control').removeClass('is-valid is-invalid');
    $('#gradeForm .form-text').remove();
}

/**
 * Save Grade (Create or Update)
 */
function saveGrade() {
    // Auto-calculate before validation
    autoCalculateGrade();
    
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
    let errorMessages = [];
    
    // Check if we're in edit mode
    const isEditMode = document.getElementById('formAction').value === 'update_grade';
    
    // Required fields for both create and edit
    const requiredFields = ['student_id', 'activity_score', 'quiz_score', 'exam_score'];
    
    // Additional required fields only for create mode
    if (!isEditMode) {
        requiredFields.push('subject_id', 'semester_id', 'grading_period_id');
    }
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            isValid = false;
            errorMessages.push(`${field.replace('_', ' ')} is required`);
        } else {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
        }
    });
    
    // Validate calculated fields
    const periodGrade = $('#period_grade').val();
    const status = $('#status').val();
    
    if (!periodGrade || periodGrade === '') {
        $('#period_grade').addClass('is-invalid');
        isValid = false;
        errorMessages.push('Period grade must be calculated');
    } else {
        $('#period_grade').removeClass('is-invalid').addClass('is-valid');
    }
    
    if (!status || status === '') {
        $('#status_display').addClass('is-invalid');
        isValid = false;
        errorMessages.push('Status must be set');
    } else {
        $('#status_display').removeClass('is-invalid').addClass('is-valid');
    }
    
    // Show error messages
    if (!isValid) {
        toastr.error(errorMessages.join('<br>'), 'Validation Error');
    }
    
    return isValid;
}

/**
 * Auto calculate final grade and status
 */
function autoCalculateGrade() {
    const activityScore = parseFloat($('#activity_score').val()) || 0;
    const quizScore = parseFloat($('#quiz_score').val()) || 0;
    const examScore = parseFloat($('#exam_score').val()) || 0;
    
    // Calculate weighted average: Activity (40%) + Quiz (30%) + Exam (30%)
    const finalGrade = (activityScore * 0.4) + (quizScore * 0.3) + (examScore * 0.3);
    
    // Update period grade field
    $('#period_grade').val(finalGrade.toFixed(2));
    
    // Auto-set status based on grade
    let status = 'pending';
    let statusText = 'Pending';
    let statusClass = 'text-warning';
    
    if (finalGrade >= 75) {
        status = 'pass';
        statusText = 'Pass';
        statusClass = 'text-success';
    } else if (finalGrade < 75 && finalGrade > 0) {
        status = 'fail';
        statusText = 'Fail';
        statusClass = 'text-danger';
    }
    
    // Update hidden status field and display field
    $('#status').val(status);
    $('#status_display').val(statusText).removeClass('text-warning text-success text-danger').addClass(statusClass);
    
    // Add visual feedback
    const periodGradeField = $('#period_grade');
    const statusField = $('#status_display');
    
    // Add temporary highlight effect
    periodGradeField.addClass('bg-success bg-opacity-25');
    statusField.addClass('bg-success bg-opacity-25');
    
    setTimeout(() => {
        periodGradeField.removeClass('bg-success bg-opacity-25');
        statusField.removeClass('bg-success bg-opacity-25');
    }, 1000);
    
    // Show success message
    if (finalGrade > 0) {
        toastr.success(`Grade calculated: ${finalGrade.toFixed(2)} - Status: ${statusText}`, 'Auto Calculation', {
            timeOut: 2000,
            positionClass: 'toast-top-right'
        });
    }
    
    return finalGrade;
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
 * Load subjects for dropdown
 */
function loadSubjects() {
    fetch('app/API/apiGrades.php?action=get_subjects')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const subjectSelect = document.getElementById('subject_id');
            subjectSelect.innerHTML = '<option value="">Select Subject</option>';
            
            data.data.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                subjectSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading subjects:', error);
    });
}

/**
 * Load semesters for dropdown
 */
function loadSemesters() {
    fetch('app/API/apiGradingPeriods.php?action=semesters')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const semesterSelect = document.getElementById('semester_id');
            semesterSelect.innerHTML = '<option value="">Select Semester</option>';
            
            data.data.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.id;
                option.textContent = `${semester.name} (${semester.academic_year})`;
                semesterSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading semesters:', error);
    });
}

/**
 * Load grading periods for dropdown
 */
function loadGradingPeriods() {
    fetch('app/API/apiGradingPeriods.php?action=dropdown')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const periodSelect = document.getElementById('grading_period_id');
            periodSelect.innerHTML = '<option value="">Select Grading Period</option>';
            
            data.data.forEach(period => {
                const option = document.createElement('option');
                option.value = period.id;
                option.textContent = `${period.name} (${period.semester_name} ${period.academic_year})`;
                periodSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading grading periods:', error);
    });
}

/**
 * Edit Grade
 */
function editGrade(id) {
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
    document.getElementById('subject_id').value = grade.subject_id;
    document.getElementById('semester_id').value = grade.semester_id;
    document.getElementById('grading_period_id').value = grade.grading_period_id;
    document.getElementById('activity_score').value = grade.activity_score;
    document.getElementById('quiz_score').value = grade.quiz_score;
    document.getElementById('exam_score').value = grade.exam_score;
    
    // Make subject, semester, and grading period read-only when editing
    document.getElementById('subject_id').setAttribute('readonly', 'readonly');
    document.getElementById('semester_id').setAttribute('readonly', 'readonly');
    document.getElementById('grading_period_id').setAttribute('readonly', 'readonly');
    
    // Add visual styling for read-only fields
    $('#subject_id, #semester_id, #grading_period_id').addClass('bg-light').css('cursor', 'not-allowed');
    
    // Auto-compute period grade and status
    autoCalculateGrade();
}

/**
 * Delete Grade
 */
function deleteGrade(id) {
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
