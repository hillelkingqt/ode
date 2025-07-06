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

        renderQuiz();

        function renderQuiz() {
            questionArea.innerHTML = '';
            quizData.forEach((q, idx) => {
                const optionsHTML = q.options.map((opt, i) =>
                    `<li class="option" data-question="${idx}" data-index="${i}">${opt.text}</li>`
                ).join('');

                const answered = state.answers[idx] !== undefined;
                const optionListClass = answered ? 'answered' : '';
                const explanationStyle = answered ? '' : 'display:none;';

                questionArea.insertAdjacentHTML('beforeend', `
                    <div class="question-block">
                        <div class="question-header">שאלה ${idx + 1}</div>
                        <p class="question-text">${q.question}</p>
                        ${q.equation ? `\\[ ${q.equation} \\]` : ''}
                        <ul class="options-list ${optionListClass}">${optionsHTML}</ul>
                        <div class="explanation" style="${explanationStyle}">
                            <h4>הסבר:</h4>
                            <p>${q.explanation}</p>
                        </div>
                    </div>`);
            });

            renderMathInElement(questionArea);

            questionArea.querySelectorAll('.option').forEach(opt => {
                opt.addEventListener('click', handleOptionClick);
            });

            // restore saved answers
            questionArea.querySelectorAll('.options-list').forEach((list, idx) => {
                const savedIndex = state.answers[idx];
                if (savedIndex !== undefined) {
                    const correctIndex = quizData[idx].options.findIndex(o => o.correct);
                    const optionNodes = list.querySelectorAll('.option');
                    optionNodes[savedIndex].classList.add('selected');
                    if (savedIndex === correctIndex) {
                        optionNodes[savedIndex].classList.add('correct');
                    } else {
                        optionNodes[savedIndex].classList.add('incorrect');
                        optionNodes[correctIndex].classList.add('correct');
                    }
                }
            });

            updateProgress();
            if (state.completedQuestions === quizData.length) {
                showFinalResults();
            }
        }

        function handleOptionClick(event) {
            const selectedOption = event.currentTarget;
            const optionsList = selectedOption.parentElement;

            if (optionsList.classList.contains('answered')) return;
            optionsList.classList.add('answered');

            const questionIndex = parseInt(selectedOption.dataset.question);
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
            state.answers[questionIndex] = selectedIndex;
            saveState(quizId, state);

            // *** הוספת הקוד ליצירת הכפתור ***
            // הסרנו את ה-setTimeout
            
            if (state.completedQuestions === quizData.length) {
                showFinalResults();
            }
        }

        function showFinalResults() {
            questionArea.style.display = 'block';
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
                progressDisplay.textContent = `נענו ${completed} מתוך ${total} | נקודות: ${state.score}`;
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