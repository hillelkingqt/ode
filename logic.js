document.addEventListener('DOMContentLoaded', () => {
    // --- Dark Mode Logic ---
    const toggleButton = document.getElementById('dark-mode-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const sunIconPath = 'assets/sun.svg'; // Make sure you have these icons
    const moonIconPath = 'assets/moon.svg';

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        body.classList.toggle('dark-mode', isDark);
        if (themeIcon) {
            themeIcon.src = isDark ? moonIconPath : sunIconPath;
        }
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode');
            const newTheme = isDark ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Quiz Logic (Only runs on quiz pages) ---
    const quizId = body.dataset.quizId;
    if (quizId && typeof quizData !== 'undefined') {
        const questionArea = document.getElementById('question-area');
        const resultsArea = document.getElementById('quiz-results');
        const progressDisplay = document.getElementById('quiz-progress-display');
        let state = loadState(quizId, quizData.length);
        
        renderCurrentQuestion();
        
        function renderCurrentQuestion() {
            if (state.completedQuestions === quizData.length) {
                showFinalResults();
                return;
            }
            
            updateProgress();
            const questionIndex = state.completedQuestions;
            const q = quizData[questionIndex];

            let optionsHTML = q.options.map((opt, index) => 
                `<li class="option" data-index="${index}">${opt.text}</li>`
            ).join('');

            questionArea.innerHTML = `
                <div class="question-block">
                    <div class="question-header">שאלה ${questionIndex + 1}</div>
                    <p class="question-text">${q.question}</p>
                    ${q.equation ? `\\[ ${q.equation} \\]` : ''}
                    <ul class="options-list">${optionsHTML}</ul>
                    <div class="explanation" style="display:none;">
                        <h4>הסבר:</h4>
                        <p>${q.explanation}</p>
                    </div>
                </div>`;
            
            renderMathInElement(questionArea);
            
            document.querySelectorAll('.option').forEach(opt => {
                opt.addEventListener('click', handleOptionClick);
            });
        }

        function handleOptionClick(event) {
            const selectedOption = event.currentTarget;
            const optionsList = selectedOption.parentElement;
            
            if (optionsList.classList.contains('answered')) return;
            optionsList.classList.add('answered');

            const questionIndex = state.completedQuestions;
            const selectedIndex = parseInt(selectedOption.dataset.index);
            const isCorrect = quizData[questionIndex].options[selectedIndex].correct;

            selectedOption.classList.add('selected');
            if (isCorrect) {
                selectedOption.classList.add('correct');
                state.score++;
            } else {
                selectedOption.classList.add('incorrect');
                const correctIndex = quizData[questionIndex].options.findIndex(o => o.correct);
                optionsList.querySelector(`[data-index="${correctIndex}"]`).classList.add('correct');
            }

            optionsList.nextElementSibling.style.display = 'block'; // Show explanation
            renderMathInElement(optionsList.nextElementSibling); // Re-render math in explanation

            state.completedQuestions++;
            saveState(quizId, state);

            // *** הוספת הקוד ליצירת הכפתור ***
            // הסרנו את ה-setTimeout
            
            // מצא את ה-div של השאלה הנוכחית
            const questionBlock = optionsList.closest('.question-block');

            // צור את הכפתור
            const nextButton = document.createElement('button');
            const isLastQuestion = state.completedQuestions === quizData.length;
            
            nextButton.textContent = isLastQuestion ? 'הצג תוצאות' : 'השאלה הבאה';
            // נשתמש במחלקה שכבר קיימת ומעוצבת ב-CSS
            nextButton.className = 'home-button'; 
            nextButton.style.marginTop = '20px'; // נוסיף קצת ריווח

            // הוסף פונקציונליות לכפתור
            nextButton.addEventListener('click', () => {
                renderCurrentQuestion();
            });

            // הוסף את הכפתור לדף
            questionBlock.appendChild(nextButton);
        }

        function showFinalResults() {
            questionArea.style.display = 'none';
            const finalScore = Math.round((state.score / quizData.length) * 100);
            resultsArea.innerHTML = `
                <h2>המבחן הושלם!</h2>
                <p>הציון הסופי שלך: ${finalScore}</p>
                <a href="index.html" class="home-button">חזרה לתפריט הראשי</a>
            `;
            resultsArea.style.display = 'block';
            updateProgress();
        }

        function updateProgress() {
            if (!progressDisplay) return;
            const total = quizData.length;
            const completed = state.completedQuestions;
            if (completed === total && state.score > -1) {
                 const finalScore = Math.round((state.score / total) * 100);
                 progressDisplay.textContent = `הושלם! | ציון: ${finalScore}`;
            } else {
                progressDisplay.textContent = `שאלה ${completed + 1} מתוך ${total} | ציון: ${state.score}/${completed}`;
            }
        }
    }
});

// --- Dashboard Logic (for index.html) ---
function updateDashboard() {
    document.querySelectorAll('.quiz-card').forEach(card => {
        const quizId = card.dataset.quizId;
        const state = loadState(quizId, 0);
        
        const progressBar = card.querySelector('.progress-bar');
        const scoreDisplay = card.querySelector('.score');
        const statusBadge = card.querySelector('.status-badge');
        
        if (state.totalQuestions > 0) {
            const progress = (state.completedQuestions / state.totalQuestions) * 100;
            progressBar.style.width = `${progress}%`;
            
            if (progress === 100) {
                statusBadge.textContent = 'הושלם';
                statusBadge.className = 'status-badge completed';
                const finalScore = Math.round((state.score / state.totalQuestions) * 100);
                scoreDisplay.textContent = `ציון: ${finalScore}`;
            } else if (progress > 0) {
                statusBadge.textContent = 'בתהליך';
                statusBadge.className = 'status-badge in-progress';
                scoreDisplay.textContent = `${state.completedQuestions}/${state.totalQuestions} שאלות`;
            } else {
                statusBadge.textContent = 'לא התחיל';
                statusBadge.className = 'status-badge not-started';
                scoreDisplay.textContent = '';
            }
        } else {
             statusBadge.textContent = 'לא התחיל';
             statusBadge.className = 'status-badge not-started';
             scoreDisplay.textContent = '';
        }
    });
}


// --- Local Storage Management ---
function saveState(quizId, state) {
    localStorage.setItem(quizId, JSON.stringify(state));
}

function loadState(quizId, totalQuestions) {
    const savedState = localStorage.getItem(quizId);
    if (savedState) {
        const state = JSON.parse(savedState);
        state.totalQuestions = totalQuestions > 0 ? totalQuestions : state.totalQuestions;
        return state;
    }
    return {
        score: 0,
        completedQuestions: 0,
        totalQuestions: totalQuestions,
        answers: []
    };
}