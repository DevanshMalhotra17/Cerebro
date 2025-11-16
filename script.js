// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
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

    updateDashboard();
    initializeSortingBars();
    
    const canvas = document.getElementById('knowledgeGraph');
    if (canvas) {
        canvas.addEventListener('click', handleGraphClick);
    }
});

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
    if (tabId === 'graph') {
        setTimeout(initializeGraph, 100);
    } else if (tabId === 'practice') {
        setTimeout(initializePractice, 100);
    }
}

function updateDashboard() {
    const concepts = JSON.parse(localStorage.getItem('concepts') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    
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
        console.log('API Response:', data);
        
        let content;
        if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        } else if (data.content && data.content[0]) {
            content = data.content[0].text;
        } else if (data.message) {
            content = data.message;
        } else {
            console.error('Unexpected response format:', data);
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

        let concepts = JSON.parse(localStorage.getItem('concepts') || '[]');
        concepts = concepts.concat(selectedConcepts);
        localStorage.setItem('concepts', JSON.stringify(concepts));

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
        let graphNodes = [];
        let selectedNodeId = null;
        function initializeGraph() {
        const concepts = JSON.parse(localStorage.getItem('concepts') || '[]');
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
        let currentCard = null;
        let dueCards = [];
        let isFlipped = false;
        function initializePractice() {
        const concepts = JSON.parse(localStorage.getItem('concepts') || '[]');
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

        let concepts = JSON.parse(localStorage.getItem('concepts') || '[]');
        const index = concepts.findIndex(c => c.id === currentCard.id);
        if (index !== -1) {
            concepts[index] = updatedCard;
            localStorage.setItem('concepts', JSON.stringify(concepts));
        }

        let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push({
            conceptId: currentCard.id,
            performance: performance,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('sessions', JSON.stringify(sessions));

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
        let sortArray = [64, 34, 25, 12, 22, 11, 90];
        let sorting = false;
        function initializeSortingBars() {
        const container = document.getElementById('sortingBars');
        container.innerHTML = '';
        sortArray.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'sorting-bar';
            bar.style.height = value * 3 + 'px';
            bar.setAttribute('data-value', value);
            bar.setAttribute('data-index', index);
            
            const label = document.createElement('div');
            label.className = 'sorting-bar-label';
            label.textContent = value;
            
            bar.appendChild(label);
            container.appendChild(bar);
        });
        }
        async function startBubbleSort() {
        if (sorting) return;
        sorting = true;
        document.getElementById('sortBtn').disabled = true;

        const n = sortArray.length;
        const bars = document.querySelectorAll('.sorting-bar');

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                bars[j].classList.add('comparing');
                bars[j + 1].classList.add('comparing');
                
                await sleep(300);
                
                if (sortArray[j] > sortArray[j + 1]) {
                    [sortArray[j], sortArray[j + 1]] = [sortArray[j + 1], sortArray[j]];
                    
                    const tempHeight = bars[j].style.height;
                    const tempValue = bars[j].getAttribute('data-value');
                    const tempLabel = bars[j].querySelector('.sorting-bar-label').textContent;
                    
                    bars[j].style.height = bars[j + 1].style.height;
                    bars[j].setAttribute('data-value', bars[j + 1].getAttribute('data-value'));
                    bars[j].querySelector('.sorting-bar-label').textContent = bars[j + 1].querySelector('.sorting-bar-label').textContent;
                    
                    bars[j + 1].style.height = tempHeight;
                    bars[j + 1].setAttribute('data-value', tempValue);
                    bars[j + 1].querySelector('.sorting-bar-label').textContent = tempLabel;
                }
                
                bars[j].classList.remove('comparing');
                bars[j + 1].classList.remove('comparing');
            }
            bars[n - 1 - i].classList.add('sorted');
        }
        bars[0].classList.add('sorted');

        sorting = false;
        document.getElementById('sortBtn').disabled = false;
        }
        function resetSort() {
        sortArray = [64, 34, 25, 12, 22, 11, 90];
        sorting = false;
        document.getElementById('sortBtn').disabled = false;
        initializeSortingBars();
        }
        function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
        }