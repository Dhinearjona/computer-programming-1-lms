// Global variables
var subjectsTable;
var currentSubjectEditId = null;

$(document).ready(function() {
    // Prevent multiple initializations
    if (window.subjectsTableInitialized) {
        return;
    }
    
    initializeSubjectsTable();
    setupModalEvents();
    window.subjectsTableInitialized = true;
});

/**
 * Initialize Subjects DataTable
 */
function initializeSubjectsTable() {
    // Check if DataTable already exists
    if ($.fn.DataTable.isDataTable('#subjectsTable')) {
        subjectsTable = $('#subjectsTable').DataTable();
        return;
    }
    
    subjectsTable = $('#subjectsTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiSubjects.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                console.error('Response text:', xhr.responseText);
                console.error('Status:', xhr.status);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load subjects data. Check console for details.'
                });
            }
        },
        "columns": [
            { "data": "id", "width": "5%" },
            { "data": "name", "width": "25%" },
            { 
                "data": "description", 
                "width": "30%",
                "render": function(data, type, row) {
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || 'No description';
                }
            },
            { "data": "year_level", "width": "15%" },
            { "data": "course", "width": "15%" },
            { "data": "created_at", "width": "10%" },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "10%",
                "render": function(data, type, row) {
                    let actions = '';
                    
                    // Check permissions based on role
                    if (window.canManageStudents) {
                        actions = '<div class="btn-group gap-2" role="group">';
                        
                        // Edit button
                        actions += `
                            <button class="btn btn-outline-primary" onclick="editSubject(${row.id})" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                        
                        // Delete button
                        actions += `
                            <button class="btn btn-outline-danger" onclick="deleteSubject(${row.id})" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                        
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
            "processing": "Loading subjects...",
            "emptyTable": "No subjects found",
            "zeroRecords": "No matching subjects found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#subjectModal').on('hidden.bs.modal', function () {
        resetSubjectForm();
    });
    
    // Form validation
    $('#subjectForm').on('submit', function(e) {
        e.preventDefault();
        saveSubject();
    });
    
    // Load unique courses and year levels when modal opens
    $('#subjectModal').on('shown.bs.modal', function () {
        loadUniqueCourses();
        loadUniqueYearLevels();
    });
}

/**
 * Load unique courses for dropdown
 */
function loadUniqueCourses() {
    fetch('app/API/apiSubjects.php?action=unique_courses')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const courseSelect = document.getElementById('course');
            courseSelect.innerHTML = '<option value="">Select Course</option>';
            
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                courseSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading courses:', error);
    });
}

/**
 * Load unique year levels for dropdown
 */
function loadUniqueYearLevels() {
    fetch('app/API/apiSubjects.php?action=unique_year_levels')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const yearLevelSelect = document.getElementById('year_level');
            yearLevelSelect.innerHTML = '<option value="">Select Year Level</option>';
            
            data.data.forEach(yearLevel => {
                const option = document.createElement('option');
                option.value = yearLevel;
                option.textContent = yearLevel;
                yearLevelSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading year levels:', error);
    });
}

/**
 * Reset subject form
 */
function resetSubjectForm() {
    document.getElementById('subjectForm').reset();
    document.getElementById('formAction').value = 'create_subject';
    document.getElementById('modalTitle').textContent = 'Add New Subject';
    document.getElementById('subjectId').value = '';
    currentSubjectEditId = null;
    
    // Reset validation classes
    $('#subjectForm .form-control').removeClass('is-valid is-invalid');
    $('#subjectForm .form-text').remove();
}

/**
 * Save Subject (Create or Update)
 */
function saveSubject() {
    if (!validateSubjectForm()) {
        return;
    }
    
    const form = document.getElementById('subjectForm');
    const formData = new FormData(form);
    
    const action = formData.get('action');
    const url = 'app/API/apiSubjects.php';
    
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
                $('#subjectModal').modal('hide');
                subjectsTable.ajax.reload();
                resetSubjectForm();
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
            text: 'An error occurred while saving the subject.'
        });
    });
}

/**
 * Validate subject form
 */
function validateSubjectForm() {
    let isValid = true;
    const requiredFields = ['name', 'year_level', 'course'];
    
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
    
    if (!isValid) {
        toastr.error('Please fill in all required fields.');
    }
    
    return isValid;
}

/**
 * Edit Subject
 */
function editSubject(id) {
    currentSubjectEditId = id;
    
    fetch(`app/API/apiSubjects.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_subject&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateSubjectForm(data.data);
            document.getElementById('formAction').value = 'update_subject';
            document.getElementById('modalTitle').textContent = 'Edit Subject';
            $('#subjectModal').modal('show');
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
            text: 'An error occurred while loading the subject.'
        });
    });
}

/**
 * Populate subject form with data
 */
function populateSubjectForm(subject) {
    document.getElementById('subjectId').value = subject.id;
    document.getElementById('name').value = subject.name;
    document.getElementById('description').value = subject.description || '';
    document.getElementById('year_level').value = subject.year_level;
    document.getElementById('course').value = subject.course;
}

/**
 * Delete Subject
 */
function deleteSubject(id) {
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
            formData.append('action', 'delete_subject');
            formData.append('id', id);
            
            fetch('app/API/apiSubjects.php', {
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
                        subjectsTable.ajax.reload();
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
                    text: 'An error occurred while deleting the subject.'
                });
            });
        }
    });
}

/**
 * Export subjects to CSV
 */
function exportSubjects() {
    fetch('app/API/apiSubjects.php?action=list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const csvContent = convertToCSV(data.data);
            downloadCSV(csvContent, 'subjects.csv');
        } else {
            toastr.error('Failed to export subjects');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        toastr.error('An error occurred while exporting');
    });
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
    const headers = ['ID', 'Name', 'Description', 'Year Level', 'Course', 'Created At'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = [
            row.id,
            `"${row.name}"`,
            `"${row.description}"`,
            `"${row.year_level}"`,
            `"${row.course}"`,
            `"${row.created_at}"`
        ];
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
