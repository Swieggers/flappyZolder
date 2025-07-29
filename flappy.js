// Flappy Zolder - Basic Flappy Bird-like Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const characterSelectDiv = document.getElementById('character-select');
// Removed dropdown logic, using grid only
const startBtn = document.getElementById('start-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardList = document.getElementById('leaderboard-list');
const finalScoreDiv = document.getElementById('final-score');
const highscoreForm = document.getElementById('highscore-form');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');

let selectedCharacter = 'yellow';

// Image assets for all characters
const characterImages = {};

// Preload base pipes
const basePipeUpImg = new Image();
basePipeUpImg.src = 'pipes/pipeUp.png';
const basePipeDownImg = new Image();
basePipeDownImg.src = 'pipes/pipeDown.png';

function loadCharacterImages(character) {
    if (!character || characterImages[character]) return;
    const birdImg = new Image();
    birdImg.src = `character_styles/${character}/bird.png`;
    // Try to load custom pipe, but don't require it
    const pipeImg = new Image();
    pipeImg.src = `character_styles/${character}/pipe.png`;
    characterImages[character] = { bird: birdImg, pipe: pipeImg };
}
let gameStarted = false;

// Game constants
const GRAVITY = 0.5;
const FLAP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const BIRD_SIZE = 40;
const LEADERBOARD_KEY = 'flappyzolder_leaderboard';

// Game state

let birdY = canvas.height / 2;
let birdVelocity = 0;
let pipes = [];
let score = 0;
let gameOver = false;
let highScore = 0;



const PIPE_MIN_HEIGHT = 60; // Minimum height for top and bottom pipe
const MAX_SCORE = 300;

// Randomize the center of the gap, then calculate top and bottom pipe heights
function getRandomPipeHeight() {
    const gapCenterMin = PIPE_GAP / 2 + PIPE_MIN_HEIGHT;
    const gapCenterMax = canvas.height - PIPE_GAP / 2 - PIPE_MIN_HEIGHT;
    const gapCenter = Math.random() * (gapCenterMax - gapCenterMin) + gapCenterMin;
    // Top pipe height
    return gapCenter - PIPE_GAP / 2;
}

function resetGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    const PIPE_SPACING = 200;
    for (let i = 0; i < 3; i++) {
        pipes.push({
            x: canvas.width + i * PIPE_SPACING,
            height: getRandomPipeHeight()
        });
    }
}

