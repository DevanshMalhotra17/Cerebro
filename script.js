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
});

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
}

function updateDashboard() {
    const stats = {
        totalConcepts: 0,
        studySessions: 0,
        learningStreak: 0,
        avgMastery: 0,
        totalReviews: 0,
        cardsDue: 0,
        conceptsMastered: 0,
        practiceAccuracy: 0,
        weeklyGoal: 0
    };

    document.getElementById('totalConcepts').textContent = stats.totalConcepts;
    document.getElementById('studySessions').textContent = stats.studySessions;
    document.getElementById('learningStreak').textContent = stats.learningStreak + ' days';
    document.getElementById('avgMastery').textContent = stats.avgMastery + '%';
    document.getElementById('totalReviews').textContent = stats.totalReviews;
    document.getElementById('cardsDue').textContent = stats.cardsDue;
    document.getElementById('conceptsMastered').textContent = stats.conceptsMastered;
    document.getElementById('practiceAccuracy').textContent = stats.practiceAccuracy + '%';
    document.getElementById('weeklyGoal').textContent = stats.weeklyGoal + '/50';

    document.getElementById('masteryProgress').style.width = '0%';
    document.getElementById('accuracyProgress').style.width = '0%';
    document.getElementById('goalProgress').style.width = '0%';
}