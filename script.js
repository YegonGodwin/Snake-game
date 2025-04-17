const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;
let snake = [{ x: 9 * box, y: 10 * box }];
let direction = null;
let food = randomPosition();
let foodDir = randomFoodDirection();
let foodMoveCounter = 0;
let score = 0;
let gameInterval;

// Explosion effect variables
let explosion = null;

function randomPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / box)) * box,
        y: Math.floor(Math.random() * (canvas.height / box)) * box,
    };
}

function randomFoodDirection() {
    // Choose random direction: left, right, up, down
    const dirs = [
        {x: -1, y: 0},
        {x: 1, y: 0},
        {x: 0, y: -1},
        {x: 0, y: 1}
    ];
    return dirs[Math.floor(Math.random() * dirs.length)];
}

function moveFood() {
    // Only move every 5 snake updates
    foodMoveCounter = (foodMoveCounter + 1) % 5;
    if (foodMoveCounter !== 0) return;
    let newFood = {
        x: food.x + foodDir.x * box,
        y: food.y + foodDir.y * box
    };
    // Bounce off walls
    if (newFood.x < 0 || newFood.x >= canvas.width || newFood.y < 0 || newFood.y >= canvas.height) {
        foodDir = randomFoodDirection();
        return;
    }
    // Don't move onto the snake
    for (let segment of snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
            foodDir = randomFoodDirection();
            return;
        }
    }
    food = newFood;
    // Occasionally change direction
    if (Math.random() < 0.18) {
        foodDir = randomFoodDirection();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#4caf50' : '#8bc34a';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = '#222';
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }
    // Draw food as apple emoji
    ctx.font = `${box * 0.9}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🍎', food.x, food.y);
}

function update() {
    let head = { ...snake[0] };
    switch (direction) {
        case 'LEFT': head.x -= box; break;
        case 'UP': head.y -= box; break;
        case 'RIGHT': head.x += box; break;
        case 'DOWN': head.y += box; break;
        default: return;
    }
    // Check collision with wall
    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height
    ) {
        gameOver();
        return;
    }
    // Check collision with self
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    // Check food
    if (head.x === food.x && head.y === food.y) {
        snake.unshift(head);
        score++;
        document.getElementById('score').textContent = 'Score: ' + score;
        // Trigger explosion at food
        startExplosion(food.x + box / 2, food.y + box / 2);
        food = randomPosition();
        foodDir = randomFoodDirection();
        changeBackgroundColor();
    } else {
        snake.pop();
        snake.unshift(head);
    }
    moveFood();
    draw();
    if (explosion) {
        drawExplosion();
    }
}

function gameOver() {
    clearInterval(gameInterval);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowLeft':
            if (direction !== 'RIGHT') direction = 'LEFT';
            break;
        case 'ArrowUp':
            if (direction !== 'DOWN') direction = 'UP';
            break;
        case 'ArrowRight':
            if (direction !== 'LEFT') direction = 'RIGHT';
            break;
        case 'ArrowDown':
            if (direction !== 'UP') direction = 'DOWN';
            break;
    }
});

function changeBackgroundColor() {
    // Generate a random color in hex format
    const color = `hsl(${Math.floor(Math.random() * 360)}, 60%, 18%)`;
    document.body.style.background = color;
}

function startExplosion(x, y) {
    // Create particles radiating out from (x, y)
    const particles = [];
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = Math.random() * 2 + 2;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 2,
            color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
            alpha: 1
        });
    }
    explosion = { particles, frame: 0 };
}

function drawExplosion() {
    if (!explosion) return;
    explosion.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
        // Update particle
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        p.radius *= 0.96;
    });
    explosion.frame++;
    // Remove dead particles
    explosion.particles = explosion.particles.filter(p => p.alpha > 0.05 && p.radius > 0.5);
    if (explosion.particles.length === 0 || explosion.frame > 20) {
        explosion = null;
    }
}

draw();
direction = 'RIGHT';
gameInterval = setInterval(update, 120);
