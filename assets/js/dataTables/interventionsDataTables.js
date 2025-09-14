/**
 * Interventions DataTables Configuration and Functions
 */

// Global variables
let interventionsTable;
let currentInterventionEditId = null;

$(document).ready(function () {
  initializeInterventionsTable();
  setupModalEvents();
  // Note: loadStudents() and CommonAPI.loadSubjects() will be called when modal opens
});

/**
 * Initialize Interventions DataTable
 */
function initializeInterventionsTable() {
  interventionsTable = $("#interventionsTable").DataTable({
    processing: true,
    serverSide: false,
    ajax: {
      url: "app/API/apiInterventions.php?action=datatable",
      type: "GET",
      error: function (xhr, error, thrown) {
        console.error("DataTables error:", error);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to load interventions data.",
        });
      },
    },
    "columns": [
        { "data": "id", "width": "5%" },
        { "data": "student_name", "width": "15%" },
        { "data": "email", "width": "15%" },
        { "data": "course", "width": "10%" },
        { "data": "year_level", "width": "10%" },
        { "data": "subject_name", "width": "15%" },
        { "data": "notes", "width": "20%" },
        { "data": "notify_teacher", "width": "10%" },
        { "data": "created_at", "width": "10%" },
        { 
            "data": "actions", 
            "orderable": false,
            "width": "10%",
            "render": function(data, type, row) {
                let actions = '';
                
                // Check permissions based on role
                if (window.canEditInterventions || window.canDeleteInterventions) {
                    actions = '<div class="btn-group gap-2" role="group">';
                    
                    // Edit button
                    if (window.canEditInterventions) {
                        actions += `
                            <button class="btn btn-outline-primary" onclick="editIntervention(${row.id})" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                    }
                    
                    // Delete button
                    if (window.canDeleteInterventions) {
                        actions += `
                            <button class="btn btn-outline-danger" onclick="deleteIntervention(${row.id})" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                    }
                    
                    actions += '</div>';
                }
                
                return actions;
            }
        }
    ],
    "order": [[0, "desc"]],
    pageLength: 10,
    responsive: true,
    language: {
      processing: "Loading interventions...",
      emptyTable: "No interventions found",
      zeroRecords: "No matching interventions found",
    },
  });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
  // Reset modal when closed
  $("#interventionModal").on("hidden.bs.modal", function () {
    resetInterventionForm();
  });

  // Load data when modal is shown
  $("#interventionModal").on("shown.bs.modal", function () {
    loadStudents();
    CommonAPI.loadSubjects();
  });

  // Form validation
  $("#interventionForm").on("submit", function (e) {
    e.preventDefault();
    saveIntervention();
  });

  // Auto-format student selection
  $("#student_id").on("change", function () {
    updateStudentInfo();
  });
}

/**
 * Load students for dropdown
 */
function loadStudents() {
  fetch("app/API/apiInterventions.php?action=get_students")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const select = document.getElementById("student_id");
        if (select) {
          select.innerHTML = '<option value="">Select Student</option>';

          data.data.forEach((student) => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.full_name} (${student.course} - ${student.year_level})`;
            select.appendChild(option);
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error loading students:", error);
    });
}

/**
 * Load subjects for dropdown
 */
function loadSubjects() {
  fetch("app/API/apiActivities.php?action=get_subjects")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const select = document.getElementById("subject_id");
        if (select) {
          select.innerHTML = '<option value="">Select Subject</option>';

          data.data.forEach((subject) => {
            const option = document.createElement("option");
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error loading subjects:", error);
    });
}

/**
 * Update student info display
 */
function updateStudentInfo() {
  const studentId = $("#student_id").val();
  const studentInfoDiv = $("#studentInfo");

  if (studentId) {
    // Find selected student from dropdown
    const selectedOption = $("#student_id option:selected");
    if (selectedOption.length && selectedOption.val()) {
      const studentText = selectedOption.text();
      studentInfoDiv.html(`
                <div class="alert alert-info">
                    <strong>Selected Student:</strong> ${studentText}
                </div>
            `);
    }
  } else {
    studentInfoDiv.empty();
  }
}

/**
 * Save intervention
 */
function saveIntervention() {
  const formData = new FormData(document.getElementById("interventionForm"));
  const action = currentInterventionEditId
    ? "update_intervention"
    : "create_intervention";
  formData.set("action", action);

  if (currentInterventionEditId) {
    formData.set("id", currentInterventionEditId);
  }

  fetch("app/API/apiInterventions.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: data.message,
        }).then(() => {
          $("#interventionModal").modal("hide");
          refreshInterventionsTable();
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
        text: "An error occurred while saving the intervention.",
      });
    });
}

/**
 * Edit intervention
 */
function editIntervention(id) {
  currentInterventionEditId = id;

  fetch(`app/API/apiInterventions.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `action=get_intervention&id=${id}`,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const intervention = data.data;

        // Populate form
        $("#interventionId").val(intervention.id);
        $("#student_id").val(intervention.student_id);
        $("#subject_id").val(intervention.subject_id);
        $("#notify_teacher").prop('checked', intervention.notify_teacher == 1);
        $("#notes").val(intervention.notes);
        $("#formAction").val("update_intervention");

        // Update modal title
        $("#modalTitle").text("Edit Intervention");

        // Update student info
        updateStudentInfo();

        // Show modal
        $("#interventionModal").modal("show");
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
        text: "An error occurred while loading the intervention.",
      });
    });
}

