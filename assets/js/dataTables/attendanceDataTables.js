// Global variables
let attendanceTable;
let currentStudents = [];
let currentAttendanceData = {};
let isEditMode = false;
let currentViewingDate = null;
let currentViewingSubjectId = null;

$(document).ready(function() {
    initializeAttendanceDataTable();
});

/**
 * Initialize Attendance DataTable
 */
function initializeAttendanceDataTable() {
    attendanceTable = $('#attendanceTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: 'app/API/apiAttendance.php',
            type: 'POST',
            data: function(d) {
                d.action = 'datatable';
                return d;
            },
            error: function(xhr, error, code) {
                console.error('DataTables AJAX error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error Loading Attendance',
                    text: 'Failed to load attendance data. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        },
        columns: [
            { data: 'attendance_date', title: 'Date' },
            { data: 'subject_name', title: 'Subject' },
            { data: 'total_students', title: 'Total Students' },
            { 
                data: 'present_count', 
                title: 'Present',
                render: function(data, type, row) {
                    return `<span class="badge bg-success">${data}</span>`;
                }
            },
            { 
                data: 'absent_count', 
                title: 'Absent',
                render: function(data, type, row) {
                    return data > 0 ? `<span class="badge bg-danger">${data}</span>` : `<span class="text-muted">${data}</span>`;
                }
            },
            { 
                data: 'late_count', 
                title: 'Late',
                render: function(data, type, row) {
                    return data > 0 ? `<span class="badge bg-warning">${data}</span>` : `<span class="text-muted">${data}</span>`;
                }
            },
            { 
                data: 'excused_count', 
                title: 'Excused',
                render: function(data, type, row) {
                    return data > 0 ? `<span class="badge bg-secondary">${data}</span>` : `<span class="text-muted">${data}</span>`;
                }
            },
            {
                data: 'actions',
                title: 'Actions',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button type="button" class="btn btn-outline-primary me-1" 
                            onclick="viewAttendanceDetails('${row.attendance_date}', ${row.subject_id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning me-1" 
                            onclick="editAttendanceRecord('${row.attendance_date}', ${row.subject_id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger"
                            onclick="deleteAttendanceRecord('${row.attendance_date}', ${row.subject_id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        order: [[0, 'desc']], // Order by date descending
        pageLength: 10,
        responsive: true,
        language: {
            processing: "Loading attendance records...",
            search: "Search attendance:",
            lengthMenu: "Show _MENU_ records per page",
            info: "Showing _START_ to _END_ of _TOTAL_ records",
            infoEmpty: "No attendance records available",
            infoFiltered: "(filtered from _MAX_ total records)",
            zeroRecords: "No matching attendance records found",
            emptyTable: "No attendance records available"
        }
    });
}

/**
 * Load Students for Attendance
 */
function loadStudentsForAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const subjectId = document.getElementById('subjectId').value;
    
    if (!date || !subjectId) {
        document.getElementById('studentsContainer').innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-people fs-1"></i>
                <p class="mt-2">Please select date and subject to load students</p>
            </div>
        `;
        document.getElementById('saveAttendanceBtn').disabled = true;
        return;
    }
    
    // Show loading
    document.getElementById('studentsContainer').innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading students...</p>
        </div>
    `;
    
    fetch(`app/API/apiAttendance.php?action=get_students&subject_id=${subjectId}&date=${date}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentStudents = data.students;
                currentAttendanceData = data.attendance || {};
                displayStudentsForAttendance();
                document.getElementById('saveAttendanceBtn').disabled = false;
            } else {
                document.getElementById('studentsContainer').innerHTML = `
                    <div class="alert alert-warning">
                        <h6>No Students Found</h6>
                        <p class="mb-0">${data.message}</p>
                    </div>
                `;
                document.getElementById('saveAttendanceBtn').disabled = true;
            }
        })
        .catch(error => {
            console.error('Error loading students:', error);
            document.getElementById('studentsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <h6>Error Loading Students</h6>
                    <p class="mb-0">Failed to load students. Please try again.</p>
                </div>
            `;
            document.getElementById('saveAttendanceBtn').disabled = true;
        });
}

/**
 * Display Students for Attendance
 */
function displayStudentsForAttendance() {
    let studentsHtml = '';
    
    // Add stats section
    const stats = calculateAttendanceStats();
    studentsHtml += `
        <div class="attendance-stats">
            <div class="stat-card">
                <div class="stat-number text-success" id="presentCount">${stats.present}</div>
                <div class="stat-label">Present</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-danger" id="absentCount">${stats.absent}</div>
                <div class="stat-label">Absent</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-warning" id="lateCount">${stats.late}</div>
                <div class="stat-label">Late</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-secondary" id="excusedCount">${stats.excused}</div>
                <div class="stat-label">Excused</div>
            </div>
        </div>
        <hr>
    `;
    
    // Add students list
    currentStudents.forEach(student => {
        const currentStatus = currentAttendanceData[student.id] || 'present';
        const initials = (student.first_name.charAt(0) + student.last_name.charAt(0)).toUpperCase();
        
        studentsHtml += `
            <div class="student-attendance-item" data-student-id="${student.id}" data-student-name="${student.first_name} ${student.last_name}">
                <div class="student-info">
                    <div class="student-avatar">${initials}</div>
                    <div>
                        <div class="fw-bold">${student.first_name} ${student.last_name}</div>
                        <small class="text-muted">${student.email}</small>
                    </div>
                </div>
                <div class="attendance-options">
                    <div class="attendance-option">
                        <input type="radio" name="attendance_${student.id}" value="present" id="present_${student.id}" ${currentStatus === 'present' ? 'checked' : ''} onchange="updateAttendanceStats()">
                        <label for="present_${student.id}">
                            <i class="bi bi-check-circle"></i> Present
                        </label>
                    </div>
                    <div class="attendance-option">
                        <input type="radio" name="attendance_${student.id}" value="absent" id="absent_${student.id}" ${currentStatus === 'absent' ? 'checked' : ''} onchange="updateAttendanceStats()">
                        <label for="absent_${student.id}">
                            <i class="bi bi-x-circle"></i> Absent
                        </label>
                    </div>
                    <div class="attendance-option">
                        <input type="radio" name="attendance_${student.id}" value="late" id="late_${student.id}" ${currentStatus === 'late' ? 'checked' : ''} onchange="updateAttendanceStats()">
                        <label for="late_${student.id}">
                            <i class="bi bi-clock"></i> Late
                        </label>
                    </div>
                    <div class="attendance-option">
                        <input type="radio" name="attendance_${student.id}" value="excused" id="excused_${student.id}" ${currentStatus === 'excused' ? 'checked' : ''} onchange="updateAttendanceStats()">
                        <label for="excused_${student.id}">
                            <i class="bi bi-shield-check"></i> Excused
                        </label>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('studentsContainer').innerHTML = studentsHtml;
}

/**
 * Filter Students
 */
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const studentItems = document.querySelectorAll('.student-attendance-item');
    
    studentItems.forEach(item => {
        const studentName = item.getAttribute('data-student-name').toLowerCase();
        if (studentName.includes(searchTerm)) {
            item.classList.remove('student-hidden');
        } else {
            item.classList.add('student-hidden');
        }
    });
}

/**
 * Mark All Students As
 */
function markAllAs(status) {
    const visibleStudents = document.querySelectorAll('.student-attendance-item:not(.student-hidden)');
    
    visibleStudents.forEach(item => {
        const studentId = item.getAttribute('data-student-id');
        const radioButton = document.getElementById(`${status}_${studentId}`);
        if (radioButton) {
            radioButton.checked = true;
        }
    });
    
    updateAttendanceStats();
    
    Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `All visible students marked as ${status}`,
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * Update Attendance Stats
 */
function updateAttendanceStats() {
    const stats = calculateAttendanceStats();
    
    document.getElementById('presentCount').textContent = stats.present;
    document.getElementById('absentCount').textContent = stats.absent;
    document.getElementById('lateCount').textContent = stats.late;
    document.getElementById('excusedCount').textContent = stats.excused;
}

/**
 * Calculate Attendance Stats
 */
function calculateAttendanceStats() {
    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    
    currentStudents.forEach(student => {
        const checkedRadio = document.querySelector(`input[name="attendance_${student.id}"]:checked`);
        if (checkedRadio) {
            stats[checkedRadio.value]++;
        }
    });
    
    return stats;
}

/**
 * Save Attendance
 */
function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const subjectId = document.getElementById('subjectId').value;
    
    if (!date || !subjectId) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please select date and subject.'
        });
        return;
    }
    
    // Collect attendance data
    const attendanceData = {};
    currentStudents.forEach(student => {
        const checkedRadio = document.querySelector(`input[name="attendance_${student.id}"]:checked`);
        if (checkedRadio) {
            attendanceData[student.id] = checkedRadio.value;
        }
    });
    
    // Show loading
    const saveBtn = document.getElementById('saveAttendanceBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="bi bi-spinner-border"></i> Saving...';
    saveBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('action', isEditMode ? 'update_attendance' : 'save_attendance');
    formData.append('attendance_date', date);
    formData.append('subject_id', subjectId);
    formData.append('attendance_data', JSON.stringify(attendanceData));
    
    fetch('app/API/apiAttendance.php', {
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
                timer: 2000,
                showConfirmButton: false
            });
            
            $('#attendanceModal').modal('hide');
            attendanceTable.ajax.reload();
            resetAttendanceModal();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: data.message
            });
        }
    })
    .catch(error => {
        console.error('Error saving attendance:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while saving attendance.'
        });
    })
    .finally(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

/**
 * View Attendance Details
 */
function viewAttendanceDetails(date, subjectId) {
    // Store current viewing data
    currentViewingDate = date;
    currentViewingSubjectId = subjectId;
    
    fetch(`app/API/apiAttendance.php?action=get_attendance_details&date=${date}&subject_id=${subjectId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayAttendanceDetails(data.data);
                $('#viewAttendanceModal').modal('show');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message
                });
            }
        })
        .catch(error => {
            console.error('Error loading attendance details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to load attendance details.'
            });
        });
}

