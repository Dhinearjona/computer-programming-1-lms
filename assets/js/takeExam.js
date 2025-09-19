// Global variables
let currentExam = null;
let examQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let examTimer = null;
let examStartTime = null;
let timeRemaining = 0;

$(document).ready(function() {
    loadExamData();
});

/**
 * Load Exam Data
 */
function loadExamData() {
    fetch(`app/API/apiTakeExam.php?action=get_exam_data&exam_id=${window.examId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                currentExam = data.exam;
                examQuestions = data.questions;
                displayExamInfo();
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading exam:', error);
            showError('Failed to load exam data. Please try again.');
        });
}

/**
 * Display Exam Information
 */
function displayExamInfo() {
    document.getElementById('examTitle').textContent = currentExam.title;
    document.getElementById('examDescription').innerHTML = currentExam.description || '<em class="text-muted">No description provided</em>';
    document.getElementById('examLesson').textContent = currentExam.lesson_name || 'N/A';
    document.getElementById('examPeriod').textContent = currentExam.grading_period_name || 'N/A';
    document.getElementById('examQuestions').textContent = examQuestions.length;
    document.getElementById('examMaxScore').textContent = currentExam.max_score;
    
    // Time limit
    if (currentExam.time_limit_minutes) {
        document.getElementById('examTimeLimit').textContent = `${currentExam.time_limit_minutes} minutes`;
    } else {
        document.getElementById('examTimeLimit').textContent = 'No time limit';
    }
    
    // Attempts
    const attemptsUsed = currentExam.student_attempts || 0;
    const attemptsAllowed = currentExam.attempts_allowed || 'Unlimited';
    document.getElementById('examAttempts').textContent = `${attemptsUsed}/${attemptsAllowed}`;
    
    // Hide loading screen and show exam info
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('examInfoScreen').style.display = 'block';
}

/**
 * Start Exam
 */
function startExam() {
    if (examQuestions.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No Questions Available',
            text: 'This exam doesn\'t have any questions yet. Please contact your teacher.'
        });
        return;
    }
    
    // Confirm start
    Swal.fire({
        title: 'Start Exam?',
        text: 'Once you start, the timer will begin and you cannot pause the exam.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Start Exam',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            initializeExam();
        }
    });
}

/**
 * Initialize Exam
 */
function initializeExam() {
    examStartTime = new Date();
    
    // Set up timer if there's a time limit
    if (currentExam.time_limit_minutes) {
        timeRemaining = currentExam.time_limit_minutes * 60; // Convert to seconds
        startTimer();
    }
    
    // Initialize question navigator
    initializeQuestionNavigator();
    
    // Show first question
    showQuestion(0);
    
    // Hide exam info and show taking screen
    document.getElementById('examInfoScreen').style.display = 'none';
    document.getElementById('examTakingScreen').style.display = 'block';
    document.getElementById('examTakingTitle').textContent = currentExam.title;
}

/**
 * Start Timer
 */
function startTimer() {
    examTimer = setInterval(() => {
        timeRemaining--;
        
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        
        let timeDisplay = '';
        if (hours > 0) {
            timeDisplay = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        document.getElementById('timeRemaining').textContent = timeDisplay;
        
        // Warning when 5 minutes left
        if (timeRemaining === 300) {
            Swal.fire({
                icon: 'warning',
                title: 'Time Warning',
                text: '5 minutes remaining!',
                timer: 3000,
                showConfirmButton: false
            });
        }
        
        // Auto-submit when time is up
        if (timeRemaining <= 0) {
            clearInterval(examTimer);
            Swal.fire({
                icon: 'warning',
                title: 'Time\'s Up!',
                text: 'Your exam will be submitted automatically.',
                timer: 3000,
                showConfirmButton: false
            }).then(() => {
                submitExam();
            });
        }
    }, 1000);
}

/**
 * Initialize Question Navigator
 */
function initializeQuestionNavigator() {
    const navigator = document.getElementById('questionNavigator');
    navigator.innerHTML = '';
    
    examQuestions.forEach((question, index) => {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item unanswered';
        navItem.textContent = index + 1;
        navItem.onclick = () => showQuestion(index);
        navItem.id = `nav-${index}`;
        navigator.appendChild(navItem);
    });
}

/**
 * Show Question
 */
function showQuestion(index) {
    if (index < 0 || index >= examQuestions.length) return;
    
    currentQuestionIndex = index;
    const question = examQuestions[index];
    
    // Update navigator
    document.querySelectorAll('.nav-item').forEach((item, i) => {
        item.classList.remove('current');
        if (i === index) {
            item.classList.add('current');
        }
    });
    
    // Build question HTML
    let questionHtml = `
        <div class="question-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Question ${index + 1} of ${examQuestions.length}</h5>
                <span class="badge bg-primary">${question.score} points</span>
            </div>
            <div class="question-text mb-4">
                <p>${question.question_text}</p>
            </div>
            <div class="answer-section">
    `;
    
    if (question.question_type === 'multiple_choice') {
        questionHtml += '<div class="choices">';
        question.choices.forEach((choice, choiceIndex) => {
            const isSelected = studentAnswers[question.id] === choice.id;
            questionHtml += `
                <div class="choice-item ${isSelected ? 'selected' : ''}" onclick="selectChoice(${question.id}, '${choice.id}', false)">
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="question_${question.id}" value="${choice.id}" ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label">
                            ${choice.choice_text}
                        </label>
                    </div>
                </div>
            `;
        });
        questionHtml += '</div>';
    } else if (question.question_type === 'checkbox') {
        questionHtml += '<div class="choices">';
        const selectedChoices = studentAnswers[question.id] || [];
        question.choices.forEach((choice, choiceIndex) => {
            const isSelected = selectedChoices.includes(choice.id);
            questionHtml += `
                <div class="choice-item ${isSelected ? 'selected' : ''}" onclick="selectChoice(${question.id}, '${choice.id}', true)">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="question_${question.id}" value="${choice.id}" ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label">
                            ${choice.choice_text}
                        </label>
                    </div>
                </div>
            `;
        });
        questionHtml += '</div>';
    } else if (question.question_type === 'text') {
        const currentAnswer = studentAnswers[question.id] || '';
        questionHtml += `
            <textarea class="form-control text-answer" id="text_${question.id}" placeholder="Enter your answer here..." onchange="saveTextAnswer(${question.id})">${currentAnswer}</textarea>
        `;
    }
    
    questionHtml += '</div></div>';
    
    document.getElementById('questionContainer').innerHTML = questionHtml;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    
    if (index === examQuestions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'inline-block';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

/**
 * Select Choice
 */
function selectChoice(questionId, choiceId, isMultiple) {
    if (isMultiple) {
        // Checkbox - multiple answers
        if (!studentAnswers[questionId]) {
            studentAnswers[questionId] = [];
        }
        
        const index = studentAnswers[questionId].indexOf(choiceId);
        if (index > -1) {
            studentAnswers[questionId].splice(index, 1);
        } else {
            studentAnswers[questionId].push(choiceId);
        }
    } else {
        // Radio - single answer
        studentAnswers[questionId] = choiceId;
    }
    
    // Update UI
    showQuestion(currentQuestionIndex);
    updateNavigatorStatus(currentQuestionIndex);
    
    // Auto-save answer
    saveAnswer(questionId, studentAnswers[questionId]);
}

/**
 * Save Text Answer
 */
function saveTextAnswer(questionId) {
    const textArea = document.getElementById(`text_${questionId}`);
    studentAnswers[questionId] = textArea.value;
    
    updateNavigatorStatus(currentQuestionIndex);
    saveAnswer(questionId, studentAnswers[questionId]);
}

/**
 * Update Navigator Status
 */
function updateNavigatorStatus(index) {
    const navItem = document.getElementById(`nav-${index}`);
    const question = examQuestions[index];
    const hasAnswer = studentAnswers[question.id] !== undefined && studentAnswers[question.id] !== '' && 
                     (Array.isArray(studentAnswers[question.id]) ? studentAnswers[question.id].length > 0 : true);
    
    navItem.classList.remove('unanswered', 'answered');
    navItem.classList.add(hasAnswer ? 'answered' : 'unanswered');
}

/**
 * Save Answer (Auto-save)
 */
function saveAnswer(questionId, answer) {
    const formData = new FormData();
    formData.append('action', 'save_answer');
    formData.append('exam_id', window.examId);
    formData.append('question_id', questionId);
    formData.append('answer', JSON.stringify(answer));
    
    fetch('app/API/apiTakeExam.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to save answer:', data.message);
        }
    })
    .catch(error => {
        console.error('Error saving answer:', error);
    });
}

/**
 * Previous Question
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

/**
 * Next Question
 */
function nextQuestion() {
    if (currentQuestionIndex < examQuestions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

/**
 * Submit Exam
 */
function submitExam() {
    const answeredCount = Object.keys(studentAnswers).length;
    const totalQuestions = examQuestions.length;
    
    let confirmText = `You have answered ${answeredCount} out of ${totalQuestions} questions.`;
    if (answeredCount < totalQuestions) {
        confirmText += ' Unanswered questions will be marked as blank.';
    }
    confirmText += ' Are you sure you want to submit?';
    
    Swal.fire({
        title: 'Submit Exam?',
        text: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Submit',
        cancelButtonText: 'Review Answers'
    }).then((result) => {
        if (result.isConfirmed) {
            performSubmission();
        }
    });
}

/**
 * Perform Submission
 */
function performSubmission() {
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - examStartTime) / 1000); // in seconds
    
    const formData = new FormData();
    formData.append('action', 'submit_exam');
    formData.append('exam_id', window.examId);
    formData.append('answers', JSON.stringify(studentAnswers));
    formData.append('time_taken', timeTaken);
    
    // Show loading
    Swal.fire({
        title: 'Submitting Exam...',
        text: 'Please wait while we process your submission.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });
    
    fetch('app/API/apiTakeExam.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        Swal.close();
        
        if (data.success) {
            // Clear timer
            if (examTimer) {
                clearInterval(examTimer);
            }
            
            // Show completion screen
            showCompletionScreen(timeTaken);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: data.message
            });
        }
    })
    .catch(error => {
        Swal.close();
        console.error('Error submitting exam:', error);
        Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: 'An error occurred while submitting your exam. Please try again.'
        });
    });
}

/**
 * Show Completion Screen
 */
function showCompletionScreen(timeTaken) {
    const answeredCount = Object.keys(studentAnswers).length;
    const timeTakenMinutes = Math.floor(timeTaken / 60);
    
    document.getElementById('totalAnswered').textContent = answeredCount;
    document.getElementById('totalQuestions').textContent = examQuestions.length;
    document.getElementById('timeTaken').textContent = timeTakenMinutes;
    
    // Hide exam taking screen and show completed screen
    document.getElementById('examTakingScreen').style.display = 'none';
    document.getElementById('examCompletedScreen').style.display = 'block';
}

/**
 * View Exam Result
 */
function viewExamResult() {
    window.location.href = `exam-result.php?id=${window.examId}`;
}

/**
 * Show Error
 */
function showError(message) {
    let icon = 'error';
    let title = 'Error Loading Exam';
    
    // Check for specific error types and customize the display
    if (message.includes('not yet open')) {
        icon = 'info';
        title = 'Exam Not Available Yet';
    } else if (message.includes('has closed')) {
        icon = 'warning';
        title = 'Exam Has Closed';
    } else if (message.includes('no questions')) {
        icon = 'info';
        title = 'Exam Not Ready';
    } else if (message.includes('already used all your attempts')) {
        icon = 'warning';
        title = 'No More Attempts';
    }
    
    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        confirmButtonText: 'Go Back to Exams',
        footer: icon === 'error' ? 'Contact your teacher if the problem persists.' : null
    }).then(() => {
        goBackToExams();
    });
}

/**
 * Go Back to Exams
 */
function goBackToExams() {
    window.location.href = 'my-exams.php';
}

// Prevent page refresh/navigation during exam
window.addEventListener('beforeunload', function(e) {
    if (document.getElementById('examTakingScreen').style.display !== 'none') {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress may be lost.';
        return e.returnValue;
    }
});

// Disable right-click and certain keyboard shortcuts during exam
document.addEventListener('contextmenu', function(e) {
    if (document.getElementById('examTakingScreen').style.display !== 'none') {
        e.preventDefault();
    }
});

document.addEventListener('keydown', function(e) {
    if (document.getElementById('examTakingScreen').style.display !== 'none') {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
        }
    }
});
