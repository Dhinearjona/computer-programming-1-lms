/**
 * Teacher Activities DataTables Configuration and Functions
 */

// Global variables
var teacherSubmissionsTable;
var currentSubmissionId = null;

$(document).ready(function () {
  // Prevent multiple initializations
  if (window.teacherActivitiesInitialized) {
    return;
  }
  window.teacherActivitiesInitialized = true;
  
  initializeSubmissionsTable();
  setupModalEvents();
});

/**
 * Initialize Submissions DataTable
 */
function initializeSubmissionsTable() {
  teacherSubmissionsTable = $("#submissionsTable").DataTable({
    processing: true,
    serverSide: false,
    ajax: {
      url: "app/API/apiTeacherActivities.php?action=datatable",
      type: "GET",
      dataSrc: function(json) {
        return json.data;
      },
      error: function (xhr, error, thrown) {
        console.error("DataTables error:", error);
        console.error("XHR:", xhr);
        console.error("Response:", xhr.responseText);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to load submissions data: " + error,
        });
      },
    },
    "columns": [
        { 
            "data": "student_name", 
            "width": "15%",
            "render": function(data, type, row) {
                return `<strong>${data}</strong>`;
            }
        },
        { 
            "data": "activity_title", 
            "width": "20%",
            "render": function(data, type, row) {
                return `<strong>${data}</strong>`;
            }
        },
        { 
            "data": "subject_name", 
            "width": "12%",
            "render": function(data, type, row) {
                return data ? `<span class="badge bg-primary">${data}</span>` : 'N/A';
            }
        },
        { 
            "data": "grading_period_name", 
            "width": "12%",
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
            "data": "submitted_at", 
            "width": "12%",
            "render": function(data, type, row) {
                if (data) {
                    const date = new Date(data);
                    return date.toLocaleDateString();
                }
                return 'N/A';
            }
        },
        { 
            "data": "status", 
            "width": "10%",
            "render": function(data, type, row) {
                let badgeClass = '';
                let badgeText = '';
                
                switch(data) {
                    case 'submitted':
                        badgeClass = 'badge bg-success';
                        badgeText = 'Submitted';
                        break;
                    case 'unsubmitted':
                        badgeClass = 'badge bg-secondary';
                        badgeText = 'Unsubmitted';
                        break;
                    default:
                        badgeClass = 'badge bg-success';
                        badgeText = 'Submitted';
                }
                
                return `<span class="${badgeClass}">${badgeText}</span>`;
            }
        },
        { 
            "data": "grade", 
            "width": "10%",
            "render": function(data, type, row) {
                if (data && data !== 'Not Graded') {
                    return `<span class="badge bg-info">${data}</span>`;
                }
                return '<span class="badge bg-secondary">Not Graded</span>';
            }
        },
        { 
            "data": "actions", 
            "orderable": false,
            "width": "9%",
            "render": function(data, type, row) {
                let actions = '<div class="btn-group gap-1" role="group">';
                
                // View Details button (always available)
                actions += `
                    <button class="btn btn-outline-info" onclick="viewSubmission(${data})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                `;
                
                // Grade button (for admin/teacher)
                if (window.canManageActivities) {
                    actions += `
                        <button class="btn btn-outline-success" onclick="gradeSubmission(${data})" title="Grade Submission">
                            <i class="bi bi-star"></i>
                        </button>
                    `;
                }
                
                actions += '</div>';
                return actions;
            }
        }
    ],
    "order": [[4, "desc"]],
    pageLength: 10,
    responsive: true,
    language: {
      processing: "Loading submissions...",
      emptyTable: "No submissions found",
      zeroRecords: "No matching submissions found",
    },
  });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
  // Reset modal when closed
  $("#gradeSubmissionModal").on("hidden.bs.modal", function () {
    resetGradeForm();
  });
  
  // Clear submission details modal content when closed
  $('#submissionDetailsModal').on('hidden.bs.modal', function () {
    document.getElementById('submissionDetailsContent').innerHTML = '';
  });
}

/**
 * View submission details
 */
