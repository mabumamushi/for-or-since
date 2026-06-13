const app = document.getElementById("app");
const card = document.getElementById("card");
const cardText = document.getElementById("cardText");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const message = document.getElementById("message");
const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const reviewPanel = document.getElementById("reviewPanel");
const reviewList = document.getElementById("reviewList");

const questions = [
  // for に続く語
  { text: "three days", answer: "for" },
  { text: "two weeks", answer: "for" },
  { text: "five years", answer: "for" },
  { text: "a long time", answer: "for" },
  { text: "ten minutes", answer: "for" },
  { text: "six months", answer: "for" },
  { text: "many hours", answer: "for" },
  { text: "a few days", answer: "for" },
  { text: "one year", answer: "for" },
  { text: "half an hour", answer: "for" },
  { text: "several months", answer: "for" },
  { text: "a short time", answer: "for" },

  // since に続く語
  { text: "Monday", answer: "since" },
  { text: "2019", answer: "since" },
  { text: "last year", answer: "since" },
  { text: "yesterday", answer: "since" },
  { text: "this morning", answer: "since" },
  { text: "I was a child", answer: "since" },
  { text: "April", answer: "since" },
  { text: "last week", answer: "since" },
  { text: "8 o'clock", answer: "since" },
  { text: "then", answer: "since" },
  { text: "my birthday", answer: "since" },
  { text: "we met", answer: "since" }
];

let score = 0;
let highScore = Number(localStorage.getItem("forSinceHighScore")) || 0;

let speed = 2.6;
let cardX = 0;
let currentQuestion = null;
let isPlaying = false;
let animationId = null;
let answerLog = [];

highScoreEl.textContent = highScore;

function startGame() {
  score = 0;
  speed = 2.6;
  answerLog = [];
  isPlaying = true;

  scoreEl.textContent = score;
  reviewPanel.style.display = "none";
  reviewList.innerHTML = "";

  message.style.display = "none";
  card.style.display = "flex";

  setNewQuestion();
  gameLoop();
}

function setNewQuestion() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  currentQuestion = questions[randomIndex];

  cardText.textContent = currentQuestion.text;

  const gameWidth = gameArea.clientWidth;
  cardX = gameWidth + 40;

  const randomY = 90 + Math.random() * (gameArea.clientHeight - 190);
  card.style.top = `${randomY}px`;
  card.style.left = `${cardX}px`;
}

function gameLoop() {
  if (!isPlaying) return;

  cardX -= speed;
  card.style.left = `${cardX}px`;

  const dangerLineX = 50;

  if (cardX <= dangerLineX) {
    answerLog.push({
      text: currentQuestion.text,
      correctAnswer: currentQuestion.answer,
      yourAnswer: "未回答",
      isCorrect: false
    });

    triggerWrongEffect(() => {
      gameOver();
    });

    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}

function checkAnswer(input) {
  if (!isPlaying || !currentQuestion) return;

  const isCorrect = input === currentQuestion.answer;

  answerLog.push({
    text: currentQuestion.text,
    correctAnswer: currentQuestion.answer,
    yourAnswer: input,
    isCorrect
  });

  if (isCorrect) {
    score++;
    scoreEl.textContent = score;

    playCorrectSound();
    showCorrectPop();

    if (score % 10 === 0) {
      speed += 0.7;
    }

    setNewQuestion();
  } else {
    triggerWrongEffect(() => {
      gameOver();
    });
  }
}

function gameOver() {
  isPlaying = false;
  cancelAnimationFrame(animationId);

  card.style.display = "none";
  updateHighScore();
  showResultMessage();
  showReview();
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("forSinceHighScore", highScore);
  }

  highScoreEl.textContent = highScore;
}

function showResultMessage() {
  message.style.display = "grid";

  const isNewRecord = score === highScore && score > 0;

  message.innerHTML = `
    <h2>GAME OVER</h2>
    <p>
      スコアは <strong>${score}</strong> 点です。<br>
      ${isNewRecord ? "ハイスコア更新！" : `ハイスコア：${highScore} 点`}
    </p>
    <button id="restartButton">RETRY</button>
  `;

  document.getElementById("restartButton").addEventListener("click", startGame);
}

function showReview() {
  reviewPanel.style.display = "block";
  reviewList.innerHTML = "";

  if (answerLog.length === 0) {
    reviewList.innerHTML = `<p>まだ回答がありません。</p>`;
    return;
  }

  answerLog.forEach((item) => {
    const row = document.createElement("div");
    row.className = `review-item ${item.isCorrect ? "correct" : "wrong"}`;

    row.innerHTML = `
      <div>
        <div class="review-word">${item.text}</div>
        <div class="review-detail">
          あなたの回答：${item.yourAnswer} / 正解：${item.correctAnswer}
        </div>
      </div>
      <div class="result-badge ${item.isCorrect ? "correct" : "wrong"}">
        ${item.isCorrect ? "OK" : "CHECK"}
      </div>
    `;

    reviewList.appendChild(row);
  });
}

function triggerWrongEffect(callback) {
  if (!isPlaying) return;

  isPlaying = false;
  cancelAnimationFrame(animationId);

  playWrongSound();

  gameArea.classList.remove("wrong-flash");
  app.classList.remove("shake");
  card.classList.remove("card-shake");

  void gameArea.offsetWidth;

  gameArea.classList.add("wrong-flash");
  app.classList.add("shake");
  card.classList.add("card-shake");

  setTimeout(() => {
    gameArea.classList.remove("wrong-flash");
    app.classList.remove("shake");
    card.classList.remove("card-shake");

    callback();
  }, 700);
}

function showCorrectPop() {
  card.classList.remove("correct-pop");
  void card.offsetWidth;
  card.classList.add("correct-pop");

  setTimeout(() => {
    card.classList.remove("correct-pop");
  }, 180);
}

// 正解音
function playCorrectSound() {
  const audioCtx = new AudioContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(660, audioCtx.currentTime);
  osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.18);
}

// 不正解音
function playWrongSound() {
  const audioCtx = new AudioContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.35);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    checkAnswer("for");
  }

  if (event.key === "ArrowDown") {
    checkAnswer("since");
  }
});

upButton.addEventListener("click", () => {
  checkAnswer("for");
});

downButton.addEventListener("click", () => {
  checkAnswer("since");
});

startButton.addEventListener("click", startGame);