/**
 * Display Attendance Details
 */
function displayAttendanceDetails(data) {
    let detailsHtml = `
        <div class="row mb-3">
            <div class="col-md-6">
                <strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}
            </div>
            <div class="col-md-6">
                <strong>Subject:</strong> ${data.subject_name}
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="text-center">
                    <div class="h4 text-success">${data.present.length}</div>
                    <small>Present</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="h4 text-danger">${data.absent.length}</div>
                    <small>Absent</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="h4 text-warning">${data.late.length}</div>
                    <small>Late</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="h4 text-secondary">${data.excused.length}</div>
                    <small>Excused</small>
                </div>
            </div>
        </div>
    `;
    
    // Add student lists by status
    ['present', 'absent', 'late', 'excused'].forEach(status => {
        if (data[status].length > 0) {
            const statusColors = {
                present: 'success',
                absent: 'danger',
                late: 'warning',
                excused: 'secondary'
            };
            
            detailsHtml += `
                <div class="mb-3">
                    <h6 class="text-${statusColors[status]} text-capitalize">${status} Students (${data[status].length})</h6>
                    <div class="row">
            `;
            
            data[status].forEach(student => {
                detailsHtml += `
                    <div class="col-md-6 mb-2">
                        <div class="d-flex align-items-center">
                            <div class="student-avatar me-2" style="width: 30px; height: 30px; font-size: 0.8rem;">
                                ${(student.first_name.charAt(0) + student.last_name.charAt(0)).toUpperCase()}
                            </div>
                            <span>${student.first_name} ${student.last_name}</span>
                        </div>
                    </div>
                `;
            });
            
            detailsHtml += `
                    </div>
                </div>
            `;
        }
    });
    
    document.getElementById('attendanceDetailsContent').innerHTML = detailsHtml;
}

