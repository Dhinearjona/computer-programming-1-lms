var myQuizzesTable;

$(document).ready(function() {
    // Prevent multiple initializations
    if (window.myQuizzesTableInitialized) {
        return;
    }
    
    initializeMyQuizzesTable();
    window.myQuizzesTableInitialized = true;
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
                "data": "lesson_title", 
                "width": "15%",
                "render": function(data, type, row) {
                    return data || 'No lesson';
                }
            },
            { 
                "data": "grading_period_name", 
                "width": "12%",
                "render": function(data, type, row) {
                    if (data) {
                        return `<span class="badge bg-info">${data}</span>`;
                    }
                    return '';
                }
            },
            { 
                "data": "time_limit_minutes", 
                "width": "10%",
                "render": function(data, type, row) {
                    return data ? `${data} min` : 'No limit';
                }
            },
            { 
                "data": "max_score", 
                "width": "8%",
                "render": function(data, type, row) {
                    return data ? `${data}` : '0';
                }
            },
            { 
                "data": "my_score", 
                "width": "8%",
                "render": function(data, type, row) {
                    if (row.my_score !== null && row.my_score !== undefined) {
                        return `<span class="badge bg-primary">${row.my_score}</span>`;
                    } else {
                        return '<span class="badge bg-light text-dark">Not taken</span>';
                    }
                }
            },
            {
                "data": "quiz_status",
                "orderable": false,
                "width": "10%",
                "render": function(data, type, row) {
                    let badgeClass = '';
                    let badgeText = '';
                    
                    // Determine status based on whether quiz is taken and grading period
                    if (row.my_score !== null && row.my_score !== undefined) {
                        badgeClass = 'badge bg-success';
                        badgeText = 'Completed';
                    } else if (row.grading_period_status === 'active') {
                        badgeClass = 'badge bg-primary';
                        badgeText = 'Available';
                    } else if (row.grading_period_status === 'completed') {
                        badgeClass = 'badge bg-warning';
                        badgeText = 'Closed';
                    } else {
                        badgeClass = 'badge bg-secondary';
                        badgeText = 'Pending';
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
                        <button class="btn btn-outline-info" onclick="viewQuizDetails(${row.id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;
                    
                    // Take Quiz button (only if not taken and grading period is active)
                    if (row.my_score === null && row.my_score === undefined && 
                        row.grading_period_status === 'active' && window.canTakeQuizzes) {
                        actions += `
                            <button class="btn btn-outline-primary" onclick="takeQuiz(${row.id})" title="Take Quiz">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                        `;
                    }
                    
                    actions += '</div>';
                    return actions;
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
                        <h6><strong>Lesson:</strong></h6>
                        <p>${quiz.lesson_title || 'No lesson'}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Grading Period:</strong></h6>
                        <p><span class="badge bg-info">${quiz.grading_period_name || 'Unknown'}</span></p>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>Time Limit:</strong></h6>
                        <p>${quiz.time_limit_minutes ? quiz.time_limit_minutes + ' minutes' : 'No time limit'}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Max Score:</strong></h6>
                        <p>${quiz.max_score || 0} points</p>
                    </div>
                    <div class="col-md-6">
                        <h6><strong>My Score:</strong></h6>
                        <p>${quiz.my_score !== null && quiz.my_score !== undefined ? 
                            `<span class="badge bg-primary">${quiz.my_score}</span>` : 
                            '<span class="badge bg-light text-dark">Not taken</span>'}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6><strong>Status:</strong></h6>
                        <p>${quiz.my_score !== null && quiz.my_score !== undefined ? 
                            '<span class="badge bg-success">Completed</span>' : 
                            quiz.grading_period_status === 'active' ? 
                            '<span class="badge bg-primary">Available</span>' : 
                            '<span class="badge bg-warning">Closed</span>'}</p>
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

/**
 * Take Quiz
 */
function takeQuiz(quizId) {
    Swal.fire({
        title: 'Take Quiz',
        text: 'Are you ready to start this quiz? Make sure you have a stable internet connection.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Start Quiz',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            // For now, show a placeholder message
            // In a real implementation, this would redirect to a quiz taking page
            Swal.fire({
                title: 'Quiz Taking',
                text: 'Quiz taking functionality will be implemented in the next phase. For now, you can view quiz details.',
                icon: 'info',
                confirmButtonText: 'OK'
            });
            
            // Alternative: redirect to quiz taking page
            // window.location.href = `take-quiz.php?id=${quizId}`;
        }
    });
}

function refreshMyQuizzesTable() {
    if (myQuizzesTable) {
        myQuizzesTable.ajax.reload();
    }
}
