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

            if (tabId === 'chatbot') {
                setTimeout(initializeChatbot, 100);
            } else if (tabId === 'practice') {
                setTimeout(initializePractice, 100);
            } else if (tabId === 'quiz') {
                setTimeout(initializeQuiz, 100);
            } else if (tabId === 'settings') {
                setTimeout(loadSettings, 100);
            } else if (tabId === 'planner') {
                setTimeout(initializePlanner, 100);
            }
        });
    });
}

let authModalInstance = null;

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isGuest = false;
        hideAuthModal();
        showUserInfo();
        loadUserData();
        updateDashboard();
        loadSettings();
    } else {
        showAuthModal();
    }
}

function loadSettings() {
    const settings = localStorage.getItem('appSettings');
    if (settings) {
        const parsed = JSON.parse(settings);
        if (document.getElementById('educationLevel')) {
            document.getElementById('educationLevel').value = parsed.educationLevel || 'high';
        }
        return parsed;
    }
    return { educationLevel: 'high' };
}

function saveSettings() {
    const educationLevel = document.getElementById('educationLevel').value;
    localStorage.setItem('appSettings', JSON.stringify({ educationLevel }));
    
    const alert = document.getElementById('settingsSaved');
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 2000);
}

function getEducationLevel() {
    const settings = loadSettings();
    return settings.educationLevel || 'high';
}

function showAuthModal() {
    if (!authModalInstance) {
        authModalInstance = new bootstrap.Modal(document.getElementById('authModal'));
    }
    authModalInstance.show();
}

function hideAuthModal() {
    if (authModalInstance) {
        authModalInstance.hide();
    }
}

function showUserInfo() {
    document.getElementById('userDisplay').textContent = isGuest ? 'Guest' : currentUser.name;
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

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields', 'signup');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters', 'signup');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showAuthError('Email already registered', 'signup');
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

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields', 'login');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showAuthError('Invalid email or password', 'login');
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

function handleLogout() {
    if (isGuest) {
        sessionData = { concepts: [], sessions: [], users: [] };
    }
    
    currentUser = null;
    isGuest = false;
    localStorage.removeItem('currentUser');
    
    document.getElementById('userDisplay').textContent = 'Guest';
    showAuthModal();
    switchToLogin();
    updateDashboard();
}

function showAuthError(message, formType) {
    const errorDiv = document.getElementById(formType + 'Error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    setTimeout(() => errorDiv.classList.add('d-none'), 3000);
}

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

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
}

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
    
    const practiceAccuracy = sessions.length > 0
        ? Math.round((sessions.filter(s => s.performance >= 4).length / sessions.length) * 100)
        : 0;
    document.getElementById('practiceAccuracy').textContent = practiceAccuracy + '%';
    
    const weeklyGoal = Math.min(studySessions, 50);
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
            throw new Error('API request failed');
        }

        const data = await response.json();
        let content;
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        } else if (data.content && data.content[0]) {
            content = data.content[0].text;
        } else {
            throw new Error('Unexpected API response format');
        }
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not parse AI response');
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
            throw new Error('Invalid concepts format');
        }
        
        const concepts = parsed.concepts.map((c, i) => ({
            id: 'concept-' + Date.now() + '-' + i,
            name: c.name,
            description: c.description
        }));

        displayExtractedConcepts(concepts);
        
    } catch (apiError) {
        console.warn('API failed, using local extraction:', apiError);
        const concepts = extractConceptsLocally(text);
        displayExtractedConcepts(concepts);
    } finally {
        parseBtn.disabled = false;
        loadingDiv.classList.add('d-none');
    }
}

function extractConceptsLocally(text) {
    const items = text.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 0);
    const concepts = [];
    
    items.forEach((item, i) => {
        concepts.push({
            id: 'concept-' + Date.now() + '-' + i,
            name: item,
            description: `A key concept in ${item} that requires further study and understanding.`
        });
    });
    
    return concepts.length > 0 ? concepts : [{
        id: 'concept-' + Date.now(),
        name: text.substring(0, 50),
        description: 'A concept extracted from your study material.'
    }];
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

