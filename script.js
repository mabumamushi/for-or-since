const app = document.getElementById("app");
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

let isPlaying = false;
let animationId = null;

let activeCards = [];
let answerLog = [];

let lastFrameTime = 0;
let lastSpawnTime = 0;
let spawnedCount = 0;

let baseMoveSpeed = 180; // px / 秒
let moveSpeed = baseMoveSpeed;

highScoreEl.textContent = highScore;

function startGame() {
  score = 0;
  spawnedCount = 0;
  activeCards = [];
  answerLog = [];
  isPlaying = true;

  moveSpeed = baseMoveSpeed;

  scoreEl.textContent = score;
  reviewPanel.style.display = "none";
  reviewList.innerHTML = "";

  clearCards();

  message.style.display = "none";

  lastFrameTime = performance.now();
  lastSpawnTime = performance.now();

  spawnCard();
  gameLoop(lastFrameTime);
}

function clearCards() {
  document.querySelectorAll(".question-card").forEach((card) => {
    card.remove();
  });
}

function getSpawnInterval() {
  const level = Math.floor(spawnedCount / 10);

  const interval = 1000 - level * 100;

  return Math.max(interval, 600);
}

function getMoveSpeed() {
  const level = Math.floor(score / 20);

  return baseMoveSpeed + level * 20;
}

function spawnCard() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  const card = document.createElement("div");
  card.className = "question-card";
  card.innerHTML = `<span>${question.text}</span>`;

  const gameWidth = gameArea.clientWidth;
  const cardWidth = 230;

  const x = gameWidth + 40;
  const y = 70 + Math.random() * (gameArea.clientHeight - 160);

  card.style.display = "flex";
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  gameArea.appendChild(card);

  activeCards.push({
    id: crypto.randomUUID(),
    element: card,
    question,
    x,
    y,
    width: cardWidth
  });

  spawnedCount++;
}

function gameLoop(currentTime) {
  if (!isPlaying) return;

  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  const spawnInterval = getSpawnInterval();

  if (currentTime - lastSpawnTime >= spawnInterval) {
    spawnCard();
    lastSpawnTime = currentTime;
  }

  moveSpeed = getMoveSpeed();

  activeCards.forEach((cardData) => {
    cardData.x -= moveSpeed * deltaTime;
    cardData.element.style.left = `${cardData.x}px`;
  });

  const dangerLineX = 50;

  const missedCard = activeCards.find((cardData) => {
    return cardData.x <= dangerLineX;
  });

  if (missedCard) {
    answerLog.push({
      text: missedCard.question.text,
      correctAnswer: missedCard.question.answer,
      yourAnswer: "未回答",
      isCorrect: false
    });

    triggerWrongEffect(missedCard.element, () => {
      gameOver();
    });

    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}

function getTargetCard() {
  if (activeCards.length === 0) return null;

  const sortedCards = [...activeCards].sort((a, b) => {
    return a.x - b.x;
  });

  return sortedCards[0];
}

function checkAnswer(input) {
  if (!isPlaying) return;

  const targetCard = getTargetCard();

  if (!targetCard) return;

  const isCorrect = input === targetCard.question.answer;

  answerLog.push({
    text: targetCard.question.text,
    correctAnswer: targetCard.question.answer,
    yourAnswer: input,
    isCorrect
  });

  if (isCorrect) {
    score++;
    scoreEl.textContent = score;

    playCorrectSound();
    showCorrectPop(targetCard.element);
    removeCard(targetCard);

  } else {
    triggerWrongEffect(targetCard.element, () => {
      gameOver();
    });
  }
}

function removeCard(cardData) {
  activeCards = activeCards.filter((card) => {
    return card.id !== cardData.id;
  });

  setTimeout(() => {
    cardData.element.remove();
  }, 120);
}

function gameOver() {
  isPlaying = false;
  cancelAnimationFrame(animationId);

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

  const wrongAnswers = answerLog.filter((item) => {
    return !item.isCorrect;
  });

  if (wrongAnswers.length === 0) {
    reviewList.innerHTML = `<p>間違えた問題はありません。Perfect!</p>`;
    return;
  }

  wrongAnswers.forEach((item) => {
    const row = document.createElement("div");
    row.className = "review-item wrong";

    row.innerHTML = `
      <div>
        <div class="review-word">${item.text}</div>
        <div class="review-detail">
          あなたの回答：${item.yourAnswer} / 正解：${item.correctAnswer}
        </div>
      </div>
      <div class="result-badge wrong">
        CHECK
      </div>
    `;

    reviewList.appendChild(row);
  });
}

function triggerWrongEffect(targetElement, callback) {
  if (!isPlaying) return;

  isPlaying = false;
  cancelAnimationFrame(animationId);

  playWrongSound();

  gameArea.classList.remove("wrong-flash");
  app.classList.remove("shake");

  if (targetElement) {
    targetElement.classList.remove("card-shake");
  }

  void gameArea.offsetWidth;

  gameArea.classList.add("wrong-flash");
  app.classList.add("shake");

  if (targetElement) {
    targetElement.classList.add("card-shake");
  }

  setTimeout(() => {
    gameArea.classList.remove("wrong-flash");
    app.classList.remove("shake");

    if (targetElement) {
      targetElement.classList.remove("card-shake");
    }

    callback();
  }, 700);
}

function showCorrectPop(targetElement) {
  targetElement.classList.remove("correct-pop");
  void targetElement.offsetWidth;
  targetElement.classList.add("correct-pop");
}

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
