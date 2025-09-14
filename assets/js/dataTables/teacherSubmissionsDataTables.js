/**
 * Teacher Submissions DataTables Configuration and Functions
 */

// Global variables
let submissionsTable;

$(document).ready(function() {
    initializeSubmissionsTable();
});

/**
 * Initialize Submissions DataTable
 */
function initializeSubmissionsTable() {
    // Check if table is already initialized
    if ($.fn.DataTable.isDataTable('#submissionsTable')) {
        $('#submissionsTable').DataTable().destroy();
    }
    
    submissionsTable = $('#submissionsTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiTeacherSubmissions.php",
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
                    text: 'Failed to load submissions data. Please try again.'
                });
            }
        },
        "columns": [
            { 
                "data": "student_name", 
                "width": "15%",
                "render": function(data, type, row) {
                    return `
                        <div>
                            <strong>${data}</strong><br>
                            <small class="text-muted">${row.student_email}</small>
                        </div>
                    `;
                }
            },
            { 
                "data": "activity_title", 
                "width": "20%",
                "render": function(data, type, row) {
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || '';
                }
            },
            { "data": "subject_name", "width": "10%" },
            { 
                "data": "submitted_at", 
                "width": "12%",
                "render": function(data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        return date.toLocaleDateString() + '<br><small class="text-muted">' + date.toLocaleTimeString() + '</small>';
                    }
                    return 'Not submitted';
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
                "data": "grade_score", 
                "orderable": false, 
                "width": "10%",
                "render": function(data, type, row) {
                    if (row.grade_score !== null) {
                        const percentage = ((row.grade_score / row.grade_max_score) * 100).toFixed(1);
                        let badgeClass = 'bg-success';
                        if (percentage < 60) badgeClass = 'bg-danger';
                        else if (percentage < 80) badgeClass = 'bg-warning';
                        
                        return `
                            <div>
                                <span class="badge ${badgeClass}">${row.grade_score}/${row.grade_max_score}</span><br>
                                <small class="text-muted">${percentage}%</small>
                            </div>
                        `;
                    } else {
                        return '<span class="badge bg-secondary">Not Graded</span>';
                    }
                }
            },
            { 
                "data": "actions", 
                "orderable": false, 
                "width": "15%",
                "render": function(data, type, row) {
                    let actions = `
                        <div class="btn-group gap-1" role="group">
                            <button class="btn btn-outline-info" onclick="viewSubmissionDetails(${row.submission_id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                    `;
                    
                    if (row.submission_status === 'submitted') {
                        actions += `
                            <button class="btn btn-outline-success" onclick="openGradeModal(${row.submission_id})" title="Grade">
                                <i class="bi bi-star"></i>
                            </button>
                        `;
                    }
                    
                    actions += `</div>`;
                    return actions;
                }
            }
        ],
        "order": [[3, "desc"]], // Sort by submission date
        "pageLength": 15,
        "responsive": true,
        "language": {
            "processing": "Loading submissions...",
            "emptyTable": "No submissions found",
            "zeroRecords": "No matching submissions found"
        }
    });
}

/**
 * View Submission Details
 */
