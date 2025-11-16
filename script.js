// Auth state
let currentUser = null;
let isGuest = false;

// Session data (used for guest mode)
let sessionData = {
    concepts: [],
    sessions: [],
    users: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'graph') {
                setTimeout(initializeGraph, 100);
            } else if (tabId === 'practice') {
                setTimeout(initializePractice, 100);
            } else if (tabId === 'quiz') {
                setTimeout(initializeQuiz, 100);
            }
        });
    });

    const canvas = document.getElementById('knowledgeGraph');
    if (canvas) {
        canvas.addEventListener('click', handleGraphClick);
    }
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isGuest = false;
        hideAuthModal();
        showUserInfo();
        loadUserData();
        updateDashboard();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showUserInfo() {
    document.getElementById('userInfo').classList.remove('d-none');
    document.getElementById('userName').textContent = isGuest ? 'Guest' : currentUser.name;
}

function showSignUp() {
    document.getElementById('signInForm').classList.add('d-none');
    document.getElementById('signUpForm').classList.remove('d-none');
    document.getElementById('authTitle').textContent = 'Create Account';
}

function showSignIn() {
    document.getElementById('signUpForm').classList.add('d-none');
    document.getElementById('signInForm').classList.remove('d-none');
    document.getElementById('authTitle').textContent = 'Welcome to Cerebro';
}

function signUp() {
    const name = document.getElementById('signUpName').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showAuthError('Email already registered');
        return;
    }

    const user = {
        id: 'user-' + Date.now(),
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    isGuest = false;

    hideAuthModal();
    showUserInfo();
    updateDashboard();
}

function signIn() {
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showAuthError('Invalid email or password');
        return;
    }

    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    isGuest = false;

    hideAuthModal();
    showUserInfo();
    loadUserData();
    updateDashboard();
}

function continueAsGuest() {
    isGuest = true;
    currentUser = null;
    sessionData = { concepts: [], sessions: [], users: [] };
    
    hideAuthModal();
    showUserInfo();
    updateDashboard();
}

function signOut() {
    if (isGuest) {
        sessionData = { concepts: [], sessions: [], users: [] };
    }
    
    currentUser = null;
    isGuest = false;
    localStorage.removeItem('currentUser');
    
    document.getElementById('userInfo').classList.add('d-none');
    showAuthModal();
    showSignIn();
    updateDashboard();
}

function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    setTimeout(() => errorDiv.classList.add('d-none'), 3000);
}

// =============================================================================
// DATA MANAGEMENT FUNCTIONS
// =============================================================================

function loadUserData() {
    if (isGuest || !currentUser) return;
    
    const userKey = `userData_${currentUser.id}`;
    const userData = localStorage.getItem(userKey);
    
    if (userData) {
        const parsed = JSON.parse(userData);
        sessionData.concepts = parsed.concepts || [];
        sessionData.sessions = parsed.sessions || [];
    }
}

function saveUserData() {
    if (isGuest || !currentUser) return;
    
    const userKey = `userData_${currentUser.id}`;
    localStorage.setItem(userKey, JSON.stringify({
        concepts: sessionData.concepts,
        sessions: sessionData.sessions
    }));
}

function getConcepts() {
    return sessionData.concepts;
}

function setConcepts(concepts) {
    sessionData.concepts = concepts;
    saveUserData();
}

function getSessions() {
    return sessionData.sessions;
}

function addSession(session) {
    sessionData.sessions.push(session);
    saveUserData();
}

// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
}

// =============================================================================
// DASHBOARD FUNCTIONS
// =============================================================================

