// Initialization guard to prevent duplicate loading
if (typeof window.examsDataTablesLoaded === 'undefined') {
    window.examsDataTablesLoaded = true;

    // Global variables
    let examsTable;
    let currentExamId = null;

    $(document).ready(function() {
        initializeExamsDataTable();
        
        // Load dropdowns for teachers/admins
        if (window.canManageQuizzes) {
            loadLessons();
            loadGradingPeriods();
        }
    });

    /**
     * Initialize Exams DataTable
     */
    function initializeExamsDataTable() {
        // Define base columns
        let columns = [
            { data: 'title', title: 'Title' }
        ];

        // Add lesson column for teachers/admins
        if (window.canManageQuizzes) {
            columns.push({ data: 'lesson_name', title: 'Lesson' });
        }

        // Add common columns
        columns.push(
            { data: 'grading_period_name', title: 'Grading Period' },
            { data: 'max_score', title: 'Max Score' },
            { 
                data: 'time_limit_minutes', 
                title: 'Time Limit',
                render: function(data, type, row) {
                    if (data) {
                        return data + ' mins';
                    }
                    return 'No limit';
                }
            }
        );

        // Add attempts column for teachers/admins
        if (window.canManageQuizzes) {
            columns.push({ 
                data: 'attempts_allowed', 
                title: 'Attempts',
                render: function(data, type, row) {
                    return data || 'Unlimited';
                }
            });
        }

        // Add status column
        columns.push({
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
        });

        // Add score column for students
        if (window.canViewOwnQuizzes && !window.canManageQuizzes) {
            columns.push({
                data: 'student_score',
                title: 'Score',
                render: function(data, type, row) {
                    if (data !== null && data !== undefined) {
                        return `${data}/${row.max_score}`;
                    }
                    return '<span class="text-muted">Not taken</span>';
                }
            });
        }

        // Add actions column
        columns.push({
            data: 'actions',
            title: 'Actions',
            orderable: false,
            render: function(data, type, row) {
                let actions = '';
                
                // View details button for all users
                actions += `<button type="button" class="btn btn-outline-primary me-1" 
                    onclick="viewExamDetails(${row.id})" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>`;

                if (window.canManageQuizzes) {
                    // Edit button for teachers/admins
                    actions += `<button type="button" class="btn btn-outline-warning me-1" 
                        onclick="editExam(${row.id})" title="Edit Exam">
                        <i class="bi bi-pencil"></i>
                    </button>`;
                    
                    // Manage questions button
                    actions += `<button type="button" class="btn btn-outline-info me-1" 
                        onclick="manageQuestions(${row.id}, '${row.title}')" title="Manage Questions">
                        <i class="bi bi-list-ul"></i>
                    </button>`;
                    
                    // Delete button
                    actions += `<button type="button" class="btn btn-outline-danger" 
                        onclick="deleteExam(${row.id})" title="Delete Exam">
                        <i class="bi bi-trash"></i>
                    </button>`;
                } else if (window.canTakeQuizzes) {
                    // Take exam button for students
                    const now = new Date();
                    const openDate = new Date(row.open_at);
                    const closeDate = new Date(row.close_at);
                    
                    if (now >= openDate && now <= closeDate) {
                        actions += `<button type="button" class="btn btn-success me-1" 
                            onclick="takeExam(${row.id})" title="Take Exam">
                            <i class="bi bi-play-fill"></i> Take
                        </button>`;
                    }
                    
                    // View result button if student has taken the exam
                    if (row.student_score !== null && row.student_score !== undefined) {
                        actions += `<button type="button" class="btn btn-outline-secondary" 
                            onclick="viewExamResult(${row.id})" title="View Result">
                            <i class="bi bi-file-text"></i>
                        </button>`;
                    }
                }
                
                return actions;
            }
        });

        // Initialize DataTable
        examsTable = $('#examsTable').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: 'app/API/apiExams.php',
                type: 'POST',
                data: function(d) {
                    d.action = 'datatable';
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
            order: [[0, 'desc']], // Order by first column (title) descending
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
     * Load Lessons
     */
    function loadLessons() {
        fetch('app/API/apiLessons.php?action=get_all')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const lessonSelect = document.getElementById('lesson_id');
                    lessonSelect.innerHTML = '<option value="">Select Lesson</option>';
                    
                    data.data.forEach(lesson => {
                        lessonSelect.innerHTML += `<option value="${lesson.id}">${lesson.title}</option>`;
                    });
                } else {
                    console.error('Error loading lessons:', data.message);
                }
            })
            .catch(error => {
                console.error('Error loading lessons:', error);
            });
    }

    /**
     * Load Grading Periods
     */
    function loadGradingPeriods() {
        fetch('app/API/apiGradingPeriods.php?action=get_all')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const gradingPeriodSelect = document.getElementById('grading_period_id');
                    gradingPeriodSelect.innerHTML = '<option value="">Select Grading Period</option>';
                    
                    data.data.forEach(period => {
                        gradingPeriodSelect.innerHTML += `<option value="${period.id}">${period.name}</option>`;
                    });
                } else {
                    console.error('Error loading grading periods:', data.message);
                }
            })
            .catch(error => {
                console.error('Error loading grading periods:', error);
            });
    }

    /**
     * Save Exam
     */
    window.saveExam = function() {
        const form = document.getElementById('examForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submitButtonText');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        fetch('app/API/apiExams.php', {
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
                
                // Close modal and refresh table
                $('#examModal').modal('hide');
                examsTable.ajax.reload();
                resetExamForm();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message
                });
            }
        })
        .catch(error => {
            console.error('Error saving exam:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while saving the exam.'
            });
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };

    /**
     * Edit Exam
     */
    window.editExam = function(examId) {
        currentExamId = examId;
        
        // Fetch exam details
        fetch(`app/API/apiExams.php?action=get_exam&id=${examId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateEditForm(data.data);
                    $('#examModal').modal('show');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                console.error('Error loading exam details:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to load exam details.'
                });
            });
    };

    /**
     * Populate Edit Form
     */
    function populateEditForm(exam) {
        document.getElementById('modalTitle').textContent = 'Edit Exam';
        document.getElementById('formAction').value = 'update_exam';
        document.getElementById('examId').value = exam.id;
        document.getElementById('lesson_id').value = exam.lesson_id;
        document.getElementById('grading_period_id').value = exam.grading_period_id;
        document.getElementById('title').value = exam.title;
        document.getElementById('description').value = exam.description || '';
        document.getElementById('max_score').value = exam.max_score;
        document.getElementById('time_limit_minutes').value = exam.time_limit_minutes || '';
        document.getElementById('attempts_allowed').value = exam.attempts_allowed;
        document.getElementById('display_mode').value = exam.display_mode;
        
        // Format datetime for input fields
        if (exam.open_at) {
            const openDate = new Date(exam.open_at);
            document.getElementById('open_at').value = formatDateTimeLocal(openDate);
        }
        if (exam.close_at) {
            const closeDate = new Date(exam.close_at);
            document.getElementById('close_at').value = formatDateTimeLocal(closeDate);
        }
        
        document.getElementById('submitButtonText').textContent = 'Update Exam';
    }

    /**
     * View Exam Details
     */
    window.viewExamDetails = function(examId) {
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
        
        // Determine which API to use based on user role
        const apiUrl = window.canManageQuizzes ? 
            `app/API/apiExams.php?action=get_exam&id=${examId}` :
            `app/API/apiMyExams.php?action=get_exam&id=${examId}`;
        
        fetch(apiUrl)
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
    };

    /**
     * Populate Exam Details Modal
     */
    function populateExamDetailsModal(exam) {
        const formatDate = (dateString) => {
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
                    <strong>Opens:</strong> ${formatDate(exam.open_at)}
                </div>
                <div class="col-md-6">
                    <strong>Closes:</strong> ${formatDate(exam.close_at)}
                </div>
            </div>
        `;

        // Add student-specific information
        if (window.canViewOwnQuizzes && !window.canManageQuizzes && exam.student_score !== undefined) {
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
        }

        document.getElementById('examDetailsContent').innerHTML = modalContent;
        
        // Add action buttons in footer if student can take exam
        const modalFooter = document.querySelector('#examDetailsModal .modal-footer');
        const closeButton = modalFooter.querySelector('.btn-secondary');
        
        // Remove existing action buttons
        modalFooter.querySelectorAll('.btn:not(.btn-secondary)').forEach(btn => btn.remove());
        
        if (window.canTakeQuizzes && !window.canManageQuizzes) {
            const now = new Date();
            const openDate = new Date(exam.open_at);
            const closeDate = new Date(exam.close_at);
            
            if (now >= openDate && now <= closeDate && (exam.student_attempts || 0) < (exam.attempts_allowed || 999)) {
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
    }

    /**
     * Delete Exam
     */
    window.deleteExam = function(examId) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the exam and all associated questions!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const formData = new FormData();
                formData.append('action', 'delete_exam');
                formData.append('id', examId);
                
                fetch('app/API/apiExams.php', {
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
                        examsTable.ajax.reload();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: data.message
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deleting exam:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'An error occurred while deleting the exam.'
                    });
                });
            }
        });
    };

    /**
     * Export Exams Data
     */
    window.exportExamsData = function() {
        window.location.href = 'app/API/apiExams.php?action=export';
    };

    /**
     * Take Exam (for students)
     */
    window.takeExam = function(examId) {
        window.location.href = `take-exam.php?id=${examId}`;
    };

    /**
     * View Exam Result (for students)
     */
    window.viewExamResult = function(examId) {
        // Implementation for viewing exam results
        window.location.href = `exam-result.php?id=${examId}`;
    };

    /**
     * Manage Questions
     */
    window.manageQuestions = function(examId, examTitle) {
        currentExamId = examId;
        document.getElementById('quizTitleForQuestions').textContent = examTitle;
        document.getElementById('questionQuizId').value = examId;
        
        $('#questionsModal').modal('show');
        loadQuestions(examId);
    };

    /**
     * Load Questions
     */
    function loadQuestions(examId) {
        document.getElementById('questionsList').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading questions...</p>
            </div>
        `;
        
        fetch(`app/API/apiExamQuestions.php?action=get_questions&exam_id=${examId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayQuestions(data.data);
                } else {
                    document.getElementById('questionsList').innerHTML = `
                        <div class="alert alert-info text-center">
                            <h6>No Questions Yet</h6>
                            <p class="mb-0">Click "Add Question" to create the first question for this exam.</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading questions:', error);
                document.getElementById('questionsList').innerHTML = `
                    <div class="alert alert-danger">
                        <h6>Error Loading Questions</h6>
                        <p class="mb-0">Failed to load questions. Please try again.</p>
                    </div>
                `;
            });
    }

    /**
     * Display Questions
     */
    function displayQuestions(questions) {
        if (!questions || questions.length === 0) {
            document.getElementById('questionsList').innerHTML = `
                <div class="alert alert-info text-center">
                    <h6>No Questions Yet</h6>
                    <p class="mb-0">Click "Add Question" to create the first question for this exam.</p>
                </div>
            `;
            return;
        }

        let questionsHtml = '';
        questions.forEach((question, index) => {
            // Process choices if they exist
            let choicesHtml = '';
            if (question.choices_array && question.choices_array.length > 0) {
                choicesHtml = '<ul class="list-unstyled mt-2 ms-3">';
                question.choices_array.forEach(choice => {
                    const correctIcon = choice.is_correct ? 
                        '<i class="bi bi-check-circle-fill text-success me-1"></i>' : 
                        '<i class="bi bi-circle text-muted me-1"></i>';
                    choicesHtml += `<li class="mb-1"><small>${correctIcon}${choice.text}</small></li>`;
                });
                choicesHtml += '</ul>';
            }

            // Get question type badge
            const getQuestionTypeBadge = (type) => {
                const badges = {
                    'multiple_choice': '<span class="badge bg-info">Multiple Choice</span>',
                    'checkbox': '<span class="badge bg-warning">Multiple Answer</span>',
                    'text': '<span class="badge bg-secondary">Text Answer</span>'
                };
                return badges[type] || `<span class="badge bg-light text-dark">${type}</span>`;
            };

            questionsHtml += `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-2">
                                    <h6 class="card-title mb-0 me-2">Question ${index + 1}</h6>
                                    <span class="badge bg-primary me-2">${question.score} pts</span>
                                    ${getQuestionTypeBadge(question.question_type)}
                                </div>
                                <p class="card-text">${question.question_text}</p>
                                ${choicesHtml}
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-outline-primary" onclick="editQuestion(${question.id})" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button type="button" class="btn btn-outline-danger" onclick="deleteQuestion(${question.id})" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        document.getElementById('questionsList').innerHTML = questionsHtml;
    }

    /**
     * Add New Question
     */
    window.addNewQuestion = function() {
        document.getElementById('questionModalTitle').textContent = 'Add Question';
        document.getElementById('questionFormAction').value = 'create_question';
        document.getElementById('questionQuizId').value = currentExamId;
        $('#questionModal').modal('show');
    };

    /**
     * Edit Question
     */
    window.editQuestion = function(questionId) {
        Swal.fire({
            icon: 'info',
            title: 'Coming Soon',
            text: 'Edit question functionality will be implemented soon.'
        });
    };

    /**
     * Delete Question
     */
    window.deleteQuestion = function(questionId) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the question!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const formData = new FormData();
                formData.append('action', 'delete_question');
                formData.append('id', questionId);
                
                fetch('app/API/apiExamQuestions.php', {
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
                        loadQuestions(currentExamId);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: data.message
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deleting question:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'An error occurred while deleting the question.'
                    });
                });
            }
        });
    };

    /**
     * Handle Question Type Change
     */
    window.handleQuestionTypeChange = function() {
        const questionType = document.getElementById('questionType').value;
        const choicesSection = document.getElementById('choicesSection');
        const textAnswerSection = document.getElementById('textAnswerSection');
        
        if (questionType === 'multiple_choice' || questionType === 'checkbox') {
            choicesSection.style.display = 'block';
            textAnswerSection.style.display = 'none';
        } else if (questionType === 'text') {
            choicesSection.style.display = 'none';
            textAnswerSection.style.display = 'block';
        } else {
            choicesSection.style.display = 'none';
            textAnswerSection.style.display = 'none';
        }
    };

    /**
     * Add Choice
     */
    window.addChoice = function() {
        const choicesList = document.getElementById('choicesList');
        const choiceIndex = choicesList.children.length;
        
        const choiceDiv = document.createElement('div');
        choiceDiv.className = 'input-group mb-2';
        choiceDiv.innerHTML = `
            <div class="input-group-text">
                <input class="form-check-input mt-0" type="radio" name="correct_answer" value="${choiceIndex}">
            </div>
            <input type="text" class="form-control" name="choices[]" placeholder="Enter choice text..." required>
            <button class="btn btn-outline-danger" type="button" onclick="removeChoice(this)">
                <i class="bi bi-trash"></i>
            </button>
        `;
        
        choicesList.appendChild(choiceDiv);
    };

    /**
     * Remove Choice
     */
    window.removeChoice = function(button) {
        button.closest('.input-group').remove();
    };

    /**
     * Save Question
     */
    window.saveQuestion = function() {
        Swal.fire({
            icon: 'info',
            title: 'Coming Soon',
            text: 'Save question functionality will be implemented soon.'
        });
    };

    /**
     * Helper Functions
     */
    function formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

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

    /**
     * Reset Exam Form
     */
    function resetExamForm() {
        document.getElementById('examForm').reset();
        document.getElementById('modalTitle').textContent = 'Add New Exam';
        document.getElementById('formAction').value = 'create_exam';
        document.getElementById('examId').value = '';
        document.getElementById('submitButtonText').textContent = 'Submit';
        currentExamId = null;
    }

    // Reset form when modal is hidden
    $('#examModal').on('hidden.bs.modal', function() {
        resetExamForm();
    });

} // End of initialization guard
