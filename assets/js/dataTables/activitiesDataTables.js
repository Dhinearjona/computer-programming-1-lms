/**
 * Activities DataTables Configuration and Functions
 */

// Global variables
var activitiesTable;
var currentEditId = null;

$(document).ready(function() {
    console.log('Document ready - initializing activities...');
    // Prevent multiple initializations
    if (window.activitiesTableInitialized) {
        console.log('Activities already initialized, skipping...');
        return;
    }
    
    initializeActivitiesTable();
    setupModalEvents();
    
    // Load subjects immediately to ensure they're available
    console.log('Loading subjects on document ready...');
    loadSubjects();
    
    window.activitiesTableInitialized = true;
    console.log('Activities initialization complete');
    // Note: loadSubjects() will also be called when modal opens
});

/**
 * Initialize Activities DataTable
 */
function initializeActivitiesTable() {
    // Check if DataTable is already initialized
    if ($.fn.DataTable.isDataTable('#activitiesTable')) {
        console.log('DataTable already initialized, destroying and recreating...');
        $('#activitiesTable').DataTable().destroy();
    }
    
    activitiesTable = $('#activitiesTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiActivities.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load activities data.'
                });
            }
        },
        "columns": (function() {
            // Define columns based on user role
            if (window.currentUserRole === 'student') {
                // Student view - no ID, no Actions
                return [
                    { "data": "title", "width": "40%" },
                    { "data": "subject_name", "width": "20%" },
                    { "data": "due_date", "width": "20%" },
                    { "data": "submission_count", "orderable": false, "width": "10%" },
                    { "data": "status", "orderable": false, "width": "10%" }
                ];
            } else {
                // Admin/Teacher view - full columns with actions
                return [
                    { "data": "id", "width": "5%" },
                    { "data": "title", "width": "25%" },
                    { "data": "subject_name", "width": "15%" },
                    { "data": "due_date", "width": "15%" },
                    { "data": "submission_count", "orderable": false, "width": "10%" },
                    { "data": "status", "orderable": false, "width": "15%" },
                    { 
                        "data": "actions", 
                        "orderable": false,
                        "width": "15%",
                        "render": function(data, type, row) {
                            let actions = '';
                            
                            // Check permissions based on role
                            if (window.currentUserRole === 'admin' || window.currentUserRole === 'teacher') {
                                actions = '<div class="btn-group gap-2" role="group">';
                                
                                // Edit button - Admin and Teacher can edit
                                if (window.currentUserRole === 'admin' || window.currentUserRole === 'teacher') {
                                    actions += `
                                        <button class="btn btn-outline-primary" onclick="editActivity(${data})" title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    `;
                                }
                                
                                // Delete button - Only Admin can delete
                                if (window.currentUserRole === 'admin') {
                                    actions += `
                                        <button class="btn btn-outline-danger" onclick="deleteActivity(${data})" title="Delete">
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
        "order": window.currentUserRole === 'student' ? [[2, "desc"]] : [[0, "desc"]],
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading activities...",
            "emptyTable": "No activities found",
            "zeroRecords": "No matching activities found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#activityModal').on('hidden.bs.modal', function () {
        resetActivityForm();
    });
    
    // Load subjects when modal is shown
    $('#activityModal').on('shown.bs.modal', function () {
        console.log('Modal shown event triggered');
        loadSubjects();
    });
    
    // Also try loading subjects when modal is about to show
    $('#activityModal').on('show.bs.modal', function () {
        console.log('Modal show event triggered');
        loadSubjects();
    });
    
    // Form validation
    $('#activityForm').on('submit', function(e) {
        e.preventDefault();
        saveActivity();
    });
}

/**
 * Reset activity form
 */
function resetActivityForm() {
    document.getElementById('activityForm').reset();
    document.getElementById('formAction').value = 'create_activity';
    document.getElementById('modalTitle').textContent = 'Add New Activity';
    document.getElementById('activityId').value = '';
    currentEditId = null;
    
    // Reset validation classes
    $('#activityForm .form-control').removeClass('is-valid is-invalid');
}

/**
 * Save Activity (Create or Update)
 */
function saveActivity() {
    const form = document.getElementById('activityForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateActivityForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiActivities.php';
    
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
                $('#activityModal').modal('hide');
                activitiesTable.ajax.reload();
                resetActivityForm();
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
            text: 'An error occurred while saving the activity.'
        });
    });
}

/**
 * Validate activity form
 */
function validateActivityForm() {
    let isValid = true;
    const requiredFields = ['subject_id', 'title', 'description', 'allow_from', 'due_date'];
    
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
 * Edit Activity
 */
function editActivity(id) {
    currentEditId = id;
    
    fetch(`app/API/apiActivities.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_activity&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Load subjects first, then populate form
            loadSubjectsForEdit(data.data);
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
            text: 'Failed to load activity data.'
        });
    });
}

/**
 * Load subjects for edit mode
 */
function loadSubjectsForEdit(activityData) {
    console.log('Loading subjects for edit mode...');
    
    fetch("app/API/apiActivities.php?action=get_subjects")
        .then((response) => response.json())
        .then((data) => {
            console.log('Subjects loaded for edit:', data);
            if (data.success) {
                const select = document.getElementById("subject_id");
                if (select) {
                    select.innerHTML = '<option value="">Select Subject</option>';
                    if (data.data && data.data.length > 0) {
                        data.data.forEach((subject) => {
                            const option = document.createElement("option");
                            option.value = subject.id;
                            option.textContent = subject.name;
                            select.appendChild(option);
                        });
                        
                        // Now populate the form with activity data
                        populateActivityForm(activityData);
                        
                        // Set form action and title
                        document.getElementById('formAction').value = 'update_activity';
                        document.getElementById('modalTitle').textContent = 'Edit Activity';
                        
                        // Show the modal
                        $('#activityModal').modal('show');
                    } else {
                        console.log('No subjects data found');
                        select.innerHTML = '<option value="">No subjects available</option>';
                    }
                } else {
                    console.error('Select element not found!');
                }
            } else {
                console.error('API returned error:', data.message);
            }
        })
        .catch((error) => {
            console.error("Error loading subjects for edit:", error);
        });
}

/**
 * Populate activity form with data
 */
function populateActivityForm(activity) {
    console.log('Populating activity form with data:', activity);
    document.getElementById('activityId').value = activity.id;
    document.getElementById('subject_id').value = activity.subject_id;
    document.getElementById('title').value = activity.title;
    document.getElementById('description').value = activity.description;
    document.getElementById('allow_from').value = activity.allow_from;
    document.getElementById('due_date').value = activity.due_date;
    document.getElementById('cutoff_date').value = activity.cutoff_date || '';
    document.getElementById('reminder_date').value = activity.reminder_date || '';
    document.getElementById('deduction_percent').value = activity.deduction_percent || 0;
    document.getElementById('status').value = activity.status || 'active';
    
    console.log('Form populated. Subject ID set to:', activity.subject_id);
}

/**
 * View Activity Details
 */
function viewActivity(id) {
    fetch(`app/API/apiActivities.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=get_activity&id=${id}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const activity = data.data;
            Swal.fire({
                title: 'Activity Details',
                html: `
                    <div class="text-start">
                        <p><strong>Title:</strong> ${activity.title}</p>
                        <p><strong>Description:</strong> ${activity.description || 'N/A'}</p>
                        <p><strong>Subject:</strong> ${activity.subject_name || 'N/A'}</p>
                        <p><strong>Allow From:</strong> ${activity.allow_from ? new Date(activity.allow_from).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Due Date:</strong> ${activity.due_date ? new Date(activity.due_date).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Cutoff Date:</strong> ${activity.cutoff_date ? new Date(activity.cutoff_date).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Reminder Date:</strong> ${activity.reminder_date ? new Date(activity.reminder_date).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Deduction Percent:</strong> ${activity.deduction_percent || 0}%</p>
                        <p><strong>Status:</strong> ${activity.status || 'active'}</p>
                        <p><strong>Created:</strong> ${new Date(activity.created_at).toLocaleDateString()}</p>
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
            text: 'Failed to load activity details.'
        });
    });
}

/**
 * Delete Activity
 */
function deleteActivity(id) {
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
            formData.append('action', 'delete_activity');
            formData.append('id', id);
            
            fetch('app/API/apiActivities.php', {
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
                        activitiesTable.ajax.reload();
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
                    text: 'An error occurred while deleting the activity.'
                });
            });
        }
    });
}

