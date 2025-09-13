let myQuizzesTable;

$(document).ready(function() {
    initializeMyQuizzesTable();
});

function initializeMyQuizzesTable() {
    if ($.fn.DataTable.isDataTable('#myQuizzesTable')) {
        $('#myQuizzesTable').DataTable().destroy();
    }
    
    myQuizzesTable = $('#myQuizzesTable').DataTable({
        "processing": true,
        "serverSide": false, // Client-side processing for simplicity
        "ajax": {
            "url": "app/API/apiMyQuizzes.php?action=datatable",
            "type": "GET",
            "error": function(xhr, error, thrown) {
                console.error('DataTables error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load your quizzes data.'
                });
            }
        },
        "columns": [
            { 
                "data": "title", 
                "width": "20%",
                "render": function(data, type, row) {
                    return `<strong>${data}</strong>`;
                }
            },
            { 
                "data": "subject_name", 
                "width": "15%",
                "render": function(data, type, row) {
                    return `<span class="badge bg-primary">${data}</span>`;
                }
            },
            { 
                "data": "description", 
                "width": "25%",
                "render": function(data, type, row) {
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || 'No description';
                }
            },
            { 
                "data": "time_limit", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data ? `${data} minutes` : 'No limit';
                }
            },
            { 
                "data": "max_score", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data ? `${data} points` : '0 points';
                }
            },
            {
                "data": null,
                "orderable": false,
                "width": "10%",
                "render": function(data, type, row) {
                    let badgeClass = '';
                    let badgeText = '';
                    
                    switch(row.status) {
                        case 'active':
                            badgeClass = 'badge bg-success';
                            badgeText = 'Active';
                            break;
                        case 'inactive':
                            badgeClass = 'badge bg-secondary';
                            badgeText = 'Inactive';
                            break;
                        case 'draft':
                            badgeClass = 'badge bg-warning';
                            badgeText = 'Draft';
                            break;
                        default:
                            badgeClass = 'badge bg-secondary';
                            badgeText = 'Unknown';
                    }
                    
                    return `<span class="${badgeClass}">${badgeText}</span>`;
                }
            },
            {
                "data": null,
                "orderable": false,
                "width": "10%",
                "render": function(data, type, row) {
                    return `
                        <button class="btn btn-outline-info" onclick="viewQuizDetails(${row.id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;
                }
            }
        ],
        "order": [[0, "asc"]], // Order by title ascending
        "pageLength": 10,
        "responsive": true,
        "language": {
            "processing": "Loading your quizzes...",
            "emptyTable": "No quizzes found for you.",
            "zeroRecords": "No matching quizzes found."
        }
    });
}

function viewQuizDetails(id) {
    fetch(`app/API/apiMyQuizzes.php?action=get_quiz&id=${id}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const quiz = data.data;
            
            let content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Title:</strong></h6>
                        <p>${quiz.title}</p>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>Subject:</strong></h6>
                        <p><span class="badge bg-primary">${quiz.subject_name}</span></p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Time Limit:</strong></h6>
                        <p>${quiz.time_limit ? quiz.time_limit + ' minutes' : 'No time limit'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>Max Score:</strong></h6>
                        <p>${quiz.max_score || 0} points</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Status:</strong></h6>
                        <p><span class="badge ${quiz.status === 'active' ? 'bg-success' : quiz.status === 'inactive' ? 'bg-secondary' : 'bg-warning'}">${quiz.status}</span></p>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>Created:</strong></h6>
                        <p>${new Date(quiz.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
            
            if (quiz.description) {
                content += `
                    <div class="row">
                        <div class="col-12">
                            <h6><strong>Description:</strong></h6>
                            <p>${quiz.description}</p>
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('quizDetailsContent').innerHTML = content;
            document.getElementById('quizDetailsTitle').textContent = `Quiz Details: ${quiz.title}`;
            
            const modal = new bootstrap.Modal(document.getElementById('quizDetailsModal'));
            modal.show();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: data.message || 'Failed to load quiz details.'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load quiz details.'
        });
    });
}

function refreshMyQuizzesTable() {
    if (myQuizzesTable) {
        myQuizzesTable.ajax.reload();
    }
}
