const app = document.getElementById("app");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const message = document.getElementById("message");
const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");
const reviewPanel = document.getElementById("reviewPanel");
const reviewList = document.getElementById("reviewList");

const gameTitle = document.getElementById("gameTitle");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const miniControls = document.getElementById("miniControls");

const forSinceModeButton = document.getElementById("forSinceModeButton");
const perfectModeButton = document.getElementById("perfectModeButton");

const forSinceQuestions = [
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
  { text: "5 minutes", answer: "for" },
  { text: "a week", answer: "for" },
  { text: "3 months", answer: "for" },
  { text: "7 years", answer: "for" },
  { text: "two hours", answer: "for" },
  { text: "four days", answer: "for" },
  { text: "ten years", answer: "for" },
  { text: "a few weeks", answer: "for" },

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
  { text: "we met", answer: "since" },
  { text: "5 minutes ago", answer: "since" },
  { text: "a week ago", answer: "since" },
  { text: "3 months ago", answer: "since" },
  { text: "7 years ago", answer: "since" },
  { text: "last Monday", answer: "since" },
  { text: "July", answer: "since" },
  { text: "I came here", answer: "since" },
  { text: "I was ten", answer: "since" }
];

const perfectQuestions = [
  { text: "already", answer: "completion" },
  { text: "yet", answer: "completion" },
  { text: "just", answer: "completion" },
  { text: "finally", answer: "completion" },
  { text: "just finished", answer: "completion" },
  { text: "already done", answer: "completion" },
  { text: "not yet", answer: "completion" },
  { text: "has just", answer: "completion" },
  { text: "have already", answer: "completion" },
  { text: "finally finished", answer: "completion" },

  { text: "once", answer: "experience" },
  { text: "twice", answer: "experience" },
  { text: "three times", answer: "experience" },
  { text: "many times", answer: "experience" },
  { text: "never", answer: "experience" },
  { text: "ever", answer: "experience" },
  { text: "before", answer: "experience" },
  { text: "several times", answer: "experience" },
  { text: "five times", answer: "experience" },
  { text: "how many times", answer: "experience" },

  { text: "for three days", answer: "continuation" },
  { text: "for two weeks", answer: "continuation" },
  { text: "for five years", answer: "continuation" },
  { text: "for a long time", answer: "continuation" },
  { text: "since Monday", answer: "continuation" },
  { text: "since 2019", answer: "continuation" },
  { text: "since last year", answer: "continuation" },
  { text: "since yesterday", answer: "continuation" },
  { text: "since this morning", answer: "continuation" },
  { text: "since I was ten", answer: "continuation" }
];

const gameModes = {
  forSince: {
    title: "For? Since?",
    messageTitle: "For? Since?",
    messageText: "流れてくるカードを見て、for なら ↑、since なら ↓ を押すべし。",
    highScoreKey: "forSinceHighScore",
    questions: forSinceQuestions,
    controls: [
      { key: "ArrowUp", answer: "for", arrow: "↑", label: "for" },
      { key: "ArrowDown", answer: "since", arrow: "↓", label: "since" }
    ]
  },
  perfect: {
    title: "現在完了 3用法",
    messageTitle: "現在完了 3用法",
    messageText: "完了は ←、経験は ↑、継続は → を押すべし。",
    highScoreKey: "perfectHighScore",
    questions: perfectQuestions,
    controls: [
      { key: "ArrowLeft", answer: "completion", arrow: "←", label: "完了", subLine1: "したところだ", subLine2: "" },
      { key: "ArrowUp", answer: "experience", arrow: "経験", label: "↑", subLine1: "したことが", subLine2: "ある" },
      { key: "ArrowRight", answer: "continuation", arrow: "継続", label: "→", subLine1: "ずっと", subLine2: "している" }
    ]
  }
};

let currentModeName = "forSince";
let currentMode = gameModes[currentModeName];

let score = 0;
let highScore = Number(localStorage.getItem(currentMode.highScoreKey)) || 0;

let isPlaying = false;
let animationId = null;

let activeCards = [];
let answerLog = [];

let lastFrameTime = 0;
let lastSpawnTime = 0;
let spawnedCount = 0;

let baseMoveSpeed = 180;
let moveSpeed = baseMoveSpeed;

highScoreEl.textContent = highScore;
renderMode();

function renderMode() {
  currentMode = gameModes[currentModeName];

  gameTitle.textContent = currentMode.title;
  messageTitle.textContent = currentMode.messageTitle;
  messageText.textContent = currentMode.messageText;

  highScore = Number(localStorage.getItem(currentMode.highScoreKey)) || 0;
  highScoreEl.textContent = highScore;

  score = 0;
  scoreEl.textContent = score;

  reviewPanel.style.display = "none";
  reviewList.innerHTML = "";

  clearCards();

  miniControls.innerHTML = "";
  miniControls.classList.toggle("three-buttons", currentMode.controls.length === 3);

  currentMode.controls.forEach((control) => {
    const button = document.createElement("button");
    button.innerHTML = `
      <div class="control-main">
        <span class="control-arrow">${control.arrow}</span>
        <span class="control-label">${control.label}</span>
      </div>
      ${
        control.subLine1 || control.subLine2
          ? `<small>
              ${control.subLine1 ? `<span>${control.subLine1}</span>` : ""}
              ${control.subLine2 ? `<span>${control.subLine2}</span>` : ""}
            </small>`
          : ""
      }
    `;

    button.addEventListener("click", () => {
      checkAnswer(control.answer);
    });

    miniControls.appendChild(button);
  });

  forSinceModeButton.classList.toggle("active", currentModeName === "forSince");
  perfectModeButton.classList.toggle("active", currentModeName === "perfect");
}