function viewSubmissionDetails(submissionId) {
    fetch(`app/API/apiTeacherSubmissions.php?action=get_submission&id=${submissionId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const submission = data.data;
            const submittedDate = new Date(submission.submitted_at);
            const dueDate = new Date(submission.due_date);
            const cutoffDate = new Date(submission.cutoff_date);
            
            // Determine if late
            const isLate = submittedDate > dueDate;
            const isOverdue = submittedDate > cutoffDate;
            
            let statusBadge = '';
            if (submission.submission_status === 'submitted') {
                if (isOverdue) {
                    statusBadge = '<span class="badge bg-danger">Late Submission</span>';
                } else if (isLate) {
                    statusBadge = '<span class="badge bg-warning">Submitted Late</span>';
                } else {
                    statusBadge = '<span class="badge bg-success">On Time</span>';
                }
            } else {
                statusBadge = '<span class="badge bg-secondary">Not Submitted</span>';
            }
            
            // Grade information
            let gradeInfo = '';
            if (submission.grade_score !== null) {
                const percentage = ((submission.grade_score / submission.grade_max_score) * 100).toFixed(1);
                let badgeClass = 'bg-success';
                if (percentage < 60) badgeClass = 'bg-danger';
                else if (percentage < 80) badgeClass = 'bg-warning';
                
                gradeInfo = `
                    <div class="alert alert-info">
                        <h6><i class="bi bi-star"></i> Grade Information</h6>
                        <p class="mb-2"><strong>Score:</strong> <span class="badge ${badgeClass}">${submission.grade_score}/${submission.grade_max_score}</span> (${percentage}%)</p>
                        <p class="mb-2"><strong>Graded:</strong> ${new Date(submission.graded_at).toLocaleDateString()}</p>
                        ${submission.grade_comments ? `<p class="mb-0"><strong>Comments:</strong> ${submission.grade_comments}</p>` : ''}
                    </div>
                `;
            } else {
                gradeInfo = `
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-exclamation-triangle"></i> Grade Information</h6>
                        <p class="mb-0">This submission has not been graded yet.</p>
                    </div>
                `;
            }
            
            document.getElementById('submissionDetailsTitle').textContent = `Submission by ${submission.first_name} ${submission.last_name}`;
            document.getElementById('submissionDetailsContent').innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h6><i class="bi bi-person"></i> Student Information</h6>
                        <p class="mb-3">
                            <strong>Name:</strong> ${submission.first_name} ${submission.last_name}<br>
                            <strong>Email:</strong> ${submission.student_email}
                        </p>
                        
                        <h6><i class="bi bi-book"></i> Activity Information</h6>
                        <p class="mb-3">
                            <strong>Title:</strong> ${submission.activity_title}<br>
                            <strong>Subject:</strong> ${submission.subject_name}<br>
                            <strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}<br>
                            <strong>Cutoff Date:</strong> ${cutoffDate.toLocaleDateString()} at ${cutoffDate.toLocaleTimeString()}
                        </p>
                        
                        <h6><i class="bi bi-file-text"></i> Activity Description</h6>
                        <div class="mb-3 p-3 bg-light rounded">
                            ${submission.activity_description ? submission.activity_description.replace(/\n/g, '<br>') : 'No description provided'}
                        </div>
                        
                        ${gradeInfo}
                    </div>
                    <div class="col-md-4">
                        <h6><i class="bi bi-upload"></i> Submission Details</h6>
                        <p class="mb-3">
                            <strong>Status:</strong> ${statusBadge}<br>
                            <strong>Submitted:</strong> ${submittedDate.toLocaleDateString()} at ${submittedDate.toLocaleTimeString()}
                        </p>
                        
                        <h6><i class="bi bi-link-45deg"></i> Submission Link</h6>
                        <p class="mb-3">
                            ${submission.submission_link ? 
                                `<a href="${submission.submission_link}" target="_blank" class="btn btn-outline-primary">
                                    <i class="bi bi-box-arrow-up-right"></i> View Submission
                                </a>` : 
                                'No link provided'
                            }
                        </p>
                        
                        ${submission.submission_text ? `
                            <h6><i class="bi bi-chat-text"></i> Student Notes</h6>
                            <div class="mb-3 p-3 bg-light rounded">
                                ${submission.submission_text.replace(/\n/g, '<br>')}
                            </div>
                        ` : ''}
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="openGradeModal(${submission.submission_id})">
                                <i class="bi bi-star"></i> Grade Submission
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('#submissionDetailsModal').modal('show');
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
            text: 'Failed to load submission details.'
        });
    });
}

/**
 * Open Grade Modal
 */
function openGradeModal(submissionId) {
    // Get submission details first
    fetch(`app/API/apiTeacherSubmissions.php?action=get_submission&id=${submissionId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const submission = data.data;
            
            document.getElementById('gradeSubmissionId').value = submissionId;
            document.getElementById('gradeScore').value = submission.grade_score || '';
            document.getElementById('gradeMaxScore').value = submission.grade_max_score || submission.max_score || 100;
            document.getElementById('gradeComments').value = submission.grade_comments || '';
            document.getElementById('gradeAction').value = 'grade_submission';
            document.getElementById('gradeSubmissionTitle').textContent = `Grade Submission - ${submission.first_name} ${submission.last_name}`;
            
            $('#gradeSubmissionModal').modal('show');
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
            text: 'Failed to load submission details.'
        });
    });
}

/**
 * Submit Grade
 */
function submitGrade() {
    const form = document.getElementById('gradeSubmissionForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const score = parseFloat(document.getElementById('gradeScore').value);
    const maxScore = parseFloat(document.getElementById('gradeMaxScore').value);
    
    if (isNaN(score) || score < 0 || score > maxScore) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Please enter a valid score between 0 and max score.'
        });
        return;
    }
    
    fetch('app/API/apiTeacherSubmissions.php', {
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
                $('#gradeSubmissionModal').modal('hide');
                submissionsTable.ajax.reload();
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
            text: 'An error occurred while submitting the grade.'
        });
    });
}

/**
 * Refresh DataTable
 */
function refreshSubmissionsTable() {
    if (submissionsTable) {
        submissionsTable.ajax.reload();
    }
}