/**
 * Edit Attendance Record
 */
function editAttendanceRecord(date, subjectId) {
    isEditMode = true;
    document.getElementById('attendanceModalTitle').textContent = 'Edit Attendance';
    document.getElementById('saveAttendanceText').textContent = 'Update Attendance';
    
    // Convert date format if needed
    const formattedDate = new Date(date).toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = formattedDate;
    document.getElementById('subjectId').value = subjectId;
    
    $('#viewAttendanceModal').modal('hide');
    $('#attendanceModal').modal('show');
    
    // Load students with existing attendance
    loadStudentsForAttendance();
}

/**
 * Edit Attendance (called from view modal)
 */
window.editAttendance = function() {
    if (currentViewingDate && currentViewingSubjectId) {
        editAttendanceRecord(currentViewingDate, currentViewingSubjectId);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Unable to edit attendance. Please try again.'
        });
    }
};

/**
 * Delete Attendance Record
 */
function deleteAttendanceRecord(date, subjectId) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently delete the attendance record for this date!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('action', 'delete_attendance');
            formData.append('attendance_date', date);
            formData.append('subject_id', subjectId);
            
            fetch('app/API/apiAttendance.php', {
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
                        timer: 2000,
                        showConfirmButton: false
                    });
                    attendanceTable.ajax.reload();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting attendance:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'An error occurred while deleting attendance.'
                });
            });
        }
    });
}

/**
 * Reset Attendance Modal
 */
function resetAttendanceModal() {
    isEditMode = false;
    
    // Safely update modal title
    const modalTitle = document.getElementById('attendanceModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Add Attendance';
    }
    
    // Safely update button text
    const saveButtonText = document.getElementById('saveAttendanceText');
    if (saveButtonText) {
        saveButtonText.textContent = 'Save Attendance';
    }
    
    // Reset form fields
    const attendanceDate = document.getElementById('attendanceDate');
    if (attendanceDate) {
        attendanceDate.value = new Date().toISOString().split('T')[0];
    }
    
    const subjectId = document.getElementById('subjectId');
    if (subjectId) {
        subjectId.value = '';
    }
    
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.value = '';
    }
    
    const studentsContainer = document.getElementById('studentsContainer');
    if (studentsContainer) {
        studentsContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-people fs-1"></i>
                <p class="mt-2">Please select date and subject to load students</p>
            </div>
        `;
    }
    
    const saveBtn = document.getElementById('saveAttendanceBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
    }
    
    // Reset state variables
    currentStudents = [];
    currentAttendanceData = {};
    currentViewingDate = null;
    currentViewingSubjectId = null;
}

// Reset modal when it's hidden
$('#attendanceModal').on('hidden.bs.modal', function() {
    resetAttendanceModal();
});