function switchMode(modeName) {
  if (isPlaying) return;

  currentModeName = modeName;
  renderMode();
}

forSinceModeButton.addEventListener("click", () => {
  switchMode("forSince");
});

perfectModeButton.addEventListener("click", () => {
  switchMode("perfect");
});

function startGame() {
  score = 0;
  spawnedCount = 0;
  activeCards = [];
  answerLog = [];
  isPlaying = true;

  document.body.classList.add("no-scroll");

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
  const interval = 2600 - level * 200;

  return Math.max(interval, 1000);
}

function getMoveSpeed() {
  const level = Math.floor(score / 20);

  return baseMoveSpeed + level * 20;
}

function spawnCard() {
  const randomIndex = Math.floor(Math.random() * currentMode.questions.length);
  const question = currentMode.questions[randomIndex];

  const card = document.createElement("div");
  card.className = "question-card";
  card.innerHTML = `<span>${question.text}</span>`;

  const gameWidth = gameArea.clientWidth;
  const cardWidth = 230;

  const x = gameWidth + 40;
  const y = findSafeYPosition();

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

function findSafeYPosition() {
  const cardHeight = 110;
  const topMargin = 70;
  const bottomMargin = 70;
  const minimumGap = 125;

  const minY = topMargin;
  const maxY = gameArea.clientHeight - bottomMargin - cardHeight;

  for (let i = 0; i < 30; i++) {
    const candidateY = minY + Math.random() * (maxY - minY);

    const isOverlapping = activeCards.some((cardData) => {
      const verticalDistance = Math.abs(cardData.y - candidateY);
      const horizontalDistance = Math.abs(cardData.x - (gameArea.clientWidth + 40));

      const isNearHorizontally = horizontalDistance < 280;
      const isNearVertically = verticalDistance < minimumGap;

      return isNearHorizontally && isNearVertically;
    });

    if (!isOverlapping) {
      return candidateY;
    }
  }

  const lanes = [minY, minY + 130, minY + 260].filter((laneY) => {
    return laneY <= maxY;
  });

  const leastCrowdedLane = lanes.reduce((bestLane, laneY) => {
    const bestCount = countCardsNearLane(bestLane);
    const currentCount = countCardsNearLane(laneY);

    return currentCount < bestCount ? laneY : bestLane;
  }, lanes[0]);

  return leastCrowdedLane;
}

function countCardsNearLane(laneY) {
  return activeCards.filter((cardData) => {
    return Math.abs(cardData.y - laneY) < 120;
  }).length;
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
      correctAnswer: getAnswerLabel(missedCard.question.answer),
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
    correctAnswer: getAnswerLabel(targetCard.question.answer),
    yourAnswer: getAnswerLabel(input),
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

function getAnswerLabel(answer) {
  const labels = {
    for: "for",
    since: "since",
    completion: "完了",
    experience: "経験",
    continuation: "継続"
  };

  return labels[answer] || answer;
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

  document.body.classList.remove("no-scroll");

  updateHighScore();
  showResultMessage();
  showReview();
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(currentMode.highScoreKey, highScore);
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

  const correctAnswers = answerLog.filter((item) => {
    return item.isCorrect;
  });

  const wrongSection = document.createElement("div");
  wrongSection.className = "review-section";
  wrongSection.innerHTML = `
    <h3>Review</h3>
  `;
  reviewList.appendChild(wrongSection);

  if (wrongAnswers.length === 0) {
    const perfectMessage = document.createElement("div");
    perfectMessage.className = "perfect-message";
    perfectMessage.textContent = "間違えた問題はありません。Perfect!";
    reviewList.appendChild(perfectMessage);
  } else {
    wrongAnswers.forEach((item) => {
      const row = document.createElement("div");
      row.className = "review-item wrong large-wrong";

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

  const correctSection = document.createElement("details");
  correctSection.className = "correct-review-box";

  correctSection.innerHTML = `
    <summary>
      正解した問題を見る 
      <span>${correctAnswers.length}問</span>
    </summary>
    <div class="correct-grid" id="correctGrid"></div>
  `;

  reviewList.appendChild(correctSection);

  const correctGrid = document.getElementById("correctGrid");

  if (correctAnswers.length === 0) {
    correctGrid.innerHTML = `<p class="no-correct-message">正解した問題はまだありません。</p>`;
    return;
  }

  correctAnswers.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "correct-chip";

    chip.innerHTML = `
      <span class="correct-word">${item.text}</span>
      <span class="correct-answer">${item.correctAnswer}</span>
    `;

    correctGrid.appendChild(chip);
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
  const matchedControl = currentMode.controls.find((control) => {
    return control.key === event.key;
  });

  if (matchedControl) {
    event.preventDefault();
    checkAnswer(matchedControl.answer);
  }
});

startButton.addEventListener("click", startGame);