/**
 * Load subjects for dropdown
 */
function loadSubjects() {
    console.log('Loading subjects...');
    
    // Wait a bit to ensure the modal is fully loaded
    setTimeout(() => {
        fetch("app/API/apiActivities.php?action=get_subjects")
            .then((response) => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then((data) => {
                console.log('API Response:', data);
                if (data.success) {
                    const select = document.getElementById("subject_id");
                    console.log('Select element found:', select);
                    if (select) {
                        select.innerHTML = '<option value="">Select Subject</option>';
                        if (data.data && data.data.length > 0) {
                            console.log('Adding subjects:', data.data.length);
                            data.data.forEach((subject) => {
                                const option = document.createElement("option");
                                option.value = subject.id;
                                option.textContent = subject.name;
                                select.appendChild(option);
                                console.log('Added subject:', subject.name);
                            });
                        } else {
                            console.log('No subjects data found');
                            select.innerHTML = '<option value="">No subjects available</option>';
                        }
                    } else {
                        console.error('Select element not found!');
                        // Try again after a short delay
                        setTimeout(() => {
                            const select2 = document.getElementById("subject_id");
                            if (select2) {
                                console.log('Select element found on retry');
                                select2.innerHTML = '<option value="">Select Subject</option>';
                                if (data.data && data.data.length > 0) {
                                    data.data.forEach((subject) => {
                                        const option = document.createElement("option");
                                        option.value = subject.id;
                                        option.textContent = subject.name;
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
                console.error("Error loading subjects:", error);
            });
    }, 100);
}

/**
 * Refresh DataTable
 */
function refreshActivitiesTable() {
    if (activitiesTable) {
        activitiesTable.ajax.reload();
    }
}
