// output.js: Single-player Quiz Game Logic for QUIZERA with Topic, Difficulty, Timer, Streaks, Hints

document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const quizArea = document.getElementById('quiz-area');
  const questionArea = document.getElementById('question-area');
  const navBtns = document.getElementById('nav-btns');
  const progressBar = document.getElementById('progress-bar');
  const gameOver = document.getElementById('game-over');
  const topicInput = document.getElementById('topic-input');
  const topicError = document.getElementById('topic-error');
  const difficultySelect = document.getElementById('difficulty-select');
  const usernameInput = document.getElementById('username-input');
  let quizData = [];
  let userAnswers = [];
  let currentIdx = 0;
  let score = 0;
  let timer = null;
  let timeLeft = 0;
  let streak = 0;
  let maxStreak = 0;
  let hintUsed = [];
  const QUESTION_TIME = 20; // seconds

  function resetState() {
    quizData = [];
    userAnswers = [];
    currentIdx = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    hintUsed = [];
    clearTimer();
  }

  async function generateQuizForTopic(topic, difficulty) {
    const res = await fetch('/api/quiz/generate-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate quiz');
    }
    const data = await res.json();
    return data.questions || [];
  }

  function showStartScreen() {
    startScreen.style.display = 'block';
    quizArea.style.display = 'none';
    gameOver.style.display = 'none';
    topicInput.value = '';
    topicError.textContent = '';
    difficultySelect.value = 'medium';
    usernameInput.value = '';
  }

  async function startGame() {
    const username = usernameInput.value.trim();
    const topic = topicInput.value.trim();
    const difficulty = difficultySelect.value;
    if (!username) {
      topicError.textContent = 'Please enter your name for the leaderboard.';
      return;
    }
    if (!topic) {
      topicError.textContent = 'Please enter a topic to start the quiz.';
      return;
    }
    topicError.textContent = 'Generating quiz... Please wait.';
    resetState();
    try {
      quizData = await generateQuizForTopic(topic, difficulty);
      if (!quizData.length) throw new Error('No questions generated. Try a different topic or lower difficulty.');
      userAnswers = new Array(quizData.length).fill(null);
      hintUsed = new Array(quizData.length).fill(false);
      currentIdx = 0;
      score = 0;
      streak = 0;
      maxStreak = 0;
      startScreen.style.display = 'none';
      quizArea.style.display = 'block';
      gameOver.style.display = 'none';
      showQuestion();
    } catch (err) {
      topicError.textContent = err.message || 'Failed to generate quiz. Try a different topic.';
    }
  }

  function showQuestion() {
    questionArea.innerHTML = '';
    navBtns.innerHTML = '';
    clearTimer();
    if (!quizData.length) {
      questionArea.innerHTML = '<p>No quiz questions available.</p>';
      return;
    }
    const q = quizData[currentIdx];
    const qDiv = document.createElement('div');
    qDiv.className = 'question';
    qDiv.innerHTML = `<strong>Q${currentIdx + 1}:</strong> ${q.question}`;
    // Timer display
    const timerDiv = document.createElement('div');
    timerDiv.id = 'timer-div';
    timerDiv.style = 'font-weight:bold;color:#e67e22;margin-bottom:6px;';
    qDiv.appendChild(timerDiv);
    // Hint button
    const hintBtn = document.createElement('button');
    hintBtn.textContent = 'Hint';
    hintBtn.style = 'margin-left:10px;margin-bottom:6px;';
    hintBtn.disabled = hintUsed[currentIdx];
    hintBtn.onclick = () => showHint(q, qDiv, hintBtn);
    qDiv.appendChild(hintBtn);
    // Option buttons
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      if (userAnswers[currentIdx] === i) btn.classList.add('selected');
      btn.onclick = () => selectOption(i);
      qDiv.appendChild(document.createElement('br'));
      qDiv.appendChild(btn);
    });
    // Streak display
    const streakDiv = document.createElement('div');
    streakDiv.style = 'margin-top:8px;color:#2563eb;';
    streakDiv.innerHTML = streak > 1 ? ` Streak: ${streak} correct in a row!` : '';
    qDiv.appendChild(streakDiv);
    questionArea.appendChild(qDiv);
    // Progress bar
    progressBar.innerHTML = `Question ${currentIdx + 1} of ${quizData.length}`;
    // Next/Submit button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = (currentIdx === quizData.length - 1) ? 'Submit Quiz' : 'Next';
    nextBtn.disabled = userAnswers[currentIdx] === null;
    nextBtn.onclick = nextQuestion;
    navBtns.appendChild(nextBtn);
    // Back button (if not first question)
    if (currentIdx > 0) {
      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back';
      backBtn.onclick = prevQuestion;
      navBtns.insertBefore(backBtn, nextBtn);
    }
    // Start timer
    startTimer(timerDiv);
  }

  function selectOption(optIdx) {
    userAnswers[currentIdx] = optIdx;
    showQuestion();
  }

  function nextQuestion() {
    clearTimer();
    if (currentIdx < quizData.length - 1) {
      currentIdx++;
      showQuestion();
    } else {
      finishGame();
    }
  }

  function prevQuestion() {
    clearTimer();
    if (currentIdx > 0) {
      currentIdx--;
      showQuestion();
    }
  }

  function finishGame() {
    clearTimer();
    score = 0;
    let wrongDetails = [];
    streak = 0;
    maxStreak = 0;
    quizData.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        score++;
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        wrongDetails.push({
          question: q.question,
          yourAnswer: q.options[userAnswers[idx]],
          correctAnswer: q.options[q.correct],
          context: q.context || ''
        });
        streak = 0;
      }
    });
    quizArea.style.display = 'none';
    gameOver.style.display = 'block';
    let html = `<h2>Game Over!</h2><div>Your Score: <b>${score} / ${quizData.length}</b></div>`;
    html += `<div>Max Streak: <b>${maxStreak}</b></div>`;
    if (wrongDetails.length > 0) {
      html += '<div style="margin-top:18px;"><strong>Review your mistakes:</strong><ul>' +
        wrongDetails.map(w => `<li><b>Q:</b> ${w.question}<br><b>Your answer:</b> ${w.yourAnswer}<br><b>Correct answer:</b> ${w.correctAnswer}<br><b>Explanation:</b> ${w.context}</li>`).join('') + '</ul></div>';
    } else {
      html += '<div style="margin-top:18px;color:#27ae60;">Amazing! All answers correct!</div>';
    }
    html += '<button id="play-again-btn" style="margin-top:18px;">Play Again</button>';
    gameOver.innerHTML = html;
    document.getElementById('play-again-btn').onclick = () => showStartScreen();

    // Add Save Score and Leaderboard buttons
    gameOver.innerHTML += `
      <div style="text-align:center;margin:16px 0;">
        <button id="save-score-btn" style="padding:8px 12px;">Save Score</button>
        <button id="view-leaderboard-btn" style="padding:8px 12px;margin-left:8px;">View Leaderboard</button>
        <button id="print-btn" style="padding:8px 12px;margin-left:8px;">Print PDF</button>
      </div>
    `;
    document.getElementById('save-score-btn').onclick = async () => {
      const uname = usernameInput.value.trim();
      const top = topicInput.value.trim();
      if (!uname) { alert('Please enter your name to save score'); return; }
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, score, topic: top, timestamp: new Date().toISOString() })
      });
      window.location.href = 'leaderboard.html';
    };
    document.getElementById('view-leaderboard-btn').onclick = () => { window.location.href = 'leaderboard.html'; };
    document.getElementById('print-btn').onclick = () => window.print();
  }

  function startTimer(timerDiv) {
    timeLeft = QUESTION_TIME;
    timerDiv.textContent = `Time left: ${timeLeft}s`;
    timer = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = `Time left: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearTimer();
        userAnswers[currentIdx] = null; // Mark as unanswered
        streak = 0;
        nextQuestion();
      }
    }, 1000);
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function showHint(q, qDiv, hintBtn) {
    hintBtn.disabled = true;
    hintUsed[currentIdx] = true;
    // Simple hint: eliminate one wrong option
    let wrongIdx = q.options.findIndex((opt, i) => i !== q.correct && (!userAnswers[currentIdx] || i !== userAnswers[currentIdx]));
    if (wrongIdx !== -1) {
      const hintDiv = document.createElement('div');
      hintDiv.style = 'color:#e67e22;margin-top:8px;';
      hintDiv.innerHTML = `Hint: Option "${q.options[wrongIdx]}" is NOT correct.`;
      qDiv.appendChild(hintDiv);
    }
  }

  // If coming from upload, auto-load PDF-based quiz from backend
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('fromUpload') === '1') {
    // Fetch quiz questions from /api/quiz/questions (session)
    fetch('/api/quiz/questions', {credentials: 'same-origin'})
      .then(res => res.json())
      .then(data => {
        quizData = data.questions || [];
        if (!quizData.length) {
          topicError.textContent = 'No quiz questions found from upload.';
          return;
        }
        userAnswers = new Array(quizData.length).fill(null);
        hintUsed = new Array(quizData.length).fill(false);
        currentIdx = 0;
        score = 0;
        streak = 0;
        maxStreak = 0;
        startScreen.style.display = 'none';
        quizArea.style.display = 'block';
        gameOver.style.display = 'none';
        showQuestion();
      });
    return;
  }
  // Otherwise, normal topic-based quiz flow
  // (REMOVED) Play Now button logic for start-gameplay-btn, to avoid duplicate/conflicting listeners. All Play Now logic is now handled in output.html inline script.
  document.getElementById('start-btn').onclick = startGame;
  showStartScreen();
});