async function saveConcepts() {
    const checkboxes = document.querySelectorAll('#conceptsList input[type="checkbox"]:checked');
    const selectedConcepts = [];
    
    checkboxes.forEach(checkbox => {
        const conceptId = checkbox.getAttribute('data-concept-id');
        const concept = extractedConceptsData.find(c => c.id === conceptId);
        if (concept) {
            selectedConcepts.push(concept);
        }
    });

    if (selectedConcepts.length === 0) {
        alert('Please select at least one concept!');
        return;
    }

    // Show loading
    const parseBtn = document.getElementById('parseBtn');
    const loadingDiv = document.getElementById('parseLoading');
    parseBtn.disabled = true;
    loadingDiv.classList.remove('d-none');
    
    const allFlashcards = [];
    const educationLevel = getEducationLevel();
    
    // Generate AI flashcards for each concept
    for (const concept of selectedConcepts) {
        try {
            const response = await fetch('http://localhost:3000/api/generate-flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept: concept.name, educationLevel })
            });
            
            if (!response.ok) throw new Error('API failed');
            
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
                    parsed.flashcards.forEach((card, i) => {
                        allFlashcards.push({
                            id: `flashcard-${Date.now()}-${Math.random()}-${i}`,
                            name: card.front,
                            description: card.back,
                            mastery: 0,
                            lastReviewed: null,
                            nextReview: new Date().toISOString(),
                            reviews: 0,
                            easiness: 2.5,
                            interval: 0
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Failed to generate flashcards for', concept.name, error);
            // Fallback: add the concept itself as a flashcard
            allFlashcards.push({
                id: 'concept-' + Date.now() + '-' + Math.random(),
                name: concept.name,
                description: concept.description,
                mastery: 0,
                lastReviewed: null,
                nextReview: new Date().toISOString(),
                reviews: 0,
                easiness: 2.5,
                interval: 0
            });
        }
    }
    
    if (allFlashcards.length > 0) {
        let concepts = getConcepts();
        concepts = concepts.concat(allFlashcards);
        setConcepts(concepts);
        
        alert(`Generated ${allFlashcards.length} AI flashcards! Go to Practice tab to review them.`);
        clearUpload();
        updateDashboard();
        switchTab('practice');
    } else {
        alert('Failed to generate flashcards. Using basic concepts instead.');
        // Fallback to saving basic concepts
        const basicConcepts = selectedConcepts.map(c => ({
            ...c,
            mastery: 0,
            lastReviewed: null,
            nextReview: new Date().toISOString(),
            reviews: 0,
            easiness: 2.5,
            interval: 0
        }));
        
        let concepts = getConcepts();
        concepts = concepts.concat(basicConcepts);
        setConcepts(concepts);
        
        alert(`Saved ${basicConcepts.length} concepts!`);
        clearUpload();
        updateDashboard();
        switchTab('dashboard');
    }
    
    parseBtn.disabled = false;
    loadingDiv.classList.add('d-none');
}

function clearUpload() {
    document.getElementById('documentText').value = '';
    document.getElementById('extractedConcepts').classList.add('d-none');
    document.getElementById('parseError').classList.add('d-none');
    extractedConceptsData = [];
}

async function generateFlashcards() {
    const checkboxes = document.querySelectorAll('#conceptsList input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one concept first!');
        return;
    }
    
    const parseBtn = document.getElementById('parseBtn');
    const loadingDiv = document.getElementById('parseLoading');
    
    parseBtn.disabled = true;
    loadingDiv.classList.remove('d-none');
    
    const allFlashcards = [];
    const educationLevel = getEducationLevel();
    
    for (const checkbox of checkboxes) {
        const conceptId = checkbox.getAttribute('data-concept-id');
        const concept = extractedConceptsData.find(c => c.id === conceptId);
        
        if (concept) {
            try {
                const response = await fetch('http://localhost:3000/api/generate-flashcards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ concept: concept.name, educationLevel })
                });
                
                if (!response.ok) throw new Error('API failed');
                
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.flashcards) {
                        parsed.flashcards.forEach((card, i) => {
                            allFlashcards.push({
                                id: `flashcard-${Date.now()}-${i}`,
                                name: card.front,
                                description: card.back,
                                mastery: 0,
                                lastReviewed: null,
                                nextReview: new Date().toISOString(),
                                reviews: 0,
                                easiness: 2.5,
                                interval: 0
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to generate flashcards for', concept.name, error);
            }
        }
    }
    
    if (allFlashcards.length > 0) {
        let concepts = getConcepts();
        concepts = concepts.concat(allFlashcards);
        setConcepts(concepts);
        
        alert(`Generated ${allFlashcards.length} AI flashcards!`);
        clearUpload();
        updateDashboard();
        switchTab('practice');
    } else {
        alert('Failed to generate flashcards. Please make sure the server is running.');
    }
    
    parseBtn.disabled = false;
    loadingDiv.classList.add('d-none');
}

let chatHistory = [];

function initializeChatbot() {
    const concepts = getConcepts();
    if (concepts.length === 0) {
        document.getElementById('chatbotEmpty').classList.remove('d-none');
        document.getElementById('chatbotActive').classList.add('d-none');
    } else {
        document.getElementById('chatbotEmpty').classList.add('d-none');
        document.getElementById('chatbotActive').classList.remove('d-none');
        
        if (chatHistory.length === 0) {
            addChatMessage('bot', `Hi! I'm your AI Study Buddy! 🤖 I can help you with:\n\n• Explaining your learned concepts\n• Answering questions about your study material\n• Providing study tips and techniques\n• Quiz you on specific topics\n\nWhat would you like to know?`);
        }
    }
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="d-flex gap-2 align-items-start">
                <div class="chat-avatar">🤖</div>
                <div class="flex-grow-1">
                    <div class="chat-bubble">${message}</div>
                    <div class="chat-time">${time}</div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="d-flex gap-2 align-items-start justify-content-end">
                <div class="flex-grow-1 text-end">
                    <div class="chat-bubble user-bubble">${message}</div>
                    <div class="chat-time">${time}</div>
                </div>
                <div class="chat-avatar user-avatar">👤</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    chatHistory.push({ sender, message, time });
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="d-flex gap-2 align-items-start">
            <div class="chat-avatar">🤖</div>
            <div class="chat-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
    document.getElementById('chatMessages').appendChild(typingDiv);
    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    
    try {
        const concepts = getConcepts();
        const conceptContext = concepts.map(c => `${c.name}: ${c.description}`).join('\n');
        const educationLevel = getEducationLevel();
        
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message,
                concepts: conceptContext,
                educationLevel
            })
        });        
        if (!response.ok) {
            throw new Error('Chat API failed');
        }
        
        const data = await response.json();
        let botResponse;
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            botResponse = data.choices[0].message.content;
        } else if (data.content && data.content[0]) {
            botResponse = data.content[0].text;
        } else {
            throw new Error('Unexpected response format');
        }
        
        document.getElementById('typingIndicator').remove();
        
        addChatMessage('bot', botResponse);
        
    } catch (error) {
        console.error('Chat error:', error);
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.remove();
        
        const fallbackResponse = generateFallbackResponse(message);
        addChatMessage('bot', fallbackResponse);
    }
}

