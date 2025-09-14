/**
 * Activities DataTables Configuration and Functions
 */

// Global variables
var activitiesTable;
var currentEditId = null;

$(document).ready(function() {
    // Prevent multiple initializations
    if (window.activitiesTableInitialized) {
        return;
    }
    
    initializeActivitiesTable();
    setupModalEvents();
    loadSubjects();
    loadGradingPeriods();
    window.activitiesTableInitialized = true;
});

/**
 * Initialize Activities DataTable
 */
function initializeActivitiesTable() {
    // Check if DataTable is already initialized
    if ($.fn.DataTable.isDataTable('#activitiesTable')) {
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
        "columns": [
            { 
                "data": "title", 
                "width": "25%",
                "render": function(data, type, row) {
                    return `<strong>${data}</strong>`;
                }
            },
            { 
                "data": "description", 
                "width": "30%",
                "render": function(data, type, row) {
                    if (data && data.length > 100) {
                        return data.substring(0, 100) + '...';
                    }
                    return data || 'N/A';
                }
            },
            { 
                "data": "due_date", 
                "width": "15%",
                "render": function(data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        return date.toLocaleDateString();
                    }
                    return 'N/A';
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
                        case 'pending':
                            badgeClass = 'badge bg-warning';
                            badgeText = 'Pending';
                            break;
                        case 'completed':
                            badgeClass = 'badge bg-info';
                            badgeText = 'Completed';
                            break;
                        case 'missed':
                            badgeClass = 'badge bg-danger';
                            badgeText = 'Missed';
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
                        <button class="btn btn-outline-info" onclick="viewActivity(${data})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;
                    
                    // Edit button (for admin/teacher)
                    if (window.canEditActivities) {
                        actions += `
                            <button class="btn btn-outline-primary" onclick="editActivity(${data})" title="Edit Activity">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                    }
                    
                    // Delete button (only for admin)
                    if (window.canDeleteActivities && window.isAdmin) {
                        actions += `
                            <button class="btn btn-outline-danger" onclick="deleteActivity(${data})" title="Delete Activity">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                    }
                    
                    actions += '</div>';
                    return actions;
                }
            }
        ],
        "order": [[2, "asc"]],
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
    
    // Reset activity details modal when closed
    $('#activityDetailsModal').on('hidden.bs.modal', function () {
        document.getElementById('activityDetailsContent').innerHTML = '';
    });
    
    // Load subjects and grading periods when modal is shown
    $('#activityModal').on('shown.bs.modal', function () {
        loadSubjects();
        loadGradingPeriods();
    });
    
    // Also try loading subjects and grading periods when modal is about to show
    $('#activityModal').on('show.bs.modal', function () {
        loadSubjects();
        loadGradingPeriods();
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
    const requiredFields = ['subject_id', 'grading_period_id', 'title', 'description', 'allow_from', 'due_date'];
    
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
    fetch("app/API/apiActivities.php?action=get_subjects")
        .then((response) => response.json())
        .then((data) => {
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
    document.getElementById('activityId').value = activity.id;
    document.getElementById('subject_id').value = activity.subject_id;
    document.getElementById('grading_period_id').value = activity.grading_period_id;
    document.getElementById('title').value = activity.title;
    document.getElementById('description').value = activity.description;
    document.getElementById('allow_from').value = activity.allow_from;
    document.getElementById('due_date').value = activity.due_date;
    document.getElementById('cutoff_date').value = activity.cutoff_date || '';
    document.getElementById('reminder_date').value = activity.reminder_date || '';
    document.getElementById('deduction_percent').value = activity.deduction_percent || 0;
    document.getElementById('status').value = activity.status || 'active';
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
            
            // Get status badge class
            let statusBadgeClass = '';
            let statusText = '';
            switch(activity.status) {
                case 'active':
                    statusBadgeClass = 'badge bg-success';
                    statusText = 'Active';
                    break;
                case 'inactive':
                    statusBadgeClass = 'badge bg-secondary';
                    statusText = 'Inactive';
                    break;
                case 'pending':
                    statusBadgeClass = 'badge bg-warning';
                    statusText = 'Pending';
                    break;
                case 'completed':
                    statusBadgeClass = 'badge bg-info';
                    statusText = 'Completed';
                    break;
                case 'missed':
                    statusBadgeClass = 'badge bg-danger';
                    statusText = 'Missed';
                    break;
                default:
                    statusBadgeClass = 'badge bg-success';
                    statusText = 'Active';
            }
            
            // Get grading period badge class
            let periodBadgeClass = 'badge bg-primary';
            if (activity.grading_period_name) {
                if (activity.grading_period_name.toLowerCase().includes('prelim')) periodBadgeClass = 'badge bg-info';
                else if (activity.grading_period_name.toLowerCase().includes('midterm')) periodBadgeClass = 'badge bg-warning';
                else if (activity.grading_period_name.toLowerCase().includes('finals')) periodBadgeClass = 'badge bg-danger';
            }
            
            // Populate modal content
            document.getElementById('activityDetailsContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-card-heading"></i> Title</label>
                            <p class="form-control-plaintext">${activity.title}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-toggle-on"></i> Status</label>
                            <p class="form-control-plaintext"><span class="${statusBadgeClass}">${statusText}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-book"></i> Subject</label>
                            <p class="form-control-plaintext">${activity.subject_name || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-calendar-check"></i> Grading Period</label>
                            <p class="form-control-plaintext"><span class="${periodBadgeClass}">${activity.grading_period_name || 'N/A'}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label fw-bold"><i class="bi bi-chat-text"></i> Description</label>
                    <div class="form-control-plaintext border rounded p-3 bg-light">
                        ${activity.description || 'No description provided'}
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-calendar-plus"></i> Allow From</label>
                            <p class="form-control-plaintext">${activity.allow_from ? new Date(activity.allow_from).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-calendar-event"></i> Due Date</label>
                            <p class="form-control-plaintext">${activity.due_date ? new Date(activity.due_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-calendar-x"></i> Cutoff Date</label>
                            <p class="form-control-plaintext">${activity.cutoff_date ? new Date(activity.cutoff_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-bell"></i> Reminder Date</label>
                            <p class="form-control-plaintext">${activity.reminder_date ? new Date(activity.reminder_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label fw-bold"><i class="bi bi-percent"></i> Late Deduction</label>
                            <p class="form-control-plaintext">${activity.deduction_percent || 0}%</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label fw-bold"><i class="bi bi-clock"></i> Created</label>
                    <p class="form-control-plaintext">${new Date(activity.created_at).toLocaleDateString()}</p>
                </div>
                
                <div class="alert alert-info">
                    <h6><i class="bi bi-info-circle"></i> Activity Information</h6>
                    <ul class="mb-0">
                        <li>Students can submit activities from the "Allow From" date</li>
                        <li>Late submissions after the due date will have a ${activity.deduction_percent || 0}% deduction</li>
                        <li>No submissions will be accepted after the cutoff date</li>
                        <li>Reminder notifications will be sent on the reminder date</li>
                    </ul>
                </div>
            `;
            
            // Show the modal
            $('#activityDetailsModal').modal('show');
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
    setTimeout(() => {
        fetch("app/API/apiActivities.php?action=get_subjects")
            .then((response) => {
                return response.json();
            })
            .then((data) => {
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
                        } else {
                            select.innerHTML = '<option value="">No subjects available</option>';
                        }
                    } else {
                        console.error('Select element not found!');
                        setTimeout(() => {
                            const select2 = document.getElementById("subject_id");
                            if (select2) {
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
 * Load grading periods for dropdown
 */
function loadGradingPeriods() {
    // Wait a bit to ensure the modal is fully loaded
    setTimeout(() => {
        fetch("app/API/apiActivities.php?action=get_grading_periods")
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    const select = document.getElementById("grading_period_id");
                    if (select) {
                        select.innerHTML = '<option value="">Select Grading Period</option>';
                        if (data.data && data.data.length > 0) {
                            data.data.forEach((period) => {
                                const option = document.createElement("option");
                                option.value = period.id;
                                option.textContent = period.name + ' (' + period.academic_year + ')';
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
 * Refresh DataTable
 */
function refreshActivitiesTable() {
    if (activitiesTable) {
        activitiesTable.ajax.reload();
    }
}
