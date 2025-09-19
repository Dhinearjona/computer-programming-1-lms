/**
 * Teacher Activities DataTables Configuration and Functions
 */

// Global variables
var teacherSubmissionsTable;
var currentSubmissionId = null;
window.currentTeacherGradingPeriodFilter = window.currentTeacherGradingPeriodFilter || '';
window.currentTeacherStatusFilter = window.currentTeacherStatusFilter || '';

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
    serverSide: true,
    ajax: {
      url: "app/API/apiTeacherActivities.php?action=datatable",
      type: "GET",
      data: function(d) {
        const gradingPeriodEl = document.getElementById('teacherActivitiesGradingPeriodFilter');
        const statusEl = document.getElementById('teacherActivitiesStatusFilter');
        const gradingPeriod = gradingPeriodEl ? gradingPeriodEl.value : '';
        const status = statusEl ? statusEl.value : '';
        
        console.log('Teacher Activities DataTable - Sending filters:', {
          grading_period: gradingPeriod,
          status: status
        });
        
        if (gradingPeriod && gradingPeriod !== '') {
          d.grading_period = gradingPeriod;
        }
        if (status && status !== '') {
          d.status = status;
        }
        return d;
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
            "width": "20%",
            "render": function(data, type, row) {
                return `<strong>${data}</strong>`;
            }
        },
        { 
            "data": "activity_title", 
            "width": "20%",
            "render": function(data, type, row) {
                return data || 'N/A';
            }
        },
        { 
            "data": "subject_name", 
            "width": "15%",
            "render": function(data, type, row) {
                return data ? `<span class="badge bg-primary">${data}</span>` : 'N/A';
            }
        },
        { 
            "data": "grading_period_name", 
            "width": "12%",
            "render": function(data, type, row) {
                let badgeClass = '';
                switch(data?.toLowerCase()) {
                    case 'prelim':
                        badgeClass = 'badge bg-warning';
                        break;
                    case 'midterm':
                        badgeClass = 'badge bg-info';
                        break;
                    case 'finals':
                        badgeClass = 'badge bg-success';
                        break;
                    default:
                        badgeClass = 'badge bg-secondary';
                }
                return data ? `<span class="${badgeClass}">${data}</span>` : 'N/A';
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
            "width": "13%",
            "render": function(data, type, row) {
                let actions = '<div class="btn-group gap-1" role="group">';
                
                // View Details button (always available)
                actions += `
                    <button class="btn btn-outline-primary" onclick="viewSubmission(${data})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                `;
                
                // Grade button (for admin/teacher)
                if (window.canManageActivities) {
                    actions += `
                        <button class="btn btn-outline-success" onclick="gradeSubmission(${data})" title="Grade Submission">
                            <i class="bi bi-pencil"></i>
                        </button>
                    `;
                }
                
                actions += '</div>';
                return actions;
            }
        }
    ],
    "order": [[0, "asc"]],
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
  // Fetch individual submission details
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
  
  content.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-primary">Student Information</h6>
            <div class="mb-2">
              <strong>Student Name:</strong><br>
              <span class="text-dark">${submission.student_name}</span>
            </div>
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
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="card-title text-warning">Submission Content</h6>
            <div class="mb-2">
              <strong>Submission Link:</strong><br>
              ${submission.submission_link ? `<a href="${submission.submission_link}" target="_blank" class="text-primary">${submission.submission_link}</a>` : '<span class="text-muted">No link provided</span>'}
            </div>
            <div class="mb-2">
              <strong>Submission File:</strong><br>
              ${submission.file_path ? `<a href="uploads/activities/student/${submission.file_path}" target="_blank" class="btn btn-outline-primary">Download File</a>` : '<span class="text-muted">No file uploaded</span>'}
            </div>
            <div class="mb-2">
              <strong>Submission Text:</strong><br>
              <div class="p-2 bg-white rounded border">
                ${submission.submission_text || '<span class="text-muted">No text submission</span>'}
              </div>
            </div>
            <div class="mb-2">
              <strong>Submitted At:</strong><br>
              <span class="text-muted">${submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Not submitted'}</span>
            </div>
          </div>
        </div>
      </div>
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
 * Filter submissions by grading period
 */
function filterByGradingPeriod() {
  const gradingPeriodEl = document.getElementById('teacherActivitiesGradingPeriodFilter');
  const selectedValue = gradingPeriodEl ? gradingPeriodEl.value : '';
  console.log('Teacher Activities - Grading Period Filter Changed:', selectedValue);
  console.log('Teacher Activities - Element found:', !!gradingPeriodEl);
  
  if (teacherSubmissionsTable) {
    console.log('Teacher Activities - Reloading table with grading period filter');
    teacherSubmissionsTable.ajax.reload();
  } else {
    console.error('Teacher Activities - Table not found!');
  }
}

/**
 * Filter submissions by status
 */
function filterByStatus() {
  const statusEl = document.getElementById('teacherActivitiesStatusFilter');
  const selectedValue = statusEl ? statusEl.value : '';
  console.log('Teacher Activities - Status Filter Changed:', selectedValue);
  console.log('Teacher Activities - Element found:', !!statusEl);
  
  if (teacherSubmissionsTable) {
    console.log('Teacher Activities - Reloading table with status filter');
    teacherSubmissionsTable.ajax.reload();
  } else {
    console.error('Teacher Activities - Table not found!');
  }
}

/**
 * Test teacher activity filters function
 */
function testTeacherActivityFilters() {
  console.log('=== TEACHER ACTIVITIES FILTER DEBUG ===');
  
  // Check DOM elements
  const gradingPeriodEl = document.getElementById('teacherActivitiesGradingPeriodFilter');
  const statusEl = document.getElementById('teacherActivitiesStatusFilter');
  const tableWrapper = document.getElementById('submissionsTable_wrapper');
  
  console.log('DOM Elements Check:', {
    gradingPeriodFilter: !!gradingPeriodEl,
    statusFilter: !!statusEl,
    tableWrapper: !!tableWrapper,
    gradingPeriodValue: gradingPeriodEl ? gradingPeriodEl.value : 'ELEMENT NOT FOUND',
    statusValue: statusEl ? statusEl.value : 'ELEMENT NOT FOUND'
  });
  
  if (gradingPeriodEl) {
    console.log('Grading Period Element Details:', {
      id: gradingPeriodEl.id,
      value: gradingPeriodEl.value,
      parentElement: gradingPeriodEl.parentElement?.className
    });
  }
  
  if (statusEl) {
    console.log('Status Element Details:', {
      id: statusEl.id,
      value: statusEl.value,
      parentElement: statusEl.parentElement?.className
    });
  }
  
  const gradingPeriod = gradingPeriodEl ? gradingPeriodEl.value : '';
  const status = statusEl ? statusEl.value : '';
  
  // Test API directly
  const testUrl = `app/API/apiTeacherActivities.php?action=datatable&draw=999&start=0&length=10&grading_period=${gradingPeriod}&status=${status}`;
  console.log('Test URL:', testUrl);
  
  fetch(testUrl)
    .then(response => response.json())
    .then(data => {
      console.log('API Response:', data);
      alert(`API Test Results:\nTotal Records: ${data.recordsTotal}\nFiltered Records: ${data.recordsFiltered}\nData Count: ${data.data.length}\n\nCheck console for full response.`);
    })
    .catch(error => {
      console.error('API Test Error:', error);
      alert('API Test Failed - Check console for details');
    });
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
