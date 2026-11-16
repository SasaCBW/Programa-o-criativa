
// ==========================================
// ESTÚDIO CRIATIVO
// Jogo + Roleta + História animada
// ==========================================

// NAVEGAÇÃO ENTRE AS EXPERIÊNCIAS

const tabs = document.querySelectorAll(".tab");
const experiences = document.querySelectorAll(".experience");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    experiences.forEach((item) => item.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// ==========================================
// EXPERIÊNCIA 01 - PEGA-PEGA ESTELAR
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const gameOverlay = document.getElementById("gameOverlay");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

let player = {
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT / 2,
  radius: 15
};

let enemies = [];
let stars = [];
let particles = [];

let gameRunning = false;
let gameStartedAt = 0;
let lastFrame = 0;
let lastSpawn = 0;
let score = 0;
let elapsed = 0;
let animationFrame = null;

function createStars() {
  stars = [];

  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.7 + 0.2
    });
  }
}

function drawSpaceBackground(delta) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#111a35");
  gradient.addColorStop(1, "#202044");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  stars.forEach((star) => {
    star.y += star.speed * delta * 0.025;

    if (star.y > GAME_HEIGHT) {
      star.y = 0;
      star.x = Math.random() * GAME_WIDTH;
    }

    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Brilho da nave
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  glow.addColorStop(0, "rgba(117, 226, 229, 0.35)");
  glow.addColorStop(1, "rgba(117, 226, 229, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  // Corpo da nave
  ctx.fillStyle = "#75e2e5";
  ctx.beginPath();
  ctx.moveTo(0, -19);
  ctx.lineTo(15, 13);
  ctx.lineTo(0, 8);
  ctx.lineTo(-15, 13);
  ctx.closePath();
  ctx.fill();

  // Janela
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Propulsor
  ctx.fillStyle = "#f59acb";
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 24 + Math.random() * 7);
  ctx.lineTo(5, 12);
  ctx.fill();

  ctx.restore();
}

function createEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) {
    x = Math.random() * GAME_WIDTH;
    y = -20;
  } else if (side === 1) {
    x = GAME_WIDTH + 20;
    y = Math.random() * GAME_HEIGHT;
  } else if (side === 2) {
    x = Math.random() * GAME_WIDTH;
    y = GAME_HEIGHT + 20;
  } else {
    x = -20;
    y = Math.random() * GAME_HEIGHT;
  }

  enemies.push({
    x,
    y,
    radius: 11 + Math.random() * 4,
    speed: 45 + Math.random() * 25 + Math.min(elapsed * 1.2, 65),
    angle: 0,
    wobble: Math.random() * Math.PI * 2
  });
}

function drawEnemy(enemy, delta) {
  enemy.wobble += delta * 0.004;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.wobble);

  ctx.shadowColor = "#f59acb";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f59acb";

  // Raio em formato de estrela
  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? enemy.radius : enemy.radius * 0.42;
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function createParticles(x, y) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: Math.random() * 4 + 2
    });
  }
}

function updateParticles(delta) {
  const factor = delta / 16.67;

  particles = particles.filter((particle) => particle.life > 0);

  particles.forEach((particle) => {
    particle.x += particle.vx * factor;
    particle.y += particle.vy * factor;
    particle.life -= delta * 0.0015;

    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = "#75e2e5";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function updateEnemies(delta) {
  const factor = delta / 1000;

  enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / distance) * enemy.speed * factor;
    enemy.y += (dy / distance) * enemy.speed * factor;

    const collisionDistance = player.radius + enemy.radius - 3;

    if (distance < collisionDistance) {
      endGame();
    }
  });
}

function drawGame() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawSpaceBackground(16);
  enemies.forEach((enemy) => drawEnemy(enemy, 16));
  drawParticles(16);
  drawPlayer();
}