function updateDashboard() {
    const concepts = getConcepts();
    const sessions = getSessions();
    
    const totalConcepts = concepts.length;
    const studySessions = sessions.length;
    const learningStreak = Math.floor(studySessions / 5);
    
    const avgMastery = totalConcepts > 0 
        ? Math.round(concepts.reduce((sum, c) => sum + c.mastery, 0) / totalConcepts)
        : 0;
    
    const totalReviews = concepts.reduce((sum, c) => sum + c.reviews, 0);
    const cardsDue = concepts.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date()).length;
    
    document.getElementById('totalConcepts').textContent = totalConcepts;
    document.getElementById('studySessions').textContent = studySessions;
    document.getElementById('learningStreak').textContent = learningStreak + ' days';
    document.getElementById('avgMastery').textContent = avgMastery + '%';
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('cardsDue').textContent = cardsDue;
    
    const conceptsMastered = concepts.filter(c => c.mastery >= 80).length;
    document.getElementById('conceptsMastered').textContent = conceptsMastered;
    
    const practiceAccuracy = studySessions.length > 0
        ? Math.round((sessions.filter(s => s.performance >= 4).length / studySessions.length) * 100)
        : 0;
    document.getElementById('practiceAccuracy').textContent = practiceAccuracy + '%';
    
    const weeklyGoal = studySessions.length % 50;
    document.getElementById('weeklyGoal').textContent = weeklyGoal + '/50';

    const masteryPercent = totalConcepts > 0 ? (conceptsMastered / totalConcepts) * 100 : 0;
    document.getElementById('masteryProgress').style.width = masteryPercent + '%';
    document.getElementById('accuracyProgress').style.width = practiceAccuracy + '%';
    document.getElementById('goalProgress').style.width = (weeklyGoal / 50 * 100) + '%';
    
    if (totalConcepts > 0) {
        document.getElementById('welcomeMessage').classList.add('d-none');
    } else {
        document.getElementById('welcomeMessage').classList.remove('d-none');
    }
}

// =============================================================================
// UPLOAD & PARSING FUNCTIONS
// =============================================================================

let extractedConceptsData = [];

async function parseDocument() {
    const text = document.getElementById('documentText').value.trim();
    const errorDiv = document.getElementById('parseError');
    const loadingDiv = document.getElementById('parseLoading');
    const parseBtn = document.getElementById('parseBtn');
    
    errorDiv.classList.add('d-none');
    
    if (!text) {
        errorDiv.textContent = 'Please enter some text to parse';
        errorDiv.classList.remove('d-none');
        return;
    }
    
    parseBtn.disabled = true;
    loadingDiv.classList.remove('d-none');
    
    try {
        // Simulated AI extraction for demo (replace with actual API call)
        const mockConcepts = extractConceptsLocally(text);
        displayExtractedConcepts(mockConcepts);
    } catch (err) {
        console.error('Error:', err);
        errorDiv.textContent = 'Error: ' + err.message;
        errorDiv.classList.remove('d-none');
    } finally {
        parseBtn.disabled = false;
        loadingDiv.classList.add('d-none');
    }
}

function extractConceptsLocally(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const concepts = [];
    
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
        const sentence = sentences[i].trim();
        const words = sentence.split(' ').filter(w => w.length > 3);
        const name = words.slice(0, 3).join(' ');
        
        concepts.push({
            id: 'concept-' + Date.now() + '-' + i,
            name: name || `Concept ${i + 1}`,
            description: sentence
        });
    }
    
    return concepts;
}

function displayExtractedConcepts(concepts) {
    extractedConceptsData = concepts;
    const conceptsList = document.getElementById('conceptsList');
    const extractedDiv = document.getElementById('extractedConcepts');
    conceptsList.innerHTML = '';

    concepts.forEach(concept => {
        const conceptCard = document.createElement('div');
        conceptCard.className = 'concept-item p-3 border rounded';
        conceptCard.innerHTML = `
            <div class="d-flex align-items-start gap-3">
                <input type="checkbox" class="form-check-input mt-1" checked data-concept-id="${concept.id}">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-1">${concept.name}</h6>
                    <p class="text-muted small mb-0">${concept.description}</p>
                </div>
            </div>
        `;
        conceptsList.appendChild(conceptCard);
    });

    extractedDiv.classList.remove('d-none');
}

