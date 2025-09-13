/**
 * Announcements DataTables Configuration and Functions
 */

// Global variables
let announcementsTable;
let currentAnnouncementEditId = null;

$(document).ready(function() {
    initializeAnnouncementsTable();
    setupModalEvents();
});

/**
 * Initialize Announcements DataTable
 */
function initializeAnnouncementsTable() {
    announcementsTable = $('#announcementsTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "app/API/apiAnnouncements.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load announcements data.'
                });
            }
        },
        "columns": (function() {
            // Define columns based on user role
            if (window.currentUserRole === 'student') {
                // Student view - no ID, no Created By, with View action
                return [
                    { "data": "title", "width": "30%" },
                    { "data": "message", "width": "45%" },
                    { "data": "created_at", "width": "15%" },
                    { 
                        "data": "actions", 
                        "orderable": false,
                        "width": "10%",
                        "render": function(data, type, row) {
                            return `
                                <button class="btn btn-outline-info" onclick="viewAnnouncement(${data})" title="View Details">
                                    <i class="bi bi-eye"></i>
                                </button>
                            `;
                        }
                    }
                ];
            } else {
                // Admin/Teacher view - full columns with actions
                return [
                    { "data": "id", "width": "5%" },
                    { "data": "title", "width": "25%" },
                    { "data": "message", "width": "35%" },
                    { "data": "created_by", "width": "15%" },
                    { "data": "created_at", "width": "10%" },
                    { 
                        "data": "actions", 
                        "orderable": false,
                        "width": "10%",
                        "render": function(data, type, row) {
                            let actions = '';
                            
                            // Check permissions based on role
                            if (window.canEditAnnouncements || window.canDeleteAnnouncements) {
                                actions = '<div class="btn-group gap-2" role="group">';
                                
                                // Edit button - Admin and Teacher can edit
                                if (window.canEditAnnouncements) {
                                    actions += `
                                        <button class="btn btn-outline-primary" onclick="editAnnouncement(${row.id})" title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    `;
                                }
                                
                                // Delete button - Only Admin can delete
                                if (window.canDeleteAnnouncements) {
                                    actions += `
                                        <button class="btn btn-outline-danger" onclick="deleteAnnouncement(${row.id})" title="Delete">
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
            "processing": "Loading announcements...",
            "emptyTable": "No announcements found",
            "zeroRecords": "No matching announcements found"
        }
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Reset modal when closed
    $('#announcementModal').on('hidden.bs.modal', function () {
        resetAnnouncementForm();
    });
    
    // Form validation
    $('#announcementForm').on('submit', function(e) {
        e.preventDefault();
        saveAnnouncement();
    });
    
    // Character count for title
    $('#title').on('input', function() {
        const length = $(this).val().length;
        const maxLength = 255;
        const remaining = maxLength - length;
        
        $('#titleCount').text(`${length}/${maxLength} characters`);
        
        if (remaining < 0) {
            $(this).addClass('is-invalid');
            $('#titleCount').addClass('text-danger');
        } else {
            $(this).removeClass('is-invalid');
            $('#titleCount').removeClass('text-danger');
        }
    });
    
    // Character count for message
    $('#message').on('input', function() {
        const length = $(this).val().length;
        $('#messageCount').text(`${length} characters`);
    });
}

/**
 * Reset announcement form
 */
function resetAnnouncementForm() {
    document.getElementById('announcementForm').reset();
    document.getElementById('formAction').value = 'create_announcement';
    document.getElementById('modalTitle').textContent = 'Create New Announcement';
    document.getElementById('announcementId').value = '';
    currentAnnouncementEditId = null;
    
    // Reset validation classes
    $('#announcementForm .form-control').removeClass('is-valid is-invalid');
    $('#announcementForm .form-text').remove();
    $('#titleCount, #messageCount').text('');
}

/**
 * Save Announcement (Create or Update)
 */
function saveAnnouncement() {
    const form = document.getElementById('announcementForm');
    const formData = new FormData(form);
    
    // Validate required fields
    if (!validateAnnouncementForm()) {
        return;
    }
    
    const action = formData.get('action');
    const url = 'app/API/apiAnnouncements.php';
    
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
                $('#announcementModal').modal('hide');
                announcementsTable.ajax.reload();
                resetAnnouncementForm();
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
            text: 'An error occurred while saving the announcement.'
        });
    });
}

/**
 * Validate announcement form
 */
function validateAnnouncementForm() {
    let isValid = true;
    
    // Validate title
    const title = $('#title').val().trim();
    if (title.length === 0) {
        $('#title').addClass('is-invalid');
        isValid = false;
    } else if (title.length > 255) {
        $('#title').addClass('is-invalid');
        isValid = false;
    } else {
        $('#title').removeClass('is-invalid').addClass('is-valid');
    }
    
    // Validate message
    const message = $('#message').val().trim();
    if (message.length === 0) {
        $('#message').addClass('is-invalid');
        isValid = false;
    } else {
        $('#message').removeClass('is-invalid').addClass('is-valid');
    }
    
    return isValid;
}

/**
 * Edit Announcement
 */
function editAnnouncement(id) {
    currentAnnouncementEditId = id;
    
    fetch(`app/API/apiAnnouncements.php?action=get_announcement&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            populateAnnouncementForm(data.data);
            document.getElementById('formAction').value = 'update_announcement';
            document.getElementById('modalTitle').textContent = 'Edit Announcement';
            $('#announcementModal').modal('show');
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
            text: 'Failed to load announcement data.'
        });
    });
}

/**
 * Populate announcement form with data
 */
function populateAnnouncementForm(announcement) {
    document.getElementById('announcementId').value = announcement.id;
    document.getElementById('title').value = announcement.title;
    document.getElementById('message').value = announcement.message;
    
    // Update character counts
    $('#title').trigger('input');
    $('#message').trigger('input');
}

/**
 * View Announcement Details
 */
function viewAnnouncement(id) {
    fetch(`app/API/apiAnnouncements.php?action=get_announcement&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const announcement = data.data;
            Swal.fire({
                title: announcement.title,
                html: `
                    <div class="text-start">
                        <div class="mb-3">
                            <strong>Message:</strong>
                            <div class="mt-2 p-3 bg-light rounded">
                                ${announcement.message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Created by:</strong> ${announcement.created_by_name} (${announcement.created_by_role})</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Created at:</strong> ${new Date(announcement.created_at).toLocaleString()}</p>
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
            text: 'Failed to load announcement details.'
        });
    });
}

/**
 * Delete Announcement
 */
function deleteAnnouncement(id) {
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
            formData.append('action', 'delete_announcement');
            formData.append('id', id);
            
            fetch('app/API/apiAnnouncements.php', {
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
                        announcementsTable.ajax.reload();
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
                    text: 'An error occurred while deleting the announcement.'
                });
            });
        }
    });
}

