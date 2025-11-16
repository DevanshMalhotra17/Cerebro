// Storage management based on user authentication
let currentUser = null;
let isGuest = false;

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
        });
    });

    const canvas = document.getElementById('knowledgeGraph');
    if (canvas) {
        canvas.addEventListener('click', handleGraphClick);
    }
}

function checkAuth() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('cerebro_user');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isGuest = false;
        loadUserData();
        showApp();
    } else {
        // Show auth modal
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }
}

function showApp() {
    updateUserDisplay();
    updateDashboard();
    
    const canvas = document.getElementById('knowledgeGraph');
    if (canvas) {
        canvas.addEventListener('click', handleGraphClick);
    }
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    const logoutText = document.getElementById('logoutText');
    
    if (isGuest) {
        userDisplay.textContent = 'Guest Mode';
        logoutText.textContent = 'Clear Data';
    } else if (currentUser) {
        userDisplay.textContent = currentUser.name || currentUser.email;
        logoutText.textContent = 'Logout';
    }
}

function switchToSignup() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('signupForm').classList.remove('d-none');
}

function switchToLogin() {
    document.getElementById('signupForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
}

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorDiv = document.getElementById('signupError');

    errorDiv.classList.add('d-none');

    if (!name || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('d-none');
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.remove('d-none');
        return;
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('cerebro_users') || '[]');
    if (users.find(u => u.email === email)) {
        errorDiv.textContent = 'An account with this email already exists';
        errorDiv.classList.remove('d-none');
        return;
    }

    // Create new user
    const newUser = {
        id: 'user-' + Date.now(),
        name,
        email,
        password: btoa(password), // Simple encoding (not secure for production)
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('cerebro_users', JSON.stringify(users));

    // Log in the new user
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    isGuest = false;
    localStorage.setItem('cerebro_user', JSON.stringify(currentUser));

    // Close modal and show app
    bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
    showApp();
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('d-none');

    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.remove('d-none');
        return;
    }

    const users = JSON.parse(localStorage.getItem('cerebro_users') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));

    if (!user) {
        errorDiv.textContent = 'Invalid email or password';
        errorDiv.classList.remove('d-none');
        return;
    }

    // Log in the user
    currentUser = { id: user.id, name: user.name, email: user.email };
    isGuest = false;
    localStorage.setItem('cerebro_user', JSON.stringify(currentUser));

    // Close modal and show app
    bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
    loadUserData();
    showApp();
}

function continueAsGuest() {
    isGuest = true;
    currentUser = { id: 'guest', name: 'Guest' };
    
    // Clear any existing guest data
    sessionStorage.clear();
    
    // Close modal and show app
    bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
    showApp();
}

function handleLogout() {
    if (isGuest) {
        // Clear session storage
        sessionStorage.clear();
        location.reload();
    } else {
        // Save user data before logging out
        saveUserData();
        localStorage.removeItem('cerebro_user');
        location.reload();
    }
}

// Storage functions that respect user type
function getStorage() {
    return isGuest ? sessionStorage : localStorage;
}

function getStorageKey(key) {
    if (isGuest) {
        return key;
    }
    return currentUser ? `${currentUser.id}_${key}` : key;
}

function saveData(key, data) {
    const storage = getStorage();
    storage.setItem(getStorageKey(key), JSON.stringify(data));
}

function loadData(key, defaultValue = null) {
    const storage = getStorage();
    const data = storage.getItem(getStorageKey(key));
    return data ? JSON.parse(data) : defaultValue;
}

function loadUserData() {
    // This is called when a user logs in to load their saved data
    updateDashboard();
}

function saveUserData() {
    // Data is automatically saved through saveData function
}

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
    if (tabId === 'graph') {
        setTimeout(initializeGraph, 100);
    } else if (tabId === 'practice') {
        setTimeout(initializePractice, 100);
    }
}

function updateDashboard() {
    const concepts = loadData('concepts', []);
    const sessions = loadData('sessions', []);
    
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
        const response = await fetch('http://localhost:3000/api/extract-concepts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        let content;
        if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        } else if (data.content && data.content[0]) {
            content = data.content[0].text;
        } else if (data.message) {
            content = data.message;
        } else {
            throw new Error('Unexpected API response format');
        }
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not find JSON in AI response');
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
            throw new Error('Invalid concepts format in response');
        }
        
        const concepts = parsed.concepts.map((c, i) => ({
            id: 'concept-' + Date.now() + '-' + i,
            name: c.name,
            description: c.description
        }));

        displayExtractedConcepts(concepts);
    } catch (err) {
        console.error('Error:', err);
        errorDiv.textContent = 'Error: ' + err.message;
        errorDiv.classList.remove('d-none');
    } finally {
        parseBtn.disabled = false;
        loadingDiv.classList.add('d-none');
    }
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
            <div class="d-flex align-items-start gap-2">
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

    let concepts = loadData('concepts', []);
    concepts = concepts.concat(selectedConcepts);
    saveData('concepts', concepts);

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

// Knowledge Graph
let graphNodes = [];
let selectedNodeId = null;