function saveConcepts() {
    const checkboxes = document.querySelectorAll('#conceptsList input[type="checkbox"]:checked');
    const selectedConcepts = [];
    
    checkboxes.forEach(checkbox => {
        const conceptId = checkbox.getAttribute('data-concept-id');
        const concept = extractedConceptsData.find(c => c.id === conceptId);
        if (concept) {
            selectedConcepts.push({
                ...concept,
                mastery: 0,
                lastReviewed: null,
                nextReview: new Date().toISOString(),
                reviews: 0,
                easiness: 2.5,
                interval: 0
            });
        }
    });

    let concepts = getConcepts();
    concepts = concepts.concat(selectedConcepts);
    setConcepts(concepts);

    alert(`Saved ${selectedConcepts.length} concepts to your knowledge base!`);
    clearUpload();
    updateDashboard();
    switchTab('dashboard');
}

function clearUpload() {
    document.getElementById('documentText').value = '';
    document.getElementById('extractedConcepts').classList.add('d-none');
    document.getElementById('parseError').classList.add('d-none');
    extractedConceptsData = [];
}

// =============================================================================
// KNOWLEDGE GRAPH FUNCTIONS
// =============================================================================

let graphNodes = [];
let selectedNodeId = null;

function initializeGraph() {
    const concepts = getConcepts();
    if (concepts.length === 0) {
        document.getElementById('graphEmpty').classList.remove('d-none');
        document.getElementById('graphCanvas').classList.add('d-none');
        return;
    }

    document.getElementById('graphEmpty').classList.add('d-none');
    document.getElementById('graphCanvas').classList.remove('d-none');

    const canvas = document.getElementById('knowledgeGraph');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    graphNodes = concepts.map((concept, index) => {
        const angle = (index * 2 * Math.PI) / concepts.length;
        return {
            id: concept.id,
            name: concept.name,
            mastery: concept.mastery,
            reviews: concept.reviews,
            nextReview: concept.nextReview,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    });

    drawGraph();
}

function drawGraph() {
    const canvas = document.getElementById('knowledgeGraph');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    for (let i = 0; i < graphNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(graphNodes[i].x, graphNodes[i].y);
        ctx.lineTo(graphNodes[i + 1].x, graphNodes[i + 1].y);
        ctx.stroke();
    }
    if (graphNodes.length > 2) {
        ctx.beginPath();
        ctx.moveTo(graphNodes[graphNodes.length - 1].x, graphNodes[graphNodes.length - 1].y);
        ctx.lineTo(graphNodes[0].x, graphNodes[0].y);
        ctx.stroke();
    }

    graphNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
        
        if (node.mastery >= 80) {
            ctx.fillStyle = '#10b981';
        } else if (node.mastery >= 50) {
            ctx.fillStyle = '#f59e0b';
        } else {
            ctx.fillStyle = '#ef4444';
        }
        ctx.fill();
        
        if (selectedNodeId === node.id) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayName = node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name;
        ctx.fillText(displayName, node.x, node.y);
    });
}

function handleGraphClick(event) {
    const canvas = document.getElementById('knowledgeGraph');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedNode = graphNodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedNode) {
        selectedNodeId = clickedNode.id;
        showNodeDetails(clickedNode);
        drawGraph();
    } else {
        selectedNodeId = null;
        document.getElementById('nodeDetails').classList.add('d-none');
        drawGraph();
    }
}

function showNodeDetails(node) {
    document.getElementById('nodeTitle').textContent = node.name;
    document.getElementById('nodeMastery').textContent = node.mastery + '%';
    document.getElementById('nodeReviews').textContent = node.reviews;
    const nextReview = node.nextReview ? new Date(node.nextReview).toLocaleDateString() : 'Not scheduled';
    document.getElementById('nodeNextReview').textContent = nextReview;

    document.getElementById('nodeDetails').classList.remove('d-none');
}