/**
 * Refresh DataTable
 */
function refreshAnnouncementsTable() {
    if (announcementsTable) {
        announcementsTable.ajax.reload();
    }
}

/**
 * Export announcements data to CSV
 */
function exportAnnouncementsData() {
    fetch('app/API/apiAnnouncements.php?action=list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const announcements = data.data;
            let csvContent = "ID,Title,Message,Created By,Created At\n";
            
            announcements.forEach(announcement => {
                const message = announcement.message.replace(/"/g, '""'); // Escape quotes
                csvContent += `"${announcement.id}","${announcement.title}","${message}","${announcement.created_by_name}","${announcement.created_at}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'announcements_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to export announcements data.'
        });
    });
}

/**
 * View announcement statistics
 */
function viewAnnouncementStatistics() {
    fetch('app/API/apiAnnouncements.php?action=get_statistics')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.data;
            Swal.fire({
                title: 'Announcement Statistics',
                html: `
                    <div class="text-start">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Overall Statistics</h6>
                                <p><strong>Total Announcements:</strong> ${stats.total_announcements}</p>
                                <p><strong>Today:</strong> ${stats.today_announcements}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Recent Activity</h6>
                                <p><strong>This Week:</strong> ${stats.week_announcements}</p>
                                <p><strong>This Month:</strong> ${stats.month_announcements}</p>
                            </div>
                        </div>
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
            text: 'Failed to load announcement statistics.'
        });
    });
}

/**
 * Search announcements
 */
function searchAnnouncements() {
    const searchTerm = $('#searchInput').val().trim();
    
    if (searchTerm.length === 0) {
        announcementsTable.search('').draw();
        return;
    }
    
    fetch(`app/API/apiAnnouncements.php?action=search&search=${encodeURIComponent(searchTerm)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear current table and populate with search results
            announcementsTable.clear();
            data.data.forEach(announcement => {
                announcementsTable.row.add({
                    'id': announcement.id,
                    'title': announcement.title,
                    'message': announcement.message.length > 100 ? announcement.message.substring(0, 100) + '...' : announcement.message,
                    'created_by': announcement.created_by_name,
                    'created_at': new Date(announcement.created_at).toLocaleDateString(),
                    'actions': announcement.id
                });
            });
            announcementsTable.draw();
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
            text: 'Failed to search announcements.'
        });
    });
}