function initializeGraph() {
    const concepts = loadData('concepts', []);
    
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

// Practice Mode
let currentCard = null;
let dueCards = [];
let isFlipped = false;

function initializePractice() {
    const concepts = loadData('concepts', []);
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

    let concepts = loadData('concepts', []);
    const index = concepts.findIndex(c => c.id === currentCard.id);
    if (index !== -1) {
        concepts[index] = updatedCard;
        saveData('concepts', concepts);
    }

    let sessions = loadData('sessions', []);
    sessions.push({
        conceptId: currentCard.id,
        performance: performance,
        timestamp: new Date().toISOString()
    });
    saveData('sessions', sessions);

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

// Quiz Generator
let quizQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let quizStats = { correct: 0, total: 0 };

function generateQuiz() {
    const concepts = loadData('concepts', []);
    
    if (concepts.length === 0) {
        alert('Please add some concepts first before generating a quiz!');
        return;
    }

    const quizLength = parseInt(document.getElementById('quizLength').value);
    const quizType = document.getElementById('quizType').value;

    if (concepts.length < quizLength) {
        alert(`You only have ${concepts.length} concepts. Please add more or choose fewer questions.`);
        return;
    }

    // Shuffle and select concepts
    const shuffled = [...concepts].sort(() => Math.random() - 0.5);
    const selectedConcepts = shuffled.slice(0, quizLength);

    quizQuestions = selectedConcepts.map(concept => {
        let type;
        if (quizType === 'mixed') {
            type = Math.random() > 0.5 ? 'multiple' : 'truefalse';
        } else if (quizType === 'multiple') {
            type = 'multiple';
        } else {
            type = 'truefalse';
        }

        if (type === 'multiple') {
            // Generate wrong answers from other concepts
            const wrongAnswers = shuffled
                .filter(c => c.id !== concept.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(c => c.description);

            const allAnswers = [concept.description, ...wrongAnswers].sort(() => Math.random() - 0.5);

            return {
                type: 'multiple',
                question: `What is "${concept.name}"?`,
                options: allAnswers,
                correct: concept.description,
                conceptId: concept.id
            };
        } else {
            // True/False question
            const isTrue = Math.random() > 0.5;
            let statement;
            
            if (isTrue) {
                statement = concept.description;
            } else {
                // Use description from another concept
                const wrongConcept = shuffled.find(c => c.id !== concept.id);
                statement = wrongConcept ? wrongConcept.description : concept.description;
            }

            return {
                type: 'truefalse',
                question: `"${concept.name}" is defined as: ${statement}`,
                options: ['True', 'False'],
                correct: isTrue ? 'True' : 'False',
                conceptId: concept.id
            };
        }
    });

    currentQuestionIndex = 0;
    quizStats = { correct: 0, total: quizLength };
    selectedAnswer = null;

    document.getElementById('quizSetup').classList.add('d-none');
    document.getElementById('quizActive').classList.remove('d-none');
    document.getElementById('totalQuestions').textContent = quizLength;

    loadQuizQuestion();
}

function loadQuizQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showQuizResults();
        return;
    }

    const question = quizQuestions[currentQuestionIndex];
    selectedAnswer = null;

    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('quizScore').textContent = quizStats.correct;
    document.getElementById('quizTotal').textContent = quizStats.total;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'btn btn-outline-primary text-start';
        optionBtn.textContent = option;
        optionBtn.onclick = () => selectAnswer(option, optionBtn);
        optionsContainer.appendChild(optionBtn);
    });

    document.getElementById('quizFeedback').classList.add('d-none');
    document.getElementById('submitAnswer').classList.remove('d-none');
    document.getElementById('nextQuestion').classList.add('d-none');
}

function selectAnswer(answer, buttonElement) {
    // Remove previous selection
    document.querySelectorAll('#quizOptions .btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });

    // Mark new selection
    buttonElement.classList.add('active');
    buttonElement.classList.remove('btn-outline-primary');
    buttonElement.classList.add('btn-primary');
    
    selectedAnswer = answer;
}

function submitAnswer() {
    if (!selectedAnswer) {
        alert('Please select an answer first!');
        return;
    }

    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;
    const feedbackDiv = document.getElementById('quizFeedback');

    if (isCorrect) {
        quizStats.correct++;
        feedbackDiv.className = 'alert alert-success';
        feedbackDiv.textContent = '✓ Correct! Well done!';
    } else {
        feedbackDiv.className = 'alert alert-danger';
        feedbackDiv.textContent = `✗ Incorrect. The correct answer is: ${question.correct}`;
    }

    feedbackDiv.classList.remove('d-none');
    document.getElementById('submitAnswer').classList.add('d-none');
    document.getElementById('nextQuestion').classList.remove('d-none');
    document.getElementById('quizScore').textContent = quizStats.correct;

    // Disable all option buttons
    document.querySelectorAll('#quizOptions .btn').forEach(btn => btn.disabled = true);
}

function nextQuestion() {
    currentQuestionIndex++;
    
    // Re-enable buttons
    document.querySelectorAll('#quizOptions .btn').forEach(btn => btn.disabled = false);
    
    loadQuizQuestion();
}

function showQuizResults() {
    const percentage = Math.round((quizStats.correct / quizStats.total) * 100);
    
    document.getElementById('quizActive').classList.add('d-none');
    document.getElementById('quizResults').classList.remove('d-none');
    
    document.getElementById('finalScore').textContent = percentage + '%';
    document.getElementById('correctAnswers').textContent = quizStats.correct;
    document.getElementById('wrongAnswers').textContent = quizStats.total - quizStats.correct;
}

function resetQuiz() {
    document.getElementById('quizResults').classList.add('d-none');
    document.getElementById('quizSetup').classList.remove('d-none');
    quizQuestions = [];
    currentQuestionIndex = 0;
    selectedAnswer = null;
    quizStats = { correct: 0, total: 0 };
}