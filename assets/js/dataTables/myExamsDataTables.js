// Initialization guard to prevent duplicate loading
if (typeof window.myExamsDataTablesLoaded === 'undefined') {
    window.myExamsDataTablesLoaded = true;

    // Global variables
    let myExamsTable;

    $(document).ready(function() {
        initializeMyExamsDataTable();
    });

    /**
     * Initialize My Exams DataTable for Students
     */
    function initializeMyExamsDataTable() {
        // Define columns for students
        let columns = [
            { data: 'title', title: 'Title' },
            { 
                data: 'description', 
                title: 'Description',
                render: function(data, type, row) {
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || '<span class="text-muted">No description</span>';
                }
            },
            { 
                data: 'time_limit_minutes', 
                title: 'Time Limit',
                render: function(data, type, row) {
                    if (data) {
                        return data + ' mins';
                    }
                    return '<span class="text-muted">No limit</span>';
                }
            },
            { 
                data: 'attempts_allowed', 
                title: 'Attempts',
                render: function(data, type, row) {
                    const used = row.student_attempts || 0;
                    const allowed = data || 'Unlimited';
                    if (allowed === 'Unlimited') {
                        return `${used}/Unlimited`;
                    }
                    return `${used}/${allowed}`;
                }
            },
            {
                data: 'status',
                title: 'Status',
                render: function(data, type, row) {
                    const now = new Date();
                    const openDate = new Date(row.open_at);
                    const closeDate = new Date(row.close_at);
                    
                    let badgeClass = '';
                    let statusText = '';
                    
                    if (now < openDate) {
                        badgeClass = 'bg-secondary';
                        statusText = 'Upcoming';
                    } else if (now > closeDate) {
                        badgeClass = 'bg-danger';
                        statusText = 'Closed';
                    } else {
                        badgeClass = 'bg-success';
                        statusText = 'Active';
                    }
                    
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                }
            },
            {
                data: 'student_score',
                title: 'Score',
                render: function(data, type, row) {
                    if (data !== null && data !== undefined) {
                        return `${data}/${row.max_score}`;
                    }
                    return '<span class="text-muted">Not taken</span>';
                }
            },
            {
                data: 'actions',
                title: 'Actions',
                orderable: false,
                render: function(data, type, row) {
                    let actions = '';
                    
                    // View details button for all exams
                    actions += `<button type="button" class="btn btn-outline-primary me-1" 
                        onclick="viewStudentExamDetails(${row.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>`;

                    // Take exam button if exam is active and student has attempts left
                    const now = new Date();
                    const openDate = new Date(row.open_at);
                    const closeDate = new Date(row.close_at);
                    const attemptsUsed = row.student_attempts || 0;
                    const attemptsAllowed = row.attempts_allowed;
                    
                    if (now >= openDate && now <= closeDate && 
                        (!attemptsAllowed || attemptsUsed < attemptsAllowed)) {
                        actions += `<button type="button" class="btn btn-success me-1" 
                            onclick="takeExam(${row.id})" title="Take Exam">
                            <i class="bi bi-play-fill"></i>
                        </button>`;
                    }
                    
                    // View result button if student has taken the exam
                    if (row.student_score !== null && row.student_score !== undefined) {
                        actions += `<button type="button" class="btn btn-outline-secondary" 
                            onclick="viewExamResult(${row.id})" title="View Result">
                            <i class="bi bi-file-text"></i>
                        </button>`;
                    }
                    
                    return actions;
                }
            }
        ];

        // Initialize DataTable
        myExamsTable = $('#myExamsTable').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: 'app/API/apiMyExams.php',
                type: 'POST',
                data: function(d) {
                    d.action = 'datatable';
                    if (typeof window.periodFilter !== 'undefined') {
                        d.period = window.periodFilter;
                    }
                    return d;
                },
                error: function(xhr, error, code) {
                    console.error('DataTables AJAX error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error Loading Exams',
                        text: 'Failed to load exams data. Please try again.',
                        confirmButtonText: 'OK'
                    });
                }
            },
            columns: columns,
            order: [[0, 'asc']], // Order by title ascending
            pageLength: 10,
            responsive: true,
            language: {
                processing: "Loading exams...",
                search: "Search exams:",
                lengthMenu: "Show _MENU_ exams per page",
                info: "Showing _START_ to _END_ of _TOTAL_ exams",
                infoEmpty: "No exams available",
                infoFiltered: "(filtered from _MAX_ total exams)",
                zeroRecords: "No matching exams found",
                emptyTable: "No exams available"
            }
        });
    }

    /**
     * View Student Exam Details
     */
    function viewStudentExamDetails(examId) {
        // Show loading in modal
        document.getElementById('examDetailsContent').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading exam details...</p>
            </div>
        `;
        
        $('#examDetailsModal').modal('show');
        
        fetch(`app/API/apiMyExams.php?action=get_exam&id=${examId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    populateExamDetailsModal(data.data);
                } else {
                    throw new Error(data.message || 'Failed to load exam details');
                }
            })
            .catch(error => {
                console.error('Error loading exam details:', error);
                document.getElementById('examDetailsContent').innerHTML = `
                    <div class="alert alert-danger">
                        <h6>Error Loading Exam Details</h6>
                        <p class="mb-0">${error.message}</p>
                    </div>
                `;
            });
    }

    /**
     * Populate Exam Details Modal
     */
    function populateExamDetailsModal(exam) {
        const formatExamDate = (dateString) => {
            if (!dateString) return 'Not set';
            const date = new Date(dateString);
            return isValidDate(date) ? date.toLocaleString() : 'Invalid date';
        };

        let modalContent = `
            <div class="row">
                <div class="col-md-8">
                    <h5>${exam.title}</h5>
                    ${exam.description ? `<p class="text-muted">${exam.description}</p>` : ''}
                </div>
                <div class="col-md-4 text-end">
                    <span class="badge bg-primary fs-6">${exam.max_score} points</span>
                </div>
            </div>
            <hr>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Lesson:</strong> ${exam.lesson_name || 'N/A'}
                </div>
                <div class="col-md-6">
                    <strong>Grading Period:</strong> ${exam.grading_period_name || 'N/A'}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Time Limit:</strong> ${exam.time_limit_minutes ? exam.time_limit_minutes + ' minutes' : 'No limit'}
                </div>
                <div class="col-md-6">
                    <strong>Attempts Allowed:</strong> ${exam.attempts_allowed || 'Unlimited'}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Display Mode:</strong> ${getDisplayModeText(exam.display_mode)}
                </div>
                <div class="col-md-6">
                    <strong>Status:</strong> ${getExamStatus(exam)}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Opens:</strong> ${formatExamDate(exam.open_at)}
                </div>
                <div class="col-md-6">
                    <strong>Closes:</strong> ${formatExamDate(exam.close_at)}
                </div>
            </div>
        `;

        // Add student-specific information
        modalContent += `
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <strong>Your Score:</strong> ${exam.student_score !== null ? `${exam.student_score}/${exam.max_score}` : 'Not taken yet'}
                </div>
                <div class="col-md-6">
                    <strong>Attempts Used:</strong> ${exam.student_attempts || 0}/${exam.attempts_allowed || 'Unlimited'}
                </div>
            </div>
        `;

        document.getElementById('examDetailsContent').innerHTML = modalContent;
        
        // Add action buttons in footer
        const modalFooter = document.querySelector('#examDetailsModal .modal-footer');
        const closeButton = modalFooter.querySelector('.btn-secondary');
        
        // Remove existing action buttons
        modalFooter.querySelectorAll('.btn:not(.btn-secondary)').forEach(btn => btn.remove());
        
        const now = new Date();
        const openDate = new Date(exam.open_at);
        const closeDate = new Date(exam.close_at);
        const attemptsUsed = exam.student_attempts || 0;
        const attemptsAllowed = exam.attempts_allowed;
        
        if (now >= openDate && now <= closeDate && 
            (!attemptsAllowed || attemptsUsed < attemptsAllowed)) {
            const takeButton = document.createElement('button');
            takeButton.type = 'button';
            takeButton.className = 'btn btn-success me-2';
            takeButton.innerHTML = '<i class="bi bi-play-fill"></i> Take Exam';
            takeButton.onclick = () => {
                $('#examDetailsModal').modal('hide');
                takeExam(exam.id);
            };
            modalFooter.insertBefore(takeButton, closeButton);
        }
    }

    /**
     * Take Exam (redirect to exam page)
     */
    window.takeExam = function(examId) {
        window.location.href = `take-exam.php?id=${examId}`;
    };

    /**
     * View Exam Result
     */
    window.viewExamResult = function(examId) {
        window.location.href = `exam-result.php?id=${examId}`;
    };

    /**
     * Refresh Exams Table
     */
    window.refreshExamsTable = function() {
        if (myExamsTable) {
            myExamsTable.ajax.reload();
        }
    };

    /**
     * Helper Functions
     */
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    function getDisplayModeText(mode) {
        const modes = {
            'all': 'All questions in one page',
            'per_page': 'Five questions per page',
            'single': 'One question per page'
        };
        return modes[mode] || mode;
    }

    function getExamStatus(exam) {
        const now = new Date();
        const openDate = new Date(exam.open_at);
        const closeDate = new Date(exam.close_at);
        
        if (now < openDate) {
            return '<span class="badge bg-secondary">Upcoming</span>';
        } else if (now > closeDate) {
            return '<span class="badge bg-danger">Closed</span>';
        } else {
            return '<span class="badge bg-success">Active</span>';
        }
    }

    // Global wrapper function for backward compatibility
    window.viewExamDetails = viewStudentExamDetails;

} // End of initialization guard