function drawBird() {
    const imgs = characterImages[selectedCharacter];
    if (imgs && imgs.bird && imgs.bird.complete && imgs.bird.naturalWidth > 0) {
        ctx.drawImage(imgs.bird, 80 - BIRD_SIZE / 2, birdY - BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    } else {
        // Fallback: colored circle
        let idx = characterList.indexOf(selectedCharacter);
        let color = idx >= 0 ? characterColors[idx % characterColors.length] : '#ffeb3b';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(80, birdY, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawPipes() {
    const imgs = characterImages[selectedCharacter];
    const hasCustomPipe = imgs && imgs.pipe && imgs.pipe.complete && imgs.pipe.naturalWidth > 0;
    pipes.forEach(pipe => {
        if (hasCustomPipe) {
            // Top pipe (flipped vertically)
            ctx.save();
            ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.height / 2);
            ctx.scale(1, -1);
            ctx.drawImage(imgs.pipe, -PIPE_WIDTH / 2, -pipe.height / 2, PIPE_WIDTH, pipe.height);
            ctx.restore();
            // Bottom pipe
            ctx.drawImage(imgs.pipe, pipe.x, pipe.height + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.height - PIPE_GAP);
        } else if (basePipeUpImg.complete && basePipeUpImg.naturalWidth > 0 && basePipeDownImg.complete && basePipeDownImg.naturalWidth > 0) {
            // Use base pipes from pipes folder
            // Top pipe (pipeDown, flipped vertically)
            ctx.save();
            ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.height / 2);
            ctx.scale(1, -1);
            ctx.drawImage(basePipeDownImg, -PIPE_WIDTH / 2, -pipe.height / 2, PIPE_WIDTH, pipe.height);
            ctx.restore();
            // Bottom pipe (pipeUp)
            ctx.drawImage(basePipeUpImg, pipe.x, pipe.height + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.height - PIPE_GAP);
        } else {
            // Fallback: colored rectangles
            let idx = characterList.indexOf(selectedCharacter);
            let pipeColor = idx >= 0 ? characterColors[(idx + 7) % characterColors.length] : '#388e3c';
            ctx.fillStyle = pipeColor;
            // Top pipe
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.height);
            // Bottom pipe
            ctx.fillRect(pipe.x, pipe.height + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.height - PIPE_GAP);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPipes();
    drawBird();
}
 
function update() {
    if (gameOver) return;
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    // Move pipes
    pipes.forEach(pipe => {
        pipe.x -= 2;
    });

    // Add new pipe and remove old
    if (pipes[0].x + PIPE_WIDTH < 0) {
        pipes.shift();
        // Place new pipe after the last pipe, keeping spacing consistent
        const lastPipe = pipes[pipes.length - 1];
        const PIPE_SPACING = 200;
        pipes.push({
            x: lastPipe.x + PIPE_SPACING,
            height: getRandomPipeHeight()
        });
        score++;
        if (score >= MAX_SCORE) {
            gameOver = true;
        }
    }

    // Collision detection
    pipes.forEach(pipe => {
        if (
            80 + BIRD_SIZE / 2 > pipe.x &&
            80 - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH &&
            (birdY - BIRD_SIZE / 2 < pipe.height || birdY + BIRD_SIZE / 2 > pipe.height + PIPE_GAP)
        ) {
            gameOver = true;
        }
    });
    // Ground/ceiling collision
    if (birdY + BIRD_SIZE / 2 > canvas.height || birdY - BIRD_SIZE / 2 < 0) {
        gameOver = true;
    }
}


function showLeaderboard(isHighScore) {
    // Get leaderboard from localStorage
    let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    // Sort descending
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboardList.innerHTML = '';
    leaderboard.slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        leaderboardList.appendChild(li);
    });
    finalScoreDiv.textContent = `Your Score: ${score}`;
    highscoreForm.style.display = isHighScore ? 'block' : 'none';
    leaderboardModal.style.display = 'flex';
    playerNameInput.value = '';
    playerNameInput.focus();
}

function hideLeaderboard() {
    leaderboardModal.style.display = 'none';
    renderCharacterGrid();
    characterSelectDiv.style.display = 'block';
    canvas.style.display = 'none';
    gameStarted = false;
}

function saveHighScore() {
    let name = playerNameInput.value.trim() || 'Anonymous';
    let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    leaderboard.push({ name, score });
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    showLeaderboard(false);
}

function gameLoop() {
    update();
    draw();
    scoreDiv.textContent = gameOver ? '' : `Score: ${score}`;
    if (gameOver) {
        // Check if high score
        let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
        let isHighScore = leaderboard.length < 10 || score > Math.min(...leaderboard.map(e => e.score));
        showLeaderboard(isHighScore && score > 0);
        return;
    }
    requestAnimationFrame(gameLoop);
}


// Character grid setup
const characterGrid = document.getElementById('character-grid');

const characterList = [
    'Sam','Sara','PH','Assie','Barend','Carlijn','Daniel','David','Elke','Frans','Vief','Jorik','Siebe','Jeroen','Isa','Laure','Sebas','Megan','Leah','Sil','Janne','Hannah','Robin','Lars','Sanne','Klara','Martin','Joel'
];
// 28 visually distinct colors
const characterColors = [
    '#ffb300','#e53935','#1e88e5','#43a047','#8e24aa','#f4511e','#00acc1','#c0ca33',
    '#6d4c41','#d81b60','#3949ab','#00897b','#fbc02d','#5e35b1','#039be5','#7cb342',
    '#f06292','#ffa726','#8d6e63','#00bcd4','#c62828','#9ccc65','#ff7043','#ab47bc',
    '#26a69a','#ec407a','#bdbdbd','#789262'
];


// Render character grid
function renderCharacterGrid() {
    characterGrid.innerHTML = '';
    // Only reset button and selection on initial render or after game over
    startBtn.disabled = true;
    selectedCharacter = null;
    characterList.forEach((name, idx) => {
        const div = document.createElement('div');
        div.className = 'character-option';
        div.style.background = characterColors[idx % characterColors.length];
        div.textContent = name; // Show full name
        div.title = name;
        div.dataset.character = name;
        div.addEventListener('click', function() {
            document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selectedCharacter = name;
            startBtn.disabled = false;
        });
        characterGrid.appendChild(div);
    });
}
renderCharacterGrid();

startBtn.addEventListener('click', function() {
    if (!selectedCharacter) return;
    loadCharacterImages(selectedCharacter);
    characterSelectDiv.style.display = 'none';
    canvas.style.display = 'block';
    scoreDiv.textContent = '';
    resetGame();
    gameStarted = false; // Wait for first spacebar to start
});

// Only allow game to start or restart when leaderboard is not open
document.addEventListener('keydown', function(e) {
    // If leaderboard is open, ignore all keys
    if (leaderboardModal.style.display === 'flex') return;
    if (!gameStarted) {
        if (e.code === 'Space' || e.key === ' ') {
            gameStarted = true;
            gameLoop();
        }
        return;
    }
    if (e.code === 'Space' || e.key === ' ' ) {
        if (gameOver) {
            // Only allow restart if leaderboard is closed
            if (leaderboardModal.style.display !== 'flex') {
                hideLeaderboard();
                resetGame();
                gameStarted = false;
            }
        } else {
            birdVelocity = FLAP;
        }
    }
});


saveScoreBtn.addEventListener('click', function() {
    saveHighScore();
});

// --- Mobile/touch support ---
// Flap or start game on tap/touch on the canvas
canvas.addEventListener('touchstart', function(e) {
    // Prevent scrolling on mobile
    e.preventDefault();
    // If leaderboard is open, ignore
    if (leaderboardModal.style.display === 'flex') return;
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
        return;
    }
    if (gameOver) {
        // Only allow restart if leaderboard is closed
        if (leaderboardModal.style.display !== 'flex') {
            hideLeaderboard();
            resetGame();
            gameStarted = false;
        }
    } else {
        birdVelocity = FLAP;
    }
}, { passive: false });

closeLeaderboardBtn.addEventListener('click', function() {
    hideLeaderboard();
    if (gameStarted) {
        resetGame();
        gameLoop();
    }
});