function drawParticles(delta) {
  updateParticles(delta);
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const delta = Math.min(timestamp - (lastFrame || timestamp), 40);
  lastFrame = timestamp;

  elapsed = (timestamp - gameStartedAt) / 1000;
  score = Math.floor(elapsed * 10);

  scoreElement.textContent = score;
  timerElement.textContent = `${Math.floor(elapsed)}s`;

  // Cria novos clones com o passar do tempo
  const spawnInterval = Math.max(550, 1900 - elapsed * 35);

  if (timestamp - lastSpawn > spawnInterval && enemies.length < 20) {
    createEnemy();
    lastSpawn = timestamp;
  }

  drawSpaceBackground(delta);
  updateEnemies(delta);

  enemies.forEach((enemy) => drawEnemy(enemy, delta));

  updateParticles(delta);
  drawPlayer();

  if (gameRunning) {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  enemies = [];
  particles = [];
  score = 0;
  elapsed = 0;

  player.x = GAME_WIDTH / 2;
  player.y = GAME_HEIGHT / 2;

  createStars();

  for (let i = 0; i < 3; i++) {
    createEnemy();
  }

  gameRunning = true;
  gameStartedAt = performance.now();
  lastFrame = 0;
  lastSpawn = performance.now();

  scoreElement.textContent = "0";
  timerElement.textContent = "0s";

  gameOverlay.classList.add("hidden");

  animationFrame = requestAnimationFrame(gameLoop);
}

function endGame() {
  if (!gameRunning) return;

  gameRunning = false;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  createParticles(player.x, player.y);
  drawGame();

  gameOverlay.classList.remove("hidden");

  gameOverlay.innerHTML = `
    <div class="overlay-card">
      <span class="overlay-icon">🏆</span>
      <h3>Fim de jogo!</h3>
      <p>Você conseguiu ${score} pontos e sobreviveu por ${Math.floor(elapsed)} segundos.</p>
      <button class="primary-btn" id="playAgain">Jogar novamente</button>
    </div>
  `;

  document.getElementById("playAgain").addEventListener("click", startGame);
}

function movePlayer(event) {
  if (!gameRunning) return;

  const rect = canvas.getBoundingClientRect();

  const scaleX = GAME_WIDTH / rect.width;
  const scaleY = GAME_HEIGHT / rect.height;

  player.x = (event.clientX - rect.left) * scaleX;
  player.y = (event.clientY - rect.top) * scaleY;

  player.x = Math.max(18, Math.min(GAME_WIDTH - 18, player.x));
  player.y = Math.max(20, Math.min(GAME_HEIGHT - 20, player.y));
}

canvas.addEventListener("pointermove", movePlayer);

document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("restartGame").addEventListener("click", startGame);

createStars();
drawGame();

// ==========================================
// EXPERIÊNCIA 02 - ROLETA CRIATIVA
// ==========================================

const wheel = document.getElementById("wheel");
const spinButton = document.getElementById("spinButton");

const resultEmoji = document.getElementById("resultEmoji");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");

const ideas = [
  {
    title: "Desenhe um personagem",
    emoji: "🎨",
    description: "Crie um personagem com aparência, nome e personalidade próprios."
  },
  {
    title: "Crie uma história",
    emoji: "📖",
    description: "Imagine uma aventura com começo, meio e fim."
  },
  {
    title: "Invente um jogo",
    emoji: "🎮",
    description: "Pense em um objetivo, regras e um jeito de ganhar pontos."
  },
  {
    title: "Faça uma animação",
    emoji: "🎬",
    description: "Dê vida a um personagem usando movimentos e mudanças de cenário."
  },
  {
    title: "Desenhe um planeta",
    emoji: "🪐",
    description: "Imagine um planeta diferente, com cores e habitantes especiais."
  },
  {
    title: "Crie um robô",
    emoji: "🤖",
    description: "Invente um robô e escolha quais tarefas ele consegue realizar."
  },
  {
    title: "Invente um desafio",
    emoji: "💡",
    description: "Crie uma missão divertida com regras e pontuação."
  },
  {
    title: "Desenhe um animal",
    emoji: "🦊",
    description: "Crie um animal imaginário e invente suas habilidades."
  }
];

let wheelRotation = 0;
let spinning = false;

spinButton.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;
  spinButton.disabled = true;
  spinButton.textContent = "Girando...";

  const selectedIndex = Math.floor(Math.random() * ideas.length);
  const selectedIdea = ideas[selectedIndex];

  const segmentSize = 360 / ideas.length;
  const centerAngle = selectedIndex * segmentSize + segmentSize / 2;
  const currentAngle = ((wheelRotation % 360) + 360) % 360;

  const neededAngle = (360 - centerAngle - currentAngle + 360) % 360;

  wheelRotation += 360 * 5 + neededAngle;
  wheel.style.transform = `rotate(${wheelRotation}deg)`;

  setTimeout(() => {
    resultEmoji.textContent = selectedIdea.emoji;
    resultTitle.textContent = selectedIdea.title;
    resultDescription.textContent = selectedIdea.description;

    spinButton.disabled = false;
    spinButton.textContent = "Girar novamente";
    spinning = false;
  }, 4100);
});

