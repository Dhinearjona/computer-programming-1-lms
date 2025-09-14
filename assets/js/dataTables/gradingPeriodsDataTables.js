$(document).ready(function() {
    // Initialize DataTable
    var table = $('#gradingPeriodsTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "app/API/apiGradingPeriods.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTable AJAX error:', error, thrown);
                toastr.error('Error loading grading periods data');
            }
        },
        "columns": [
            { "data": "id" },
            { "data": "semester_name" },
            { "data": "academic_year" },
            { "data": "name" },
            { "data": "start_date" },
            { "data": "end_date" },
            { "data": "weight_percent" },
            { 
                "data": "status",
                "render": function(data, type, row) {
                    var badgeClass = '';
                    switch(data.toLowerCase()) {
                        case 'active':
                            badgeClass = 'bg-success';
                            break;
                        case 'completed':
                            badgeClass = 'bg-primary';
                            break;
                        case 'pending':
                            badgeClass = 'bg-warning';
                            break;
                        case 'inactive':
                            badgeClass = 'bg-secondary';
                            break;
                        default:
                            badgeClass = 'bg-secondary';
                    }
                    return '<span class="badge ' + badgeClass + '">' + data + '</span>';
                }
            },
            {
                "data": null,
                "orderable": false,
                "render": function(data, type, row) {
                    var actions = '';
                    
                    if (window.canEditGradingPeriods) {
                        actions += '<button class="btn btn-outline-primary me-1" onclick="editGradingPeriod(' + row.id + ')" title="Edit">';
                        actions += '<i class="bi bi-pencil"></i>';
                        actions += '</button>';
                    }
                    
                    if (window.canDeleteGradingPeriods) {
                        actions += '<button class="btn btn-outline-danger" onclick="deleteGradingPeriod(' + row.id + ')" title="Delete">';
                        actions += '<i class="bi bi-trash"></i>';
                        actions += '</button>';
                    }
                    
                    return actions || '<span class="text-muted">No actions</span>';
                }
            }
        ],
        "order": [[0, "desc"]],
        "pageLength": 10,
        "lengthMenu": [[10, 25, 50, 100], [10, 25, 50, 100]],
        "responsive": true,
        "language": {
            "processing": "Loading grading periods...",
            "emptyTable": "No grading periods found",
            "zeroRecords": "No matching grading periods found"
        }
    });

    // loadSemesters() is called when modal opens (see modal events below)

    // Form validation
    $('#gradingPeriodForm').on('submit', function(e) {
        e.preventDefault();
        saveGradingPeriod();
    });

    // Date validation
    $('#start_date, #end_date').on('change', function() {
        validateDates();
    });
});

function loadSemesters() {
    $.ajax({
        url: 'app/API/apiGradingPeriods.php?action=semesters',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                var semesterSelect = $('#semester_id');
                semesterSelect.empty().append('<option value="">Select Semester</option>');
                
                response.data.forEach(function(semester) {
                    var option = $('<option></option>')
                        .attr('value', semester.id)
                        .text(semester.name + ' (' + semester.academic_year + ')');
                    semesterSelect.append(option);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading semesters:', error);
            toastr.error('Error loading semesters');
        }
    });
}

function validateDates() {
    var startDate = $('#start_date').val();
    var endDate = $('#end_date').val();
    
    if (startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
            $('#end_date')[0].setCustomValidity('End date must be after start date');
        } else {
            $('#end_date')[0].setCustomValidity('');
        }
    }
}

