/**
 * Take Quiz JavaScript - Handles quiz taking functionality
 */

// Global variables
let quizData = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let attemptId = null;
let timerInterval = null;
let timeRemaining = 0;
let isQuizStarted = false;

$(document).ready(function() {
    loadQuizData();
});

/**
 * Load Quiz Data and Questions
 */
function loadQuizData() {
    fetch(`app/API/apiTakeQuiz.php?action=get_quiz_data&quiz_id=${window.quizId}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('Raw server response:', text);
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error('Server returned invalid response: ' + text.substring(0, 200));
        }
    })
    .then(data => {
        if (data.success) {
            quizData = data.quiz;
            questions = data.questions;
            displayQuizInfo();
        } else {
            console.error('API Error:', data.message);
            showError(data.message || 'Failed to load quiz data');
        }
    })
    .catch(error => {
        console.error('Error loading quiz:', error);
        showError('Failed to load quiz. Please check the console for details or try a different quiz.');
    });
}

/**
 * Display Quiz Information Screen
 */
function displayQuizInfo() {
    document.getElementById('quizTitle').textContent = quizData.title;
    document.getElementById('quizDescription').textContent = quizData.description || 'No description provided';
    document.getElementById('maxScore').textContent = quizData.max_score;
    document.getElementById('attemptsAllowed').textContent = quizData.attempts_allowed;
    document.getElementById('totalQuestions').textContent = questions.length;
    
    if (quizData.time_limit_minutes) {
        document.getElementById('timeLimit').textContent = quizData.time_limit_minutes + ' minutes';
        document.getElementById('timerInstruction').textContent = `• You have ${quizData.time_limit_minutes} minutes to complete this quiz`;
    } else {
        document.getElementById('timeLimit').textContent = 'No time limit';
        document.getElementById('timerInstruction').textContent = '• No time limit for this quiz';
    }
    
    // Hide loading screen and show info screen
    document.getElementById('quizLoadingScreen').style.display = 'none';
    document.getElementById('quizInfoScreen').style.display = 'block';
}

/**
 * Start Quiz
 */
function startQuiz() {
    // Create quiz attempt
    const formData = new FormData();
    formData.append('action', 'start_attempt');
    formData.append('quiz_id', window.quizId);
    
    fetch('app/API/apiTakeQuiz.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            attemptId = data.attempt_id;
            isQuizStarted = true;
            
            // Initialize timer if time limit exists
            if (quizData.time_limit_minutes) {
                timeRemaining = quizData.time_limit_minutes * 60; // Convert to seconds
                startTimer();
            }
            
            // Show quiz taking screen
            document.getElementById('quizInfoScreen').style.display = 'none';
            document.getElementById('quizTakingScreen').style.display = 'block';
            
            // Load first question
            loadQuestion(0);
            updateProgress();
            updateNavigationButtons();
            
            // Update quiz title in progress
            document.getElementById('quizTitleInProgress').textContent = quizData.title;
            document.getElementById('totalQuestionsCount').textContent = questions.length;
            
        } else {
            showError(data.message || 'Failed to start quiz');
        }
    })
    .catch(error => {
        console.error('Error starting quiz:', error);
        showError('Failed to start quiz. Please try again.');
    });
}

/**
 * Start Timer
 */
function startTimer() {
    document.getElementById('timerDisplay').style.display = 'block';
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitQuiz();
        }
    }, 1000);
}

/**
 * Update Timer Display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timeRemaining').textContent = timeString;
    
    // Change color based on remaining time
    const timerDisplay = document.getElementById('timerDisplay');
    if (timeRemaining <= 300) { // 5 minutes
        timerDisplay.className = 'badge bg-danger fs-6';
    } else if (timeRemaining <= 600) { // 10 minutes
        timerDisplay.className = 'badge bg-warning fs-6';
    } else {
        timerDisplay.className = 'badge bg-primary fs-6';
    }
}

/**
 * Load Question
 */
function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    
    let questionHtml = `
        <div class="question-container">
            <div class="mb-4">
                <h5>Question ${index + 1}</h5>
                <p class="question-text">${question.question_text}</p>
                <small class="text-muted">Points: ${question.score}</small>
            </div>
            
            <div class="answer-section">
    `;
    
    if (question.question_type === 'multiple_choice') {
        questionHtml += '<div class="mb-3">';
        question.choices.forEach((choice, choiceIndex) => {
            const isChecked = answers[question.id] == choice.id ? 'checked' : '';
            questionHtml += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="question_${question.id}" 
                           value="${choice.id}" id="choice_${question.id}_${choiceIndex}" ${isChecked}
                           onchange="saveAnswer(${question.id}, this.value)">
                    <label class="form-check-label" for="choice_${question.id}_${choiceIndex}">
                        ${choice.choice_text}
                    </label>
                </div>
            `;
        });
        questionHtml += '</div>';
        
    } else if (question.question_type === 'checkbox') {
        questionHtml += '<div class="mb-3">';
        question.choices.forEach((choice, choiceIndex) => {
            const savedAnswers = answers[question.id] || [];
            const isChecked = savedAnswers.includes(choice.id) ? 'checked' : '';
            questionHtml += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" name="question_${question.id}[]" 
                           value="${choice.id}" id="choice_${question.id}_${choiceIndex}" ${isChecked}
                           onchange="saveCheckboxAnswer(${question.id}, this.value, this.checked)">
                    <label class="form-check-label" for="choice_${question.id}_${choiceIndex}">
                        ${choice.choice_text}
                    </label>
                </div>
            `;
        });
        questionHtml += '</div>';
        
    } else if (question.question_type === 'text') {
        const savedText = answers[question.id] || '';
        questionHtml += `
            <div class="mb-3">
                <textarea class="form-control" name="question_${question.id}" rows="4" 
                          placeholder="Enter your answer here..." 
                          onchange="saveAnswer(${question.id}, this.value)">${savedText}</textarea>
            </div>
        `;
    }
    
    questionHtml += `
            </div>
        </div>
    `;
    
    document.getElementById('questionsContainer').innerHTML = questionHtml;
    document.getElementById('currentQuestionNumber').textContent = index + 1;
    
    updateNavigationButtons();
    updateProgress();
}

/**
 * Save Answer
 */
function saveAnswer(questionId, value) {
    answers[questionId] = value;
    
    // Auto-save to server
    const formData = new FormData();
    formData.append('action', 'save_answer');
    formData.append('attempt_id', attemptId);
    formData.append('question_id', questionId);
    formData.append('answer', value);
    
    fetch('app/API/apiTakeQuiz.php', {
        method: 'POST',
        body: formData
    })
    .catch(error => {
        console.error('Error saving answer:', error);
    });
}

/**
 * Save Checkbox Answer
 */
function saveCheckboxAnswer(questionId, choiceId, isChecked) {
    if (!answers[questionId]) {
        answers[questionId] = [];
    }
    
    if (isChecked) {
        if (!answers[questionId].includes(choiceId)) {
            answers[questionId].push(choiceId);
        }
    } else {
        answers[questionId] = answers[questionId].filter(id => id !== choiceId);
    }
    
    // Auto-save to server
    const formData = new FormData();
    formData.append('action', 'save_answer');
    formData.append('attempt_id', attemptId);
    formData.append('question_id', questionId);
    formData.append('answer', JSON.stringify(answers[questionId]));
    
    fetch('app/API/apiTakeQuiz.php', {
        method: 'POST',
        body: formData
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
        loadQuestion(currentQuestionIndex - 1);
    }
}

/**
 * Next Question
 */
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    }
}

/**
 * Update Navigation Buttons
 */
function updateNavigationButtons() {
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').disabled = currentQuestionIndex === questions.length - 1;
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
    }
}

/**
 * Update Progress Bar
 */
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressBar').setAttribute('aria-valuenow', progress);
}

/**
 * Show Question Navigator
 */
function showQuestionNavigator() {
    let navigatorHtml = '<div class="row">';
    
    questions.forEach((question, index) => {
        const isAnswered = answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '';
        const isCurrent = index === currentQuestionIndex;
        const buttonClass = isCurrent ? 'btn-primary' : (isAnswered ? 'btn-success' : 'btn-outline-secondary');
        
        navigatorHtml += `
            <div class="col-3 mb-2">
                <button type="button" class="btn ${buttonClass} w-100" onclick="jumpToQuestion(${index})" data-bs-dismiss="modal">
                    ${index + 1}
                </button>
            </div>
        `;
    });
    
    navigatorHtml += '</div>';
    document.getElementById('questionNavigatorList').innerHTML = navigatorHtml;
    $('#questionNavigatorModal').modal('show');
}

/**
 * Jump to Question
 */
function jumpToQuestion(index) {
    loadQuestion(index);
}

/**
 * Finish Quiz
 */
function finishQuiz() {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;
    
    let message = 'Are you sure you want to finish this quiz?';
    if (unansweredCount > 0) {
        message += `\n\nYou have ${unansweredCount} unanswered question(s). These will be marked as incorrect.`;
    }
    
    Swal.fire({
        title: 'Finish Quiz',
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, finish quiz',
        cancelButtonText: 'Continue quiz'
    }).then((result) => {
        if (result.isConfirmed) {
            submitQuiz();
        }
    });
}

/**
 * Submit Quiz
 */
function submitQuiz() {
    // Show loading
    Swal.fire({
        title: 'Submitting Quiz...',
        text: 'Please wait while we process your answers.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const formData = new FormData();
    formData.append('action', 'submit_quiz');
    formData.append('attempt_id', attemptId);
    
    fetch('app/API/apiTakeQuiz.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        Swal.close();
        
        if (data.success) {
            showQuizResults(data.result);
        } else {
            showError(data.message || 'Failed to submit quiz');
        }
    })
    .catch(error => {
        Swal.close();
        console.error('Error submitting quiz:', error);
        showError('Failed to submit quiz. Please try again.');
    });
}

/**
 * Auto Submit Quiz (when time runs out)
 */
function autoSubmitQuiz() {
    Swal.fire({
        title: 'Time\'s Up!',
        text: 'Your quiz will be automatically submitted.',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false
    }).then(() => {
        submitQuiz();
    });
}

/**
 * Show Quiz Results
 */
function showQuizResults(result) {
    const percentage = Math.round((result.score / result.max_score) * 100);
    
    document.getElementById('quizResults').innerHTML = `
        <div class="text-center">
            <h4 class="text-primary">${result.score} / ${result.max_score}</h4>
            <h5 class="text-muted">${percentage}%</h5>
            <p class="mb-0"><strong>Completed:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
    `;
    
    // Hide quiz taking screen and show completed screen
    document.getElementById('quizTakingScreen').style.display = 'none';
    document.getElementById('quizCompletedScreen').style.display = 'block';
}

/**
 * Show Error
 */
function showError(message) {
    let icon = 'error';
    let title = 'Error Loading Quiz';
    
    // Check for specific error types and customize the display
    if (message.includes('not yet open')) {
        icon = 'info';
        title = 'Quiz Not Available Yet';
    } else if (message.includes('has closed')) {
        icon = 'warning';
        title = 'Quiz Has Closed';
    } else if (message.includes('no questions')) {
        icon = 'info';
        title = 'Quiz Not Ready';
    } else if (message.includes('already used all your attempts')) {
        icon = 'warning';
        title = 'No More Attempts';
    }
    
    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        confirmButtonText: 'Go Back to Quizzes',
        footer: icon === 'error' ? 'Contact your teacher if the problem persists.' : null
    }).then(() => {
        goBackToQuizzes();
    });
}

/**
 * Go Back to Quizzes
 */
function goBackToQuizzes() {
    // If quiz is in progress, warn user
    if (isQuizStarted && !document.getElementById('quizCompletedScreen').style.display === 'block') {
        Swal.fire({
            title: 'Leave Quiz?',
            text: 'Are you sure you want to leave? Your progress will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, leave',
            cancelButtonText: 'Stay'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'my-quizzes.php';
            }
        });
    } else {
        window.location.href = 'my-quizzes.php';
    }
}

// Prevent page refresh/close during quiz
window.addEventListener('beforeunload', function(e) {
    if (isQuizStarted && document.getElementById('quizCompletedScreen').style.display !== 'block') {
        e.preventDefault();
        e.returnValue = '';
        return 'Are you sure you want to leave? Your quiz progress may be lost.';
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (isQuizStarted) {
        if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
            previousQuestion();
        } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
            nextQuestion();
        }
    }
});