function generateFallbackResponse(message) {
    const concepts = getConcepts();
    const lowerMessage = message.toLowerCase();
    
    for (let concept of concepts) {
        if (lowerMessage.includes(concept.name.toLowerCase())) {
            return `Based on your notes, ${concept.name} is: ${concept.description}\n\nWould you like me to quiz you on this concept or explain it further?`;
        }
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `I can help you with:\n\n• Explaining concepts from your study materials\n• Answering questions about topics you've learned\n• Providing study strategies\n• Creating practice questions\n\nYou currently have ${concepts.length} concept(s) in your knowledge base. Ask me about any of them!`;
    }
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
        return `I'd love to quiz you! You can go to the Quiz Generator tab for a full quiz, or ask me specific questions about your concepts. What topic would you like to focus on?`;
    }
    
    if (lowerMessage.includes('study tip') || lowerMessage.includes('how to study')) {
        return `Here are some proven study techniques:\n\n1. **Spaced Repetition**: Review material at increasing intervals (which you're doing with the Practice tab!)\n2. **Active Recall**: Test yourself instead of just re-reading\n3. **Feynman Technique**: Explain concepts in simple terms\n4. **Pomodoro Method**: Study in 25-minute focused sessions\n5. **Interleaving**: Mix different topics instead of blocking\n\nWhich technique would you like to know more about?`;
    }
    
    if (concepts.length === 0) {
        return `You don't have any concepts in your knowledge base yet. Upload some study materials first, and then I can help you learn them!`;
    }
    
    return `I understand you're asking about: "${message}"\n\nBased on your ${concepts.length} learned concept(s), I can help you understand them better. Try asking me:\n\n• "Explain [concept name]"\n• "What is [concept name]?"\n• "Give me study tips"\n• "Quiz me on [topic]"\n\nWhat would you like to know?`;
}

