// output-mcq.js
// Loads quiz questions from backend (PDF upload), renders as MCQ sheet, and shows result after submission.

// Fetches quiz questions from backend session (PDF upload)
async function fetchQuizQuestions() {
  const res = await fetch('/api/quiz/questions', { credentials: 'same-origin' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.questions || [];
}

function renderMCQSheet(questions) {
  const container = document.getElementById('mcq-questions');
  if (!questions.length) {
    container.innerHTML = '<p>No quiz questions found. Please upload a document first.</p>';
    document.querySelector('.mcq-submit-btn').style.display = 'none';
    return;
  }
  let html = '';
  questions.forEach((q, idx) => {
    html += `<div class="mcq-question">
      <div style="font-weight:bold;">Q${idx+1}: ${q.question}</div>
      <div class="mcq-options">
        ${q.options.map((opt, oidx) => `
          <label>
            <input type="radio" name="q${idx}" value="${oidx}">
            ${String.fromCharCode(65+oidx)}. ${opt}
          </label>
        `).join('')}
      </div>
      ${q.context ? `<div class="mcq-explanation" id="explain-${idx}" style="display:none;">Explanation: ${q.context}</div>` : ''}
    </div>`;
  });
  container.innerHTML = html;
}

function showMCQResults(questions, userAnswers) {
  let correct = 0;
  let wrongDetails = [];
  questions.forEach((q, idx) => {
    const chosen = userAnswers[idx];
    const correctIdx = typeof q.correct === 'number' ? q.correct : q.options.indexOf(q.correct);
    const labels = document.getElementsByName(`q${idx}`);
    labels.forEach((input, oidx) => {
      const label = input.parentElement;
      label.classList.remove('correct', 'incorrect');
      if (input.checked) {
        if (oidx === correctIdx) {
          label.classList.add('correct');
          correct++;
        } else {
          label.classList.add('incorrect');
        }
      }
      if (oidx === correctIdx) {
        label.classList.add('correct');
      }
    });
    // Show explanation
    const exp = document.getElementById(`explain-${idx}`);
    if (exp) exp.style.display = 'block';
    // Collect wrong answer details
    if (chosen !== correctIdx) {
      wrongDetails.push({
        idx,
        question: q.question,
        yourAnswer: chosen !== null && chosen >= 0 ? q.options[chosen] : 'No answer',
        correctAnswer: q.options[correctIdx],
        explanation: q.context || ''
      });
    }
  });
  const percent = Math.round((correct/questions.length)*100);
  let reviewHTML = '';
  if (wrongDetails.length) {
    reviewHTML = `<div class="mcq-detailed-review"><h3>Review of Incorrect Answers</h3><ol>` +
      wrongDetails.map(w => `
        <li style="margin-bottom:14px;">
          <strong>Q${w.idx+1}:</strong> ${w.question}<br>
          <span style="color:#e74c3c;"><b>Your answer:</b> ${w.yourAnswer}</span><br>
          <span style="color:#27ae60;"><b>Correct answer:</b> ${w.correctAnswer}</span><br>
          ${w.explanation ? `<span style='color:#555;'><b>Explanation:</b> ${w.explanation}</span><br>` : ''}
        </li>
      `).join('') + '</ol></div>';
  }
  document.getElementById('mcq-result').innerHTML = `<div class="mcq-result">Score: ${correct} / ${questions.length} (${percent}%)</div>` + reviewHTML;
}

document.addEventListener('DOMContentLoaded', async function() {
  const questions = await fetchQuizQuestions();
  renderMCQSheet(questions);
  document.getElementById('mcq-form').onsubmit = function(e) {
    e.preventDefault();
    if (!questions.length) return;
    const userAnswers = questions.map((q, idx) => {
      const selected = document.querySelector(`input[name="q${idx}"]:checked`);
      return selected ? parseInt(selected.value) : null;
    });
    showMCQResults(questions, userAnswers);
    // Disable all radios after submission
    document.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
    document.querySelector('.mcq-submit-btn').disabled = true;
  };
  // Print button
  document.getElementById('mcq-print-btn').onclick = function() {
    window.print();
  };
});
