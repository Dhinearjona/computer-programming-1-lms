// Global variables
var semestersTable;
var currentSemesterEditId = null;

$(document).ready(function() {
    // Prevent multiple initializations
    if (window.semestersTableInitialized) {
        return;
    }
    
    initializeSemestersTable();
    setupModalEvents();
    window.semestersTableInitialized = true;
});

/**
 * Initialize Semesters DataTable
 */
function initializeSemestersTable() {
    // Check if DataTable already exists
    if ($.fn.DataTable.isDataTable('#semestersTable')) {
        semestersTable = $('#semestersTable').DataTable();
        return;
    }
    
    semestersTable = $('#semestersTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiSemesters.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                console.error('Response text:', xhr.responseText);
                console.error('Status:', xhr.status);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load semesters data. Check console for details.'
                });
            }
        },
        "columns": [
            { "data": "id", "width": "5%" },
            { "data": "name", "width": "20%" },
            { "data": "academic_year", "width": "15%" },
            { "data": "start_date", "width": "15%" },
            { "data": "end_date", "width": "15%" },
            { 
                "data": "status", 
                "width": "10%",
                "render": function(data, type, row) {
                    let badgeClass = '';
                    let badgeText = '';
                    
                    switch(data.toLowerCase()) {
                        case 'active':
                            badgeClass = 'badge bg-success';
                            badgeText = 'Active';
                            break;
                        case 'completed':
                            badgeClass = 'badge bg-primary';
                            badgeText = 'Completed';
                            break;
                        case 'inactive':
                            badgeClass = 'badge bg-secondary';
                            badgeText = 'Inactive';
                            break;
                        default:
                            badgeClass = 'badge bg-secondary';
                            badgeText = data;
                    }
                    
                    return `<span class="${badgeClass}">${badgeText}</span>`;
                }
            },
            { "data": "created_at", "width": "10%" },
            { 
                "data": "actions", 
                "orderable": false,
                "width": "10%",
                "render": function(data, type, row) {
                    let actions = '';
                    
                    // Check permissions based on role
                    if (window.canManageSemesters) {
                        actions = '<div class="btn-group gap-2" role="group">';
                        
                        // Edit button
                        actions += `
                            <button class="btn btn-outline-primary" onclick="editSemester(${row.id})" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                        
                        // Delete button
                        actions += `
                            <button class="btn btn-outline-danger" onclick="deleteSemester(${row.id})" title="Delete">
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
            "processing": "Loading semesters...",
            "emptyTable": "No semesters found",
            "zeroRecords": "No matching semesters found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#semesterModal').on('hidden.bs.modal', function () {
        resetSemesterForm();
    });
    
    // Form validation
    $('#semesterForm').on('submit', function(e) {
        e.preventDefault();
        saveSemester();
    });
    
    // Date validation
    $('#start_date, #end_date').on('change', function() {
        validateDates();
    });
}

/**
 * Reset semester form
 */
function resetSemesterForm() {
    document.getElementById('semesterForm').reset();
    document.getElementById('formAction').value = 'create_semester';
    document.getElementById('modalTitle').textContent = 'Add New Semester';
    document.getElementById('semesterId').value = '';
    currentSemesterEditId = null;
    
    // Reset validation classes
    $('#semesterForm .form-control').removeClass('is-valid is-invalid');
    $('#semesterForm .form-text').remove();
}

/**
 * Save Semester (Create or Update)
 */
function saveSemester() {
    if (!validateSemesterForm()) {
        return;
    }
    
    const form = document.getElementById('semesterForm');
    const formData = new FormData(form);
    
    const action = formData.get('action');
    const url = 'app/API/apiSemesters.php';
    
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
                $('#semesterModal').modal('hide');
                semestersTable.ajax.reload();
                resetSemesterForm();
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
            text: 'An error occurred while saving the semester.'
        });
    });
}

/**
 * Validate semester form
 */
function validateSemesterForm() {
    let isValid = true;
    const requiredFields = ['name', 'academic_year', 'start_date', 'end_date'];
    
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
    
    // Validate dates
    const startDate = new Date(document.getElementById('start_date').value);
    const endDate = new Date(document.getElementById('end_date').value);
    
    if (startDate >= endDate) {
        document.getElementById('end_date').classList.add('is-invalid');
        isValid = false;
        toastr.error('End date must be after start date');
    } else {
        document.getElementById('end_date').classList.remove('is-invalid');
        document.getElementById('end_date').classList.add('is-valid');
    }
    
    if (!isValid) {
        toastr.error('Please fill in all required fields correctly.');
    }
    
    return isValid;
}

/**
 * Validate dates
 */
function validateDates() {
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            document.getElementById('end_date').classList.add('is-invalid');
            toastr.error('End date must be after start date');
        } else {
            document.getElementById('end_date').classList.remove('is-invalid');
            document.getElementById('end_date').classList.add('is-valid');
        }
    }
}

/**
 * Edit Semester
 */
function editSemester(id) {
    console.log('Editing semester with ID:', id);
    currentSemesterEditId = id;
    
    fetch(`app/API/apiSemesters.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_semester&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateSemesterForm(data.data);
            document.getElementById('formAction').value = 'update_semester';
            document.getElementById('modalTitle').textContent = 'Edit Semester';
            $('#semesterModal').modal('show');
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
            text: 'An error occurred while loading the semester.'
        });
    });
}

/**
 * Populate semester form with data
 */
function populateSemesterForm(semester) {
    document.getElementById('semesterId').value = semester.id;
    document.getElementById('name').value = semester.name;
    document.getElementById('academic_year').value = semester.academic_year;
    document.getElementById('start_date').value = semester.start_date;
    document.getElementById('end_date').value = semester.end_date;
    document.getElementById('status').value = semester.status;
}

/**
 * Delete Semester
 */
function deleteSemester(id) {
    console.log('Deleting semester with ID:', id);
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
            formData.append('action', 'delete_semester');
            formData.append('id', id);
            
            fetch('app/API/apiSemesters.php', {
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
                        semestersTable.ajax.reload();
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
                    text: 'An error occurred while deleting the semester.'
                });
            });
        }
    });
}

/**
 * Export semesters to CSV
 */
function exportSemesters() {
    fetch('app/API/apiSemesters.php?action=list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const csvContent = convertToCSV(data.data);
            downloadCSV(csvContent, 'semesters.csv');
        } else {
            toastr.error('Failed to export semesters');
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
    const headers = ['ID', 'Name', 'Academic Year', 'Start Date', 'End Date', 'Status', 'Created At'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = [
            row.id,
            `"${row.name}"`,
            `"${row.academic_year}"`,
            `"${row.start_date}"`,
            `"${row.end_date}"`,
            `"${row.status}"`,
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