// ==========================================
// EXPERIÊNCIA 03 - HISTÓRIA ANIMADA
// ==========================================

const characterSelect = document.getElementById("characterSelect");
const storyCharacter = document.getElementById("storyCharacter");
const speech = document.getElementById("speech");
const storyCaption = document.getElementById("storyCaption");
const storyStep = document.getElementById("storyStep");

const characterEmojis = {
  robot: "🤖",
  cat: "🐱",
  alien: "👽",
  ghost: "👻"
};

const scenes = [
  {
    label: "CENA 01 · A NOITE CHEGOU",
    speech: "Parece que está tudo quieto por aqui...",
    caption: "A casa ficou em silêncio. A aventura está prestes a começar.",
    position: "47%"
  },
  {
    label: "CENA 02 · O PRIMEIRO MOVIMENTO",
    speech: "Ufa! Finalmente posso sair do lugar!",
    caption: "Quando ninguém está olhando, os objetos começam a se movimentar.",
    position: "35%"
  },
  {
    label: "CENA 03 · UMA GRANDE IDEIA",
    speech: "E se a gente explorasse esse lugar?",
    caption: "O personagem percebe que existe um mundo inteiro para descobrir.",
    position: "64%"
  },
  {
    label: "CENA 04 · A DESCOBERTA",
    speech: "Uau! Essa noite foi incrível!",
    caption: "A aventura termina, mas amanhã pode começar outra.",
    position: "50%"
  }
];

let currentScene = 0;
let storyStarted = false;

function updateCharacter() {
  storyCharacter.textContent = characterEmojis[characterSelect.value];
}

function showScene(index) {
  const scene = scenes[index];

  storyCharacter.classList.remove("animated");

  // Reinicia a animação CSS
  void storyCharacter.offsetWidth;

  storyCharacter.style.left = scene.position;
  storyCharacter.classList.add("animated");

  speech.textContent = scene.speech;
  storyCaption.textContent = scene.caption;
  storyStep.textContent = scene.label;
}

function startStory() {
  currentScene = 0;
  storyStarted = true;

  updateCharacter();
  showScene(currentScene);

  document.getElementById("nextScene").textContent = "Próxima cena →";
}

function nextScene() {
  if (!storyStarted) {
    startStory();
    return;
  }

  if (currentScene < scenes.length - 1) {
    currentScene++;
    showScene(currentScene);
  } else {
    currentScene = 0;
    showScene(currentScene);
  }
}

document.getElementById("playStory").addEventListener("click", startStory);
document.getElementById("nextScene").addEventListener("click", nextScene);

characterSelect.addEventListener("change", updateCharacter);

// Cena inicial
updateCharacter();
showScene(0);