function resetGraph() {
    selectedNodeId = null;
    document.getElementById('nodeDetails').classList.add('d-none');
    initializeGraph();
}

// =============================================================================
// PRACTICE (FLASHCARDS) FUNCTIONS
// =============================================================================

let currentCard = null;
let dueCards = [];
let isFlipped = false;

function initializePractice() {
    const concepts = getConcepts();
    dueCards = concepts.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date());
    document.getElementById('cardsRemaining').textContent = dueCards.length + ' card' + (dueCards.length !== 1 ? 's' : '') + ' due';

    if (dueCards.length === 0) {
        document.getElementById('practiceEmpty').classList.remove('d-none');
        document.getElementById('practiceCard').classList.add('d-none');
    } else {
        document.getElementById('practiceEmpty').classList.add('d-none');
        document.getElementById('practiceCard').classList.remove('d-none');
        loadNextCard();
    }
}

function loadNextCard() {
    if (dueCards.length === 0) {
        initializePractice();
        return;
    }
    
    currentCard = dueCards[0];
    isFlipped = false;

    document.getElementById('cardQuestion').textContent = currentCard.name;
    document.getElementById('cardTitle').textContent = currentCard.name;
    document.getElementById('cardAnswer').textContent = currentCard.description || 'No description available';

    document.getElementById('cardMasteryBar').style.width = currentCard.mastery + '%';
    document.getElementById('cardMasteryText').textContent = currentCard.mastery + '%';
    document.getElementById('cardReviewsText').textContent = currentCard.reviews;
    document.getElementById('cardIntervalText').textContent = currentCard.interval + ' days';

    document.getElementById('flashcardInner').classList.remove('flipped');
    document.getElementById('ratingButtons').classList.add('d-none');
}

function flipCard() {
    if (!currentCard) return;
    isFlipped = !isFlipped;
    document.getElementById('flashcardInner').classList.toggle('flipped');

    if (isFlipped) {
        document.getElementById('ratingButtons').classList.remove('d-none');
    } else {
        document.getElementById('ratingButtons').classList.add('d-none');
    }
}

function rateCard(performance) {
    if (!currentCard) return;
    
    const updatedCard = calculateNextReview(currentCard, performance);

    let concepts = getConcepts();
    const index = concepts.findIndex(c => c.id === currentCard.id);
    if (index !== -1) {
        concepts[index] = updatedCard;
        setConcepts(concepts);
    }

    addSession({
        conceptId: currentCard.id,
        performance: performance,
        timestamp: new Date().toISOString()
    });

    dueCards.shift();
    document.getElementById('cardsRemaining').textContent = dueCards.length + ' card' + (dueCards.length !== 1 ? 's' : '') + ' due';

    updateDashboard();
    loadNextCard();
}

function calculateNextReview(concept, performance) {
    let easiness = concept.easiness;
    let interval = concept.interval;
    let reviews = concept.reviews + 1;
    
    easiness = Math.max(1.3, easiness + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02)));

    if (performance < 3) {
        interval = 1;
        reviews = 0;
    } else {
        if (reviews === 1) {
            interval = 1;
        } else if (reviews === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easiness);
        }
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
        ...concept,
        easiness,
        interval,
        reviews,
        lastReviewed: new Date().toISOString(),
        nextReview: nextReview.toISOString(),
        mastery: Math.min(100, Math.max(0, concept.mastery + (performance - 2) * 10))
    };
}

// =============================================================================
// QUIZ FUNCTIONS
// =============================================================================

let quizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let selectedAnswer = null;

function initializeQuiz() {
    const concepts = getConcepts();
    
    if (concepts.length === 0) {
        document.getElementById('quizEmpty').classList.remove('d-none');
        document.getElementById('quizStart').classList.add('d-none');
        document.getElementById('quizActive').classList.add('d-none');
        document.getElementById('quizResults').classList.add('d-none');
    } else {
        document.getElementById('quizEmpty').classList.add('d-none');
        document.getElementById('quizStart').classList.remove('d-none');
        document.getElementById('quizActive').classList.add('d-none');
        document.getElementById('quizResults').classList.add('d-none');
    }
}