function viewSubmission(id) {
  fetch(`app/API/apiTeacherActivities.php?action=get_submission&id=${id}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const submission = data.data;
      populateSubmissionDetailsModal(submission);
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
      text: 'An error occurred while loading the submission details.'
    });
  });
}

/**
 * Populate submission details modal
 */
function populateSubmissionDetailsModal(submission) {
  const content = document.getElementById('submissionDetailsContent');
  
  // Get status badge
  const statusBadge = submission.status === 'submitted' 
    ? '<span class="badge bg-success">Submitted</span>' 
    : '<span class="badge bg-secondary">Unsubmitted</span>';
  
  // Get grade badge
  const gradeBadge = submission.grade && submission.grade !== 'Not Graded'
    ? `<span class="badge bg-info">${submission.grade}</span>`
    : '<span class="badge bg-secondary">Not Graded</span>';
  
  content.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-primary">
              <i class="bi bi-person"></i> Student Information
            </h6>
            <div class="mb-2">
              <strong>Student Name:</strong><br>
              <span class="text-dark">${submission.student_name}</span>
            </div>
            <div class="mb-2">
              <strong>Course:</strong><br>
              <span class="text-muted">${submission.course || 'N/A'}</span>
            </div>
            <div class="mb-2">
              <strong>Year Level:</strong><br>
              <span class="text-muted">${submission.year_level || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-success">
              <i class="bi bi-book"></i> Activity Information
            </h6>
            <div class="mb-2">
              <strong>Activity Title:</strong><br>
              <span class="text-dark">${submission.activity_title}</span>
            </div>
            <div class="mb-2">
              <strong>Subject:</strong><br>
              <span class="badge bg-primary">${submission.subject_name || 'N/A'}</span>
            </div>
            <div class="mb-2">
              <strong>Grading Period:</strong><br>
              <span class="badge bg-info">${submission.grading_period_name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-3">
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-info">
              <i class="bi bi-calendar"></i> Submission Details
            </h6>
            <div class="mb-2">
              <strong>Submission Date:</strong><br>
              <span class="text-muted">${submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}</span>
            </div>
            <div class="mb-2">
              <strong>Status:</strong><br>
              ${statusBadge}
            </div>
            <div class="mb-2">
              <strong>Grade:</strong><br>
              ${gradeBadge}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-warning">
              <i class="bi bi-file-text"></i> Submission Content
            </h6>
            <div class="mb-2">
              <strong>Submission Link:</strong><br>
              ${submission.submission_link ? `<a href="${submission.submission_link}" target="_blank" class="text-primary">${submission.submission_link}</a>` : 'N/A'}
            </div>
            <div class="mb-2">
              <strong>Submission Text:</strong><br>
              <div class="p-2 bg-white rounded border">
                ${submission.submission_text || 'No text submission'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    ${submission.comments ? `
    <div class="row mt-3">
      <div class="col-12">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-secondary">
              <i class="bi bi-chat-text"></i> Teacher Comments
            </h6>
            <div class="p-3 bg-white rounded border">
              ${submission.comments}
            </div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="alert alert-info mt-3">
      <h6><i class="bi bi-info-circle"></i> Submission Information</h6>
      <ul class="mb-0">
        <li>This submission was made by the student for the specified activity</li>
        <li>You can grade this submission using the "Grade Submission" button</li>
        <li>Grades and comments will be visible to the student</li>
        <li>All submissions are tracked for academic progress monitoring</li>
      </ul>
    </div>
  `;
}

/**
 * Grade submission
 */
function gradeSubmission(id) {
  currentSubmissionId = id;
  
  // Fetch submission details to pre-fill the form
  fetch(`app/API/apiTeacherActivities.php?action=get_submission&id=${id}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const submission = data.data;
      
      // Pre-fill form if already graded
      if (submission.grade && submission.grade !== 'Not Graded') {
        document.getElementById('gradeScore').value = submission.score || '';
        document.getElementById('gradeMaxScore').value = submission.max_score || '';
        document.getElementById('gradeComments').value = submission.comments || '';
      } else {
        // Reset form for new grading
        document.getElementById('gradeScore').value = '';
        document.getElementById('gradeMaxScore').value = '';
        document.getElementById('gradeComments').value = '';
      }
      
      // Show modal
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
      text: 'Failed to load submission data.'
    });
  });
}

/**
 * Submit grade
 */
function submitGrade() {
  const form = document.getElementById('gradeSubmissionForm');
  const formData = new FormData(form);
  
  // Validate required fields
  const score = document.getElementById('gradeScore').value;
  const maxScore = document.getElementById('gradeMaxScore').value;
  
  if (!score || !maxScore) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error!',
      text: 'Please fill in both score and max score fields.'
    });
    return;
  }
  
  if (parseFloat(score) > parseFloat(maxScore)) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error!',
      text: 'Score cannot be greater than max score.'
    });
    return;
  }
  
  formData.set('submission_id', currentSubmissionId);
  
  fetch('app/API/apiTeacherActivities.php', {
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
        teacherSubmissionsTable.ajax.reload();
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
      text: 'An error occurred while submitting the grade.'
    });
  });
}

/**
 * Reset grade form
 */
function resetGradeForm() {
  document.getElementById('gradeSubmissionForm').reset();
  document.getElementById('gradeAction').value = 'grade_submission';
  currentSubmissionId = null;
}

/**
 * Refresh DataTable
 */
function refreshSubmissionsTable() {
  if (teacherSubmissionsTable) {
    teacherSubmissionsTable.ajax.reload();
  }
}

/**
 * Export submissions data to CSV
 */
function exportSubmissionsData() {
  fetch("app/API/apiTeacherActivities.php?action=export")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const submissions = data.data;
        let csvContent = "Student Name,Activity Title,Subject,Grading Period,Submission Date,Status,Grade,Score,Max Score,Comments\n";

        submissions.forEach((submission) => {
          csvContent += `"${submission.student_name}","${submission.activity_title}","${submission.subject_name}","${submission.grading_period_name}","${submission.submitted_at}","${submission.status}","${submission.grade}","${submission.score || ''}","${submission.max_score || ''}","${submission.comments || ''}"\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `student_submissions_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Submissions data exported successfully.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message,
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "An error occurred while exporting data.",
      });
    });
}