function saveGradingPeriod() {
    var formData = {
        action: $('#formAction').val(),
        semester_id: $('#semester_id').val(),
        name: $('#name').val(),
        start_date: $('#start_date').val(),
        end_date: $('#end_date').val(),
        weight_percent: $('#weight_percent').val(),
        status: $('#status').val()
    };

    // Add ID for updates
    if ($('#gradingPeriodId').val()) {
        formData.id = $('#gradingPeriodId').val();
    }

    // Validate form
    if (!validateForm(formData)) {
        return;
    }

    var url = 'app/API/apiGradingPeriods.php';
    var method = formData.id ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        type: method,
        contentType: 'application/json',
        data: JSON.stringify(formData),
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                toastr.success(response.message);
                $('#gradingPeriodModal').modal('hide');
                resetForm();
                $('#gradingPeriodsTable').DataTable().ajax.reload();
            } else {
                toastr.error(response.error || 'An error occurred');
            }
        },
        error: function(xhr, status, error) {
            var response = xhr.responseJSON;
            var errorMessage = response && response.error ? response.error : 'An error occurred while saving';
            toastr.error(errorMessage);
        }
    });
}

function validateForm(data) {
    var errors = [];

    if (!data.semester_id) {
        errors.push('Semester is required');
    }
    if (!data.name) {
        errors.push('Period name is required');
    }
    if (!data.start_date) {
        errors.push('Start date is required');
    }
    if (!data.end_date) {
        errors.push('End date is required');
    }
    if (!data.weight_percent || data.weight_percent <= 0) {
        errors.push('Weight percentage must be greater than 0');
    }

    if (data.start_date && data.end_date) {
        if (new Date(data.start_date) >= new Date(data.end_date)) {
            errors.push('End date must be after start date');
        }
    }

    if (errors.length > 0) {
        toastr.error(errors.join('<br>'));
        return false;
    }

    return true;
}

function editGradingPeriod(id) {
    $.ajax({
        url: 'app/API/apiGradingPeriods.php?action=get&id=' + id,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                var data = response.data;
                
                $('#gradingPeriodId').val(data.id);
                $('#semester_id').val(data.semester_id);
                $('#name').val(data.name);
                $('#start_date').val(data.start_date);
                $('#end_date').val(data.end_date);
                $('#weight_percent').val(data.weight_percent);
                $('#status').val(data.status);
                $('#formAction').val('update_grading_period');
                $('#modalTitle').text('Edit Grading Period');
                
                $('#gradingPeriodModal').modal('show');
            } else {
                toastr.error(response.error || 'Error loading grading period');
            }
        },
        error: function(xhr, status, error) {
            var response = xhr.responseJSON;
            var errorMessage = response && response.error ? response.error : 'Error loading grading period';
            toastr.error(errorMessage);
        }
    });
}

function deleteGradingPeriod(id) {
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
            $.ajax({
                url: 'app/API/apiGradingPeriods.php',
                type: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({
                    action: 'delete_grading_period',
                    id: id
                }),
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        toastr.success(response.message);
                        $('#gradingPeriodsTable').DataTable().ajax.reload();
                    } else {
                        toastr.error(response.error || 'Error deleting grading period');
                    }
                },
                error: function(xhr, status, error) {
                    var response = xhr.responseJSON;
                    var errorMessage = response && response.error ? response.error : 'Error deleting grading period';
                    toastr.error(errorMessage);
                }
            });
        }
    });
}

function resetForm() {
    $('#gradingPeriodForm')[0].reset();
    $('#gradingPeriodId').val('');
    $('#formAction').val('create_grading_period');
    $('#modalTitle').text('Add New Grading Period');
    $('#semester_id').val('').trigger('change');
}

// Modal events
$('#gradingPeriodModal').on('hidden.bs.modal', function() {
    resetForm();
});

$('#gradingPeriodModal').on('show.bs.modal', function() {
    // Load semesters if not already loaded
    if ($('#semester_id option').length <= 1) {
        loadSemesters();
    }
});

// Auto-calculate weight suggestions based on period name
$('#name').on('change', function() {
    var periodName = $(this).val();
    var weightInput = $('#weight_percent');
    
    if (periodName === 'prelim' || periodName === 'midterm') {
        weightInput.val('30.00');
    } else if (periodName === 'finals') {
        weightInput.val('40.00');
    }
});

// Export functions
function exportGradingPeriods() {
    window.open('app/API/apiGradingPeriods.php?action=export', '_blank');
}

function printGradingPeriods() {
    window.print();
}