function clearChat() {
    chatHistory = [];
    document.getElementById('chatMessages').innerHTML = '';
    initializeChatbot();
}

document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

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

let quizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let selectedAnswer = null;

function initializeQuiz() {
    const concepts = getConcepts();
    
    if (concepts.length === 0) {
        document.getElementById('quizEmpty').classList.remove('d-none');
        document.getElementById('quizSetup').classList.add('d-none');
        document.getElementById('quizActive').classList.add('d-none');
        document.getElementById('quizResults').classList.add('d-none');
    } else {
        document.getElementById('quizEmpty').classList.add('d-none');
        document.getElementById('quizSetup').classList.remove('d-none');
        document.getElementById('quizActive').classList.add('d-none');
        document.getElementById('quizResults').classList.add('d-none');
    }
}

function generateQuiz() {
    const concepts = getConcepts();
    const quizLength = parseInt(document.getElementById('quizLength').value);
    
    if (concepts.length === 0) {
        alert('No concepts available. Please add some study materials first!');
        return;
    }
    
    if (concepts.length < 4) {
        alert('You need at least 4 flashcards to generate a quiz!');
        return;
    }
    
    quizScore = 0;
    currentQuestionIndex = 0;
    selectedAnswer = null;
    
    // Generate quiz from existing flashcards
    const shuffled = [...concepts].sort(() => 0.5 - Math.random());
    const numQuestions = Math.min(quizLength, concepts.length);
    
    quizQuestions = shuffled.slice(0, numQuestions).map(concept => {
        // Get 3 random wrong answers from other flashcards
        const wrongOptions = concepts
            .filter(c => c.id !== concept.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(c => c.description);
        
        // Combine correct and wrong answers, then shuffle
        const allOptions = [concept.description, ...wrongOptions]
            .sort(() => 0.5 - Math.random());
        
        return {
            question: concept.name, // The flashcard front (question/term)
            correctAnswer: concept.description, // The flashcard back (answer)
            options: allOptions
        };
    });
    
    document.getElementById('quizSetup').classList.add('d-none');
    document.getElementById('quizActive').innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h5 class="mb-0">Question <span id="currentQuestion">1</span> of <span id="totalQuestions">${quizQuestions.length}</span></h5>
            </div>
            <div class="text-muted">
                Score: <span id="quizScore" class="fw-bold text-primary">0</span>/<span id="quizTotal">${quizQuestions.length}</span>
            </div>
        </div>

        <div id="quizQuestion" class="mb-4">
            <h4 class="mb-4" id="questionText">Question text goes here?</h4>
            <div id="quizOptions" class="d-flex flex-column gap-2"></div>
        </div>

        <div id="quizFeedback" class="alert d-none mb-3"></div>

        <div class="d-flex gap-2">
            <button id="submitAnswer" class="btn btn-primary" onclick="submitAnswer()">Submit Answer</button>
            <button id="nextQuestion" class="btn btn-success d-none" onclick="nextQuestion()">Next Question</button>
        </div>
    `;
    
    document.getElementById('quizActive').classList.remove('d-none');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showQuizResults();
        return;
    }
    
    const question = quizQuestions[currentQuestionIndex];
    selectedAnswer = null;
    
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quizQuestions.length;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('quizScore').textContent = quizScore;
    document.getElementById('quizTotal').textContent = quizQuestions.length;
    
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
    document.getElementById('submitAnswer').classList.remove('d-none');
    document.getElementById('nextQuestion').classList.add('d-none');
}

function selectAnswer(answer, element) {
    if (selectedAnswer !== null) return;
    
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.borderColor = '#e5e7eb';
        opt.style.background = '';
    });
    
    element.style.borderColor = '#3b82f6';
    element.style.background = '#eff6ff';
    
    selectedAnswer = answer;
}

function submitAnswer() {
    if (selectedAnswer === null) {
        alert('Please select an answer first!');
        return;
    }
    
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    if (isCorrect) {
        quizScore++;
        showFeedback('Correct! Well done! 🎉', 'success');
    } else {
        showFeedback(`Incorrect. The correct answer was: "${question.correctAnswer}"`, 'danger');
    }
    
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        const optionText = opt.textContent.substring(3);
        if (optionText === question.correctAnswer) {
            opt.classList.add('correct');
        } else if (optionText === selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
        opt.onclick = null;
    });
    
    document.getElementById('quizScore').textContent = quizScore;
    document.getElementById('submitAnswer').classList.add('d-none');
    document.getElementById('nextQuestion').classList.remove('d-none');
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

function showQuizResults() {
    document.getElementById('quizActive').classList.add('d-none');
    document.getElementById('quizResults').classList.remove('d-none');
    
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    
    document.getElementById('finalScore').textContent = percentage + '%';
    document.getElementById('correctAnswers').textContent = quizScore;
    document.getElementById('wrongAnswers').textContent = quizQuestions.length - quizScore;
    
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
    
    const emojiEl = document.getElementById('resultsEmoji');
    const messageEl = document.getElementById('resultsMessage');
    if (emojiEl) emojiEl.textContent = emoji;
    if (messageEl) messageEl.textContent = message;
}

function resetQuiz() {
    initializeQuiz();
}

function initializePlanner() {
    loadTasks();
}

function loadTasks() {
    const tasks = getTasks();
    
    if (tasks.length === 0) {
        document.getElementById('plannerEmpty').classList.remove('d-none');
        document.getElementById('plannerTasks').classList.add('d-none');
        return;
    }
    
    document.getElementById('plannerEmpty').classList.add('d-none');
    document.getElementById('plannerTasks').classList.remove('d-none');
    
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';
    
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).forEach(task => {
        const dueDate = new Date(task.dueDate).toLocaleDateString();
        const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
        
        const taskCard = document.createElement('div');
        taskCard.className = 'col-md-6 col-lg-4';
        taskCard.innerHTML = `
            <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0">${task.name}</h6>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task.id}')">×</button>
                </div>
                <p class="text-muted small mb-2">${task.subject}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}">${task.priority}</span>
                    <span class="small ${isOverdue ? 'text-danger fw-bold' : 'text-muted'}">${dueDate}</span>
                </div>
                <div class="form-check mt-2">
                    <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" id="task-${task.id}">
                    <label class="form-check-label small" for="task-${task.id}">
                        Mark as complete
                    </label>
                </div>
            </div>
        `;
        tasksList.appendChild(taskCard);
    });
}

function getTasks() {
    if (isGuest) {
        if (!sessionData.tasks) sessionData.tasks = [];
        return sessionData.tasks;
    }
    if (!currentUser) return [];
    
    const userKey = `tasks_${currentUser.id}`;
    return JSON.parse(localStorage.getItem(userKey) || '[]');
}

function saveTasks(tasks) {
    if (isGuest) {
        sessionData.tasks = tasks;
        return;
    }
    if (!currentUser) return;
    
    const userKey = `tasks_${currentUser.id}`;
    localStorage.setItem(userKey, JSON.stringify(tasks));
}

function showAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'flex';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').value = today;
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
    document.getElementById('taskName').value = '';
    document.getElementById('taskSubject').value = '';
    document.getElementById('taskPriority').value = 'medium';
}

function addTask() {
    const name = document.getElementById('taskName').value.trim();
    const subject = document.getElementById('taskSubject').value.trim();
    const dueDate = document.getElementById('taskDate').value;
    const priority = document.getElementById('taskPriority').value;
    
    if (!name || !subject || !dueDate) {
        alert('Please fill in all fields');
        return;
    }
    
    const tasks = getTasks();
    tasks.push({
        id: 'task-' + Date.now(),
        name,
        subject,
        dueDate,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    saveTasks(tasks);
    closeAddTaskModal();
    loadTasks();
}

function toggleTask(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        loadTasks();
    }
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const tasks = getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    saveTasks(filtered);
    loadTasks();
}