/**
 * Delete intervention
 */
function deleteIntervention(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("app/API/apiInterventions.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `action=delete_intervention&id=${id}`,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: data.message,
            }).then(() => {
              refreshInterventionsTable();
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
            text: "An error occurred while deleting the intervention.",
          });
        });
    }
  });
}

/**
 * Reset intervention form
 */
function resetInterventionForm() {
  document.getElementById("interventionForm").reset();
  $("#interventionId").val("");
  $("#formAction").val("create_intervention");
  $("#modalTitle").text("Add New Intervention");
  $("#studentInfo").empty();
  currentInterventionEditId = null;
}

/**
 * Refresh DataTable
 */
function refreshInterventionsTable() {
  if (interventionsTable) {
    interventionsTable.ajax.reload();
  }
}

/**
 * Export interventions data to CSV
 */
function exportInterventionsData() {
  fetch("app/API/apiInterventions.php?action=list")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const interventions = data.data;
        let csvContent =
          "ID,Student Name,Course,Year Level,Subject,Notes,Notify Teacher,Created At\n";

        interventions.forEach((intervention) => {
          csvContent += `"${intervention.id}","${intervention.student_name}","${intervention.course}","${intervention.year_level}","${intervention.subject_name}","${intervention.notes}","${intervention.notify_teacher}","${intervention.created_at}"\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interventions_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Interventions data exported successfully.",
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

/**
 * View intervention statistics
 */
function viewInterventionStatistics() {
  fetch("app/API/apiInterventions.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "action=get_intervention_statistics",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const stats = data.data;

        let statsHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Total Interventions:</strong> ${stats.total}</h6>
                        <h6><strong>Recent (30 days):</strong> ${stats.recent}</h6>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>By Type:</strong></h6>
                        <ul class="list-unstyled">
            `;

        stats.by_type.forEach((type) => {
          statsHtml += `<li>${type.subject_name || 'No Subject'}: ${type.count}</li>`;
        });

        statsHtml += `
                        </ul>
                    </div>
                </div>
            `;

        if (stats.active_students && stats.active_students.length > 0) {
          statsHtml += `
                    <div class="mt-3">
                        <h6><strong>Most Active Students:</strong></h6>
                        <ul class="list-unstyled">
                `;

          stats.active_students.forEach((student) => {
            statsHtml += `<li>${student.student_name} (${student.student_number}): ${student.intervention_count} interventions</li>`;
          });

          statsHtml += `</ul></div>`;
        }

        Swal.fire({
          title: "Intervention Statistics",
          html: statsHtml,
          icon: "info",
          width: "600px",
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
        text: "An error occurred while loading statistics.",
      });
    });
}

/**
 * View intervention details (for students)
 */
function viewIntervention(id) {
  fetch(`app/API/apiInterventions.php?action=get_intervention&id=${id}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const intervention = data.data;
      Swal.fire({
        title: 'Intervention Details',
        html: `
          <div class="text-start">
            <div class="mb-3">
              <strong>Student:</strong> ${intervention.student_name}
            </div>
            <div class="mb-3">
              <strong>Course:</strong> ${intervention.course}
            </div>
            <div class="mb-3">
              <strong>Year Level:</strong> ${intervention.year_level}
            </div>
            <div class="mb-3">
              <strong>Subject:</strong> ${intervention.subject_name || 'No Subject'}
            </div>
            <div class="mb-3">
              <strong>Notes:</strong>
              <div class="mt-2 p-3 bg-light rounded">
                ${intervention.notes.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Created by:</strong> ${intervention.created_by_username} (${intervention.created_by_role})</p>
              </div>
              <div class="col-md-6">
                <p><strong>Created at:</strong> ${new Date(intervention.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Close',
        width: '700px',
        heightAuto: true,
        allowOutsideClick: true,
        scrollbarPadding: false,
        customClass: {
          popup: 'swal2-no-scroll'
        }
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
      text: 'An error occurred while loading the intervention details.'
    });
  });
}

/**
 * Search interventions
 */
function searchInterventions() {
  const searchTerm = $("#searchInput").val().trim();

  if (searchTerm.length === 0) {
    interventionsTable.search("").draw();
    return;
  }

  fetch(
    `app/API/apiInterventions.php?action=search&search=${encodeURIComponent(
      searchTerm
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear current table and populate with search results
        interventionsTable.clear();
        data.data.forEach((intervention) => {
          interventionsTable.row.add({
            id: intervention.id,
            student_name: intervention.student_name,
            course: intervention.course,
            year_level: intervention.year_level,
            subject_name: intervention.subject_name,
            notes: intervention.notes,
            notify_teacher: intervention.notify_teacher ? 'Yes' : 'No',
            created_at: new Date(intervention.created_at).toLocaleDateString(),
            actions: intervention.id,
          });
        });
        interventionsTable.draw();
      } else {
        Swal.fire({
          icon: "error",
          title: "Search Error!",
          text: data.message,
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "An error occurred while searching.",
      });
    });
}