function startQuiz() {
    const concepts = getConcepts();
    quizScore = 0;
    currentQuestionIndex = 0;
    selectedAnswer = null;
    
    // Generate 5 random questions
    const shuffled = concepts.sort(() => 0.5 - Math.random());
    quizQuestions = shuffled.slice(0, Math.min(5, concepts.length)).map(concept => {
        const wrongAnswers = concepts
            .filter(c => c.id !== concept.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(c => c.description);
        
        const allAnswers = [concept.description, ...wrongAnswers]
            .sort(() => 0.5 - Math.random());
        
        return {
            question: concept.name,
            correctAnswer: concept.description,
            options: allAnswers
        };
    });
    
    document.getElementById('quizStart').classList.add('d-none');
    document.getElementById('quizActive').classList.remove('d-none');
    document.getElementById('quizResults').classList.add('d-none');
    document.getElementById('quizScore').classList.remove('d-none');
    
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showResults();
        return;
    }
    
    const question = quizQuestions[currentQuestionIndex];
    selectedAnswer = null;
    
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quizQuestions.length;
    document.getElementById('quizQuestion').textContent = question.question;
    document.getElementById('quizHint').textContent = 'Select the correct definition:';
    document.getElementById('quizScoreText').textContent = `${quizScore}/${quizQuestions.length}`;
    
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;
    document.getElementById('quizProgress').style.width = progress + '%';
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${option}`;
        optionDiv.onclick = () => selectAnswer(option, optionDiv);
        optionsContainer.appendChild(optionDiv);
    });
    
    document.getElementById('quizFeedback').classList.add('d-none');
    document.getElementById('quizNextBtn').classList.add('d-none');
}

function selectAnswer(answer, element) {
    if (selectedAnswer !== null) return; // Already answered
    
    selectedAnswer = answer;
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;
    
    if (isCorrect) {
        quizScore++;
        element.classList.add('correct');
        showFeedback('Correct! Well done! 🎉', 'success');
    } else {
        element.classList.add('incorrect');
        showFeedback(`Incorrect. The correct answer was: "${question.correctAnswer}"`, 'danger');
        
        // Highlight correct answer
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => {
            if (opt.textContent.includes(question.correctAnswer)) {
                opt.classList.add('correct');
            }
        });
    }
    
    document.getElementById('quizScoreText').textContent = `${quizScore}/${quizQuestions.length}`;
    document.getElementById('quizNextBtn').classList.remove('d-none');
}

function showFeedback(message, type) {
    const feedback = document.getElementById('quizFeedback');
    feedback.className = `alert alert-${type}`;
    feedback.textContent = message;
    feedback.classList.remove('d-none');
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function showResults() {
    document.getElementById('quizActive').classList.add('d-none');
    document.getElementById('quizResults').classList.remove('d-none');
    document.getElementById('quizScore').classList.add('d-none');
    
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    
    document.getElementById('finalScore').textContent = quizScore;
    document.getElementById('finalTotal').textContent = quizQuestions.length;
    document.getElementById('finalProgress').style.width = percentage + '%';
    
    let emoji = '🎉';
    let message = 'Great work!';
    
    if (percentage === 100) {
        emoji = '🏆';
        message = 'Perfect score! You\'re a master!';
    } else if (percentage >= 80) {
        emoji = '🌟';
        message = 'Excellent performance!';
    } else if (percentage >= 60) {
        emoji = '👍';
        message = 'Good job! Keep practicing!';
    } else {
        emoji = '📚';
        message = 'Keep studying and try again!';
    }
    
    document.getElementById('resultsEmoji').textContent = emoji;
    document.getElementById('resultsMessage').textContent = message;
}