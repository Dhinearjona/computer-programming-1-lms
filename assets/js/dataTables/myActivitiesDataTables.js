/**
 * My Activities DataTables Configuration and Functions
 */

// Global variables
let myActivitiesTable;

$(document).ready(function() {
    initializeMyActivitiesTable();
});

/**
 * Initialize My Activities DataTable
 */
function initializeMyActivitiesTable() {
    // Check if table is already initialized
    if ($.fn.DataTable.isDataTable('#myActivitiesTable')) {
        $('#myActivitiesTable').DataTable().destroy();
    }
    
    myActivitiesTable = $('#myActivitiesTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiMyActivities.php",
            "type": "GET",
            "data": function(d) {
                d.action = 'datatable';
                return d;
            },
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
            { "data": "title", "width": "20%" },
            { "data": "subject_name", "width": "15%" },
            { 
                "data": "description", 
                "width": "25%",
                "render": function(data, type, row) {
                    if (data && data.length > 80) {
                        return data.substring(0, 80) + '...';
                    }
                    return data || '';
                }
            },
            { 
                "data": "due_date", 
                "width": "12%",
                "render": function(data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        return date.toLocaleDateString();
                    }
                    return 'No due date';
                }
            },
            { 
                "data": "submission_status", 
                "orderable": false, 
                "width": "10%",
                "render": function(data, type, row) {
                    if (row.submission_status === 'submitted') {
                        return '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Submitted</span>';
                    } else if (row.submission_status === 'unsubmitted') {
                        return '<span class="badge bg-warning"><i class="bi bi-clock"></i> Unsubmitted</span>';
                    } else {
                        return '<span class="badge bg-secondary"><i class="bi bi-dash-circle"></i> Not Submitted</span>';
                    }
                }
            },
            { 
                "data": "status", 
                "orderable": false, 
                "width": "8%",
                "render": function(data, type, row) {
                    let badgeClass = '';
                    let badgeText = '';
                    
                    // Determine status based on due date and current date
                    const dueDate = new Date(row.due_date);
                    const currentDate = new Date();
                    const cutoffDate = new Date(row.cutoff_date);
                    
                    if (row.status === 'inactive') {
                        badgeClass = 'badge bg-secondary';
                        badgeText = 'Inactive';
                    } else if (currentDate > cutoffDate) {
                        badgeClass = 'badge bg-danger';
                        badgeText = 'Missed';
                    } else if (currentDate > dueDate) {
                        badgeClass = 'badge bg-warning';
                        badgeText = 'Overdue';
                    } else {
                        badgeClass = 'badge bg-success';
                        badgeText = 'Active';
                    }
                    
                    return `<span class="${badgeClass}">${badgeText}</span>`;
                }
            },
            { 
                "data": "actions", 
                "orderable": false, 
                "width": "10%",
                "render": function(data, type, row) {
                    const dueDate = new Date(row.due_date);
                    const currentDate = new Date();
                    const cutoffDate = new Date(row.cutoff_date);
                    const isExpired = currentDate > cutoffDate;
                    const isOverdue = currentDate > dueDate;
                    
                    let actions = `
                        <div class="btn-group gap-1" role="group">
                            <button class="btn btn-outline-info" onclick="viewActivityDetails(${row.id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                    `;
                    
                    // Show submit/unsubmit buttons only if not expired and activity is active
                    if (!isExpired && row.status === 'active') {
                        if (row.submission_status === 'submitted') {
                            actions += `
                                <button class="btn btn-outline-warning" onclick="unsubmitActivity(${row.id})" title="Unsubmit">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                </button>
                            `;
                        } else {
                            actions += `
                                <button class="btn btn-outline-primary" onclick="openSubmissionModal(${row.id})" title="Submit">
                                    <i class="bi bi-upload"></i>
                                </button>
                            `;
                        }
                    } else if (isExpired) {
                        // Show disabled button when expired
                        actions += `
                            <button class="btn btn-outline-secondary" disabled title="Submission period has ended">
                                <i class="bi bi-lock"></i>
                            </button>
                        `;
                    }
                    
                    actions += `</div>`;
                    return actions;
                }
            }
        ],
        "order": [[3, "asc"]], // Sort by due date
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
 * View Activity Details
 */
function viewActivityDetails(id) {
    fetch(`app/API/apiMyActivities.php?action=get_activity&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const activity = data.data;
            const dueDate = new Date(activity.due_date);
            const cutoffDate = new Date(activity.cutoff_date);
            const currentDate = new Date();
            
            // Determine status
            let statusBadge = '';
            if (activity.status === 'inactive') {
                statusBadge = '<span class="badge bg-secondary">Inactive</span>';
            } else if (currentDate > cutoffDate) {
                statusBadge = '<span class="badge bg-danger">Missed</span>';
            } else if (currentDate > dueDate) {
                statusBadge = '<span class="badge bg-warning">Overdue</span>';
            } else {
                statusBadge = '<span class="badge bg-success">Active</span>';
            }
            
            // Calculate days remaining
            const daysRemaining = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
            let daysText = '';
            if (daysRemaining > 0) {
                daysText = `${daysRemaining} days remaining`;
            } else if (daysRemaining === 0) {
                daysText = 'Due today';
            } else {
                daysText = `${Math.abs(daysRemaining)} days overdue`;
            }
            
            document.getElementById('activityDetailsTitle').textContent = activity.title;
            
            // Submission information
            let submissionInfo = '';
            if (activity.submission_status === 'submitted') {
                const submittedDate = new Date(activity.submitted_at);
                submissionInfo = `
                    <div class="alert alert-success">
                        <h6><i class="bi bi-check-circle"></i> Submission Status</h6>
                        <p class="mb-2"><strong>Status:</strong> <span class="badge bg-success">Submitted</span></p>
                        <p class="mb-2"><strong>Submitted:</strong> ${submittedDate.toLocaleDateString()} at ${submittedDate.toLocaleTimeString()}</p>
                        ${activity.submission_link ? `<p class="mb-2"><strong>Link:</strong> <a href="${activity.submission_link}" target="_blank" class="text-decoration-none">${activity.submission_link}</a></p>` : ''}
                        ${activity.submission_text ? `<p class="mb-0"><strong>Notes:</strong> ${activity.submission_text}</p>` : ''}
                    </div>
                `;
            } else if (activity.submission_status === 'unsubmitted') {
                submissionInfo = `
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-clock"></i> Submission Status</h6>
                        <p class="mb-0"><strong>Status:</strong> <span class="badge bg-warning">Unsubmitted</span></p>
                    </div>
                `;
            } else {
                submissionInfo = `
                    <div class="alert alert-secondary">
                        <h6><i class="bi bi-dash-circle"></i> Submission Status</h6>
                        <p class="mb-0"><strong>Status:</strong> <span class="badge bg-secondary">Not Submitted</span></p>
                    </div>
                `;
            }
            
            document.getElementById('activityDetailsContent').innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h6><i class="bi bi-book"></i> Subject</h6>
                        <p class="mb-3">${activity.subject_name}</p>
                        
                        <h6><i class="bi bi-file-text"></i> Description</h6>
                        <div class="mb-3 p-3 bg-light rounded">
                            ${activity.description ? activity.description.replace(/\n/g, '<br>') : 'No description provided'}
                        </div>
                        
                        ${submissionInfo}
                    </div>
                    <div class="col-md-4">
                        <h6><i class="bi bi-calendar-event"></i> Due Date</h6>
                        <p class="mb-3">${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
                        
                        <h6><i class="bi bi-calendar-x"></i> Cutoff Date</h6>
                        <p class="mb-3">${cutoffDate.toLocaleDateString()} at ${cutoffDate.toLocaleTimeString()}</p>
                        
                        <h6><i class="bi bi-clock"></i> Time Status</h6>
                        <p class="mb-3 text-${daysRemaining >= 0 ? 'success' : 'danger'}">${daysText}</p>
                        
                        <h6><i class="bi bi-info-circle"></i> Status</h6>
                        <p class="mb-3">${statusBadge}</p>
                        
                        ${activity.deduction_percent > 0 ? `
                            <h6><i class="bi bi-exclamation-triangle"></i> Late Penalty</h6>
                            <p class="mb-3 text-warning">${activity.deduction_percent}% deduction per day</p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="alert alert-info mt-3">
                    <h6><i class="bi bi-lightbulb"></i> Important Notes</h6>
                    <ul class="mb-0">
                        <li>Submit your activity before the due date to avoid penalties</li>
                        <li>Late submissions will have a ${activity.deduction_percent}% deduction per day</li>
                        <li>No submissions will be accepted after the cutoff date</li>
                        <li>You can submit and unsubmit your work until the cutoff date</li>
                        <li>Contact your teacher if you have any questions</li>
                    </ul>
                </div>
            `;
            
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
 * Refresh DataTable
 */
function refreshMyActivitiesTable() {
    if (myActivitiesTable) {
        myActivitiesTable.ajax.reload();
    }
}

/**
 * Open submission modal
 */
function openSubmissionModal(activityId) {
    document.getElementById('submissionActivityId').value = activityId;
    document.getElementById('submissionLink').value = '';
    document.getElementById('submissionText').value = '';
    document.getElementById('submissionAction').value = 'submit_activity';
    document.getElementById('submissionModalTitle').textContent = 'Submit Activity';
    
    $('#submissionModal').modal('show');
}

/**
 * Submit activity
 */
function submitActivity() {
    const form = document.getElementById('submissionForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const submissionLink = document.getElementById('submissionLink').value.trim();
    if (!submissionLink) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Please provide a submission link.'
        });
        return;
    }
    
    // Validate URL format
    try {
        new URL(submissionLink);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Please provide a valid URL.'
        });
        return;
    }
    
    fetch('app/API/apiMyActivities.php', {
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
                $('#submissionModal').modal('hide');
                myActivitiesTable.ajax.reload();
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
            text: 'An error occurred while submitting the activity.'
        });
    });
}

/**
 * Unsubmit activity
 */
function unsubmitActivity(activityId) {
    Swal.fire({
        title: 'Unsubmit Activity',
        text: 'Are you sure you want to unsubmit this activity? You can resubmit it later.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, unsubmit it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('action', 'unsubmit_activity');
            formData.append('activity_id', activityId);
            
            fetch('app/API/apiMyActivities.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Unsubmitted!',
                        text: data.message,
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        myActivitiesTable.ajax.reload();
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
                    text: 'An error occurred while unsubmitting the activity.'
                });
            });
        }
    });
}
