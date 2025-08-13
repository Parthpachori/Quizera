const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

let quizData = null;
let quizAnswers = [];
let quizActive = false;

function appendMessage(sender, text, html = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg ' + sender;
    if (html) {
        msgDiv.innerHTML = html;
    } else {
        msgDiv.textContent = text;
    }
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    appendMessage('user', `Uploaded: ${file.name}`);
    const formData = new FormData();
    formData.append('file', file);
    appendMessage('bot', 'Processing document and generating quiz...');
    try {
        const res = await fetch('/api/chatbot/upload-and-quiz', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.quiz) {
            quizData = data.quiz;
            quizAnswers = Array(quizData.length).fill(null);
            quizActive = true;
            showQuiz();
        } else {
            appendMessage('bot', 'Failed to generate quiz: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        appendMessage('bot', 'Upload failed: ' + err);
    }
};

sendBtn.onclick = () => {
    if (quizActive) {
        submitQuiz();
    } else {
        const msg = chatInput.value.trim();
        if (msg) {
            appendMessage('user', msg);
            appendMessage('bot', 'Please upload a document to start a quiz.');
        }
        chatInput.value = '';
    }
};

function showQuiz() {
    let html = '<form id="quiz-form">';
    quizData.forEach((q, idx) => {
        html += `<div class='quiz-question'><b>Q${idx+1}:</b> ${q.question}<br>`;
        q.options.forEach((opt, oidx) => {
            html += `<label><input type='radio' name='q${idx}' value='${oidx}'> ${opt}</label><br>`;
        });
        html += '</div>';
    });
    html += `<button type='submit'>Submit Quiz</button></form>`;
    appendMessage('bot', '', html);
    document.getElementById('quiz-form').onsubmit = (e) => {
        e.preventDefault();
        quizAnswers = quizData.map((_, idx) => {
            const radios = document.getElementsByName('q'+idx);
            for (let r of radios) if (r.checked) return parseInt(r.value);
            return null;
        });
        submitQuiz();
    };
}

async function submitQuiz() {
    if (!quizData) return;
    if (quizAnswers.some(a => a === null)) {
        appendMessage('bot', 'Please answer all questions before submitting!');
        return;
    }
    appendMessage('user', 'Submitted quiz!');
    appendMessage('bot', 'Checking your answers...');
    try {
        const res = await fetch('/api/chatbot/submit-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: quizAnswers })
        });
        const data = await res.json();
        if (res.ok) {
            showResults(data);
        } else {
            appendMessage('bot', 'Failed to check quiz: ' + (data.error || 'Unknown error'));
        }
        quizActive = false;
        quizData = null;
        quizAnswers = [];
    } catch (err) {
        appendMessage('bot', 'Quiz check failed: ' + err);
    }
}

function showResults(data) {
    let html = `<div class='quiz-results'>Score: <b>${data.score} / ${data.total}</b></div>`;
    if (data.wrong && data.wrong.length) {
        html += '<div class="wrong-answers"><b>Correct answers for your mistakes:</b><ul>';
        data.wrong.forEach(w => {
            html += `<li><b>Q:</b> ${w.question}<br><b>Your answer:</b> ${w.your_answer || 'No answer'}<br><b>Correct:</b> ${w.correct_answer}</li>`;
        });
        html += '</ul></div>';
    } else {
        html += '<div class="all-correct">All answers correct! 🎉</div>';
    }
    appendMessage('bot', '', html);
}
