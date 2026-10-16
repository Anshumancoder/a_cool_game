const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 450
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT

// audio of game
let audioCtx = null

function initAudio() {

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }

}



function playSound(type) {

    if (!audioCtx || !soundEnabled) return

    try {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()

        osc.connect(gain)
        gain.connect(audioCtx.destination)

        const now = audioCtx.currentTime

        if (type === 'shoot') {

            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(400, now)
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1)
            gain.gain.setValueAtTime(0.2, now)
            gain.gain.linearRampToValueAtTime(0, now + 0.1)
            osc.start(now)
            osc.stop(now + 0.1)

        } else if (type === 'explosion') {
            osc.type = 'square'
            osc.frequency.setValueAtTime(120, now)
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.25)
            gain.gain.setValueAtTime(0.4, now)
            gain.gain.linearRampToValueAtTime(0, now + 0.25)
            osc.start(now)
            osc.stop(now + 0.25)

        } else if (type === 'powerup') {
            osc.type = 'sine'
            osc.frequency.setValueAtTime(300, now)
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2)
            gain.gain.setValueAtTime(0.3, now)
            gain.gain.linearRampToValueAtTime(0, now + 0.2)
            osc.start(now)
            osc.stop(now + 0.2)

        } else if (type === 'hit') {
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(150, now)
            osc.frequency.linearRampToValueAtTime(50, now + 0.08)
            gain.gain.setValueAtTime(0.3, now)
            gain.gain.linearRampToValueAtTime(0, now + 0.08)
            osc.start(now)
            osc.stop(now + 0.08)
        }

    } catch (e) {}

}


let gameState = 'START'
let score = 0
let lives = 3
let cameraX = 0
let levelWidth = 3500
let keys = {}
let soundEnabled = true



const player = {
    x: 100,
    y: 300,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: -11,
    grounded: false,
    facing: 'right',
    aimAngle: 0, 
    weapon: 'NORMAL', 
    invulnerable: 0,
    shootCooldown: 0
};


// entities
let platforms = []
let bullets = []
let enemyBullets = []
let enemies = []
let pods = []
let particles = []
let boss = null


// controls
window.addEventListener('keydown', e => {
    keys[e.key] = true
    initAudio()
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});


// for mobile ppl
document.querySelectorAll('.control-btn').forEach(btn => {

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault()
        initAudio()
        const key = btn.getAttribute('data-key')
        if (key) keys[key] = true
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault()
        const key = btn.getAttribute('data-key')
        if (key) keys[key] = false
    })

})




function initLevel() {
    score = 0
    lives = 3
    cameraX = 0
    bullets = []
    enemyBullets = []
    enemies = []
    pods = []
    particles = []
    boss = null

    player.x = 100
    player.y = 200
    player.vx = 0
    player.vy = 0
    player.weapon = 'NORMAL'
    player.invulnerable = 0



    platforms = [

        { x: 0, y: 380, w: 800, h: 70 },
        { x: 250, y: 290, w: 140, h: 20 },
        { x: 450, y: 220, w: 140, h: 20 },
        { x: 900, y: 380, w: 600, h: 70 },
        { x: 1050, y: 280, w: 160, h: 20 },
        { x: 1300, y: 210, w: 140, h: 20 },
        { x: 1600, y: 380, w: 700, h: 70 },
        { x: 1750, y: 290, w: 150, h: 20 },
        { x: 2000, y: 220, w: 180, h: 20 },
        { x: 2400, y: 380, w: 1100, h: 70 },
        { x: 2600, y: 280, w: 200, h: 20 },
        { x: 2900, y: 200, w: 200, h: 20 }

    ]



    enemies = [

        { type: 'orc', x: 500, y: 340, w: 24, h: 32, vx: -1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
        { type: 'orc', x: 1100, y: 340, w: 24, h: 32, vx: -1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
        { type: 'gargoyle', x: 700, y: 150, w: 28, h: 28, vx: 1, vy: 0, hp: 1, maxHp: 1, shootTimer: 0, startY: 150 },
        { type: 'gargoyle', x: 1400, y: 120, w: 28, h: 28, vx: -1, vy: 0, hp: 1, maxHp: 1, shootTimer: 0, startY: 120 },
        { type: 'archer', x: 1120, y: 240, w: 22, h: 32, vx: 0, vy: 0, hp: 3, maxHp: 3, shootTimer: 60 },
        { type: 'archer', x: 1800, y: 250, w: 22, h: 32, vx: 0, vy: 0, hp: 3, maxHp: 3, shootTimer: 60 },
        { type: 'orc', x: 1700, y: 340, w: 24, h: 32, vx: -1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
        { type: 'orc', x: 2100, y: 340, w: 24, h: 32, vx: -1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
        { type: 'gargoyle', x: 2050, y: 140, w: 28, h: 28, vx: 1, vy: 0, hp: 1, maxHp: 1, shootTimer: 0, startY: 140 },

    ]



    pods = [

        { x: 480, y: 160, w: 24, h: 24, type: 'SPREAD', floatOffset: 0 },
        { x: 1350, y: 150, w: 24, h: 24, type: 'FIRE', floatOffset: 2 },
        { x: 2050, y: 160, w: 24, h: 24, type: 'LIGHTNING', floatOffset: 4 }

    ]
}



function startGame() {

    initAudio()
    initLevel()
    gameState = 'PLAYING'
    document.getElementById('mainMenu').classList.add('hidden')
    document.getElementById('gameOverMenu').classList.add('hidden')
    document.getElementById('victoryMenu').classList.add('hidden')
    document.getElementById('pauseMenu').classList.add('hidden')
    document.getElementById('hud').classList.remove('hidden')
    document.getElementById('bossHud').classList.add('hidden')
    updateHUD()

}



function restartGame() {

    startGame();

}


function togglePause() {
    const pauseMenu = document.getElementById('pauseMenu')

    if (gameState === 'PLAYING') {
        gameState = 'PAUSED'
        pauseMenu.classList.remove('hidden')
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING'
        pauseMenu.classList.add('hidden')
    }
}


function updateHUD() {

    document.getElementById('scoreText').innerText = String(score).padStart(6, '0')
    document.getElementById('livesText').innerText = lives
    document.getElementById('weaponBadge').innerText = player.weapon

}



function addExplosion(x, y, color, count = 12) {

    for (let i = 0; i < count; i++) {

        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 4 + 1

        particles.push({

            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 20 + Math.random() * 15,
            color: color,
            size: Math.random() * 4 + 2

        })

    }

}




function fireWeapon() {

    if (player.shootCooldown > 0) return

    playSound('shoot')

    let angle = 0

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {

        angle = -Math.PI / 2
        if (keys['ArrowRight'] || keys['d'] || keys['D']) angle = -Math.PI / 4
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) angle = -3 * Math.PI / 4

    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {

        if (!player.grounded) {

            angle = Math.PI / 2
            if (keys['ArrowRight'] || keys['d'] || keys['D']) angle = Math.PI / 4
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) angle = 3 * Math.PI / 4

        } else {
            angle = player.facing === 'right' ? 0 : Math.PI
        }

    } else {
        angle = player.facing === 'right' ? 0 : Math.PI
    }

    const startX = player.x + player.w / 2
    const startY = player.y + player.h / 2


    if (player.weapon === 'NORMAL') {

        bullets.push({

            x: startX, y: startY,
            vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
            type: 'NORMAL', damage: 1, color: '#fef08a'
            
        })
        player.shootCooldown = 12

    } else if (player.weapon === 'SPREAD') {
        const spreadAngles = [angle - 0.25, angle, angle + 0.25]
        spreadAngles.forEach(a => {

            bullets.push({
                x: startX, y: startY,
                vx: Math.cos(a) * 9, vy: Math.sin(a) * 9,
                type: 'SPREAD', damage: 1, color: '#38bdf8'

            })
        })

        player.shootCooldown = 16

    } else if (player.weapon === 'LIGHTNING') {

        bullets.push({

            x: startX, y: startY,
            vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14,
            type: 'LIGHTNING', damage: 2, color: '#e0e7ff'

        })

        player.shootCooldown = 8;

    } else if (player.weapon === 'FIRE') {

        bullets.push({

            x: startX, y: startY,
            vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7,
            type: 'FIRE', damage: 1.5, color: '#f97316'

        })

        player.shootCooldown = 10;
    }
}



function spawnBoss() {

    boss = {
        x: 3000,
        y: 180,
        w: 90,
        h: 110,
        hp: 40,
        maxHp: 40,
        state: 'IDLE',
        timer: 0,
        vy: 0
    }

    document.getElementById('bossHud').classList.remove('hidden')
    document.getElementById('bossHealthBar').style.width = '100%'

}


function update() {

    if (gameState !== 'PLAYING') return

    //movements 
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.vx = player.speed
        player.facing = 'right'

    } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.vx = -player.speed
        player.facing = 'left'

    } else {
        player.vx = 0
    }

    
    if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && player.grounded) {
        player.vy = player.jumpPower
        player.grounded = false
    }


    if (keys['j'] || keys['J'] || keys['x'] || keys['X'] || keys['Control'] || keys['l'] || keys['L']) {
        fireWeapon()
    }


    if (player.shootCooldown > 0) player.shootCooldown--
    if (player.invulnerable > 0) player.invulnerable--



    player.vy += 0.55
    player.x += player.vx
    player.y += player.vy

    
    if (player.x < 0) player.x = 0
    if (player.x > levelWidth - player.w) player.x = levelWidth - player.w

    

    player.grounded = false
    platforms.forEach(p => {

        if (player.x + player.w > p.x && player.x < p.x + p.w &&
            player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + player.vy) {

            if (player.vy >= 0) {
                player.grounded = true
                player.vy = 0
                player.y = p.y - player.h
            }

        }

    });

    

    if (player.y > CANVAS_HEIGHT + 50) {
        hurtPlayer()
    }

    

    if (player.x - cameraX > CANVAS_WIDTH * 0.5 && cameraX < levelWidth - CANVAS_WIDTH) {
        cameraX = player.x - CANVAS_WIDTH * 0.5

    } else if (player.x - cameraX < CANVAS_WIDTH * 0.25 && cameraX > 0) {
        cameraX = player.x - CANVAS_WIDTH * 0.25
    }

    

    if (player.x > 2600 && !boss) {
        spawnBoss()
    }



    bullets.forEach((b, idx) => {
        b.x += b.vx
        b.y += b.vy


        if (b.x < cameraX - 50 || b.x > cameraX + CANVAS_WIDTH + 50 ||
            b.y < -50 || b.y > CANVAS_HEIGHT + 50) {
            bullets.splice(idx, 1)
            return
        }

        
        enemies.forEach((e, eIdx) => {
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {

                e.hp -= b.damage
                addExplosion(b.x, b.y, '#fef08a', 4)
                bullets.splice(idx, 1)
                playSound('hit')


                if (e.hp <= 0) {
                    addExplosion(e.x + e.w/2, e.y + e.h/2, '#ef4444', 15)
                    enemies.splice(eIdx, 1)
                    score += 100
                    playSound('explosion')
                    updateHUD()

                }
            }
        })



        if (boss && b.x > boss.x && b.x < boss.x + boss.w && b.y > boss.y && b.y < boss.y + boss.h) {
            boss.hp -= b.damage
            addExplosion(b.x, b.y, '#dc2626', 6)
            bullets.splice(idx, 1)
            playSound('hit')


            let hpPercent = Math.max(0, (boss.hp / boss.maxHp) * 100)
            document.getElementById('bossHealthBar').style.width = hpPercent + '%'


            if (boss.hp <= 0) {

                addExplosion(boss.x + boss.w/2, boss.y + boss.h/2, '#facc15', 40)
                playSound('explosion')
                boss = null
                score += 2000
                updateHUD()

                setTimeout(() => {
                    gameState = 'VICTORY'
                    document.getElementById('victoryMenu').classList.remove('hidden')
                }, 1000)

            }
        }
    })



    enemyBullets.forEach((eb, idx) => {
        eb.x += eb.vx
        eb.y += eb.vy


        if (eb.x < cameraX - 50 || eb.x > cameraX + CANVAS_WIDTH + 50) {
            enemyBullets.splice(idx, 1)
            return
        }

        
        if (eb.x > player.x && eb.x < player.x + player.w &&
            eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(idx, 1)
            hurtPlayer()
        }

    })


    
    enemies.forEach(e => {

        if (e.type === 'orc') {
            e.x += e.vx

            if (e.x < 100 || e.x > levelWidth - 100) e.vx *= -1
        } else if (e.type === 'gargoyle') {
            e.x += e.vx
            e.y = e.startY + Math.sin(Date.now() * 0.005) * 30

            if (Math.abs(e.x - player.x) < 400 && Math.random() < 0.008) {
                enemyBullets.push({
                    x: e.x + e.w/2, y: e.y + e.h,
                    vx: 0, vy: 4, color: '#dc2626'
                })
            }

        } else if (e.type === 'archer') {
            e.shootTimer--

            if (e.shootTimer <= 0 && Math.abs(e.x - player.x) < 450) {
                let dir = player.x < e.x ? -1 : 1

                enemyBullets.push({
                    x: e.x + (dir === 1 ? e.w : 0), y: e.y + 10,
                    vx: dir * 5, vy: -1, color: '#f59e0b'
                })
                e.shootTimer = 90

            }

        }

        
        if (player.x + player.w > e.x && player.x < e.x + e.w &&
            player.y + player.h > e.y && player.y < e.y + e.h) {
            hurtPlayer()
        }

    })


    pods.forEach((pod, pIdx) => {

        pod.floatOffset += 0.05
        let podDrawY = pod.y + Math.sin(pod.floatOffset) * 6

        if (player.x + player.w > pod.x && player.x < pod.x + pod.w &&
            player.y + player.h > podDrawY && player.y < podDrawY + pod.h) {

            player.weapon = pod.type
            playSound('powerup')
            addExplosion(pod.x, pod.y, '#f59e0b', 12)
            pods.splice(pIdx, 1)
            updateHUD()

        }

    })



    if (boss) {

        boss.timer++;
        if (boss.timer % 120 === 0) {
            let dx = (player.x + player.w/2) - (boss.x + boss.w/2)
            let dy = (player.y + player.h/2) - (boss.y + boss.h/2)
            let dist = Math.sqrt(dx*dx + dy*dy)

            for (let a = -0.3; a <= 0.3; a += 0.3) {

                enemyBullets.push({
                    x: boss.x + boss.w/2,
                    y: boss.y + boss.h/2,
                    vx: (dx / dist) * 5 + a * 2,
                    vy: (dy / dist) * 5,
                    color: '#ef4444'
                })

            }

        }



        if (player.x + player.w > boss.x && player.x < boss.x + boss.w &&
            player.y + player.h > boss.y && player.y < boss.y + boss.h) {
            hurtPlayer()
        }
    }




    particles.forEach((pt, idx) => {

        pt.x += pt.vx
        pt.y += pt.vy
        pt.life--
        if (pt.life <= 0) particles.splice(idx, 1)

    })

}




function hurtPlayer() {

    if (player.invulnerable > 0) return

    lives--
    playSound('hit')
    updateHUD()

    if (lives <= 0) {
        gameState = 'GAMEOVER'
        document.getElementById('gameOverMenu').classList.remove('hidden')

    } else {

        player.invulnerable = 1200; 
        player.x = Math.max(100, cameraX + 50)
        player.y = 100
        player.vx = 0
        player.vy = 0

    }

}




function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)



    let skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    skyGrad.addColorStop(0, '#1a1c2e')
    skyGrad.addColorStop(0.5, '#382b47')
    skyGrad.addColorStop(1, '#5c3d46')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)


    ctx.fillStyle = '#11131f'
    let castleX = (CANVAS_WIDTH * 0.7) - (cameraX * 0.1) % 500
    ctx.fillRect(castleX, 200, 80, 200)
    ctx.fillRect(castleX - 30, 250, 40, 150)
    ctx.fillRect(castleX + 70, 230, 40, 170)
    ctx.beginPath()
    ctx.moveTo(castleX - 35, 250); ctx.lineTo(castleX - 10, 200); ctx.lineTo(castleX + 15, 250)
    ctx.moveTo(castleX - 5, 200); ctx.lineTo(castleX + 40, 140); ctx.lineTo(castleX + 85, 200)
    ctx.moveTo(castleX + 65, 230); ctx.lineTo(castleX + 90, 180); ctx.lineTo(castleX + 115, 230)
    ctx.fill()


    
    ctx.fillStyle = '#22253b'
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT)
    
    for (let i = 0; i <= CANVAS_WIDTH + 100; i += 100) {
        let archX = i - (cameraX * 0.2) % 100
        let archY = 300 + Math.sin(i + 1) * 35
        ctx.lineTo(archX, archY)
    }

    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fill()

    
    ctx.fillStyle = '#1b3b2b'
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT)


    for (let i = 0; i <= CANVAS_WIDTH + 80; i += 80) {

        let hillX = i - (cameraX * 0.4) % 80
        let hillY = 370 + Math.sin(i * 0.05) * 20
        ctx.lineTo(hillX, hillY)
        
    }

    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fill();

    

    platforms.forEach(p => {

        let drawX = p.x - cameraX
        if (drawX + p.w < -50 || drawX > CANVAS_WIDTH + 50) return

        ctx.fillStyle = '#2d241e'
        ctx.fillRect(drawX, p.y, p.w, p.h)
        ctx.strokeStyle = '#43362d'
        ctx.lineWidth = 2
        ctx.strokeRect(drawX, p.y, p.w, p.h)


        ctx.fillStyle = '#38a169'
        ctx.fillRect(drawX - 2, p.y - 2, p.w + 4, 6)
        ctx.fillStyle = '#2f855a'

        for (let ix = drawX + 4; ix < drawX + p.w - 4; ix += 12) {
            ctx.fillRect(ix, p.y + 4, 4, 5);
        }

    })

    


    pods.forEach(pod => {

        let drawX = pod.x - cameraX
        let podDrawY = pod.y + Math.sin(pod.floatOffset) * 6

        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(drawX + pod.w/2, podDrawY + pod.h/2, 12, 0, Math.PI*2)
        ctx.fill()
        ctx.fillStyle = '#fef08a'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(pod.type[0], drawX + pod.w/2, podDrawY + pod.h/2 + 4)

    })


    if (gameState === 'PLAYING' || gameState === 'VICTORY') {

        let drawX = player.x - cameraX
        ctx.save()
        ctx.translate(drawX + player.w / 2, player.y + player.h / 2)
        if (player.facing === 'left') ctx.scale(-1, 1)


        if (player.invulnerable % 4 < 2) {

            ctx.fillStyle = '#94a3b8'
            ctx.fillRect(-10, -10, 20, 26)
            ctx.fillStyle = '#cbd5e1'
            ctx.fillRect(-8, -24, 16, 14)
            ctx.fillStyle = '#f59e0b'
            ctx.fillRect(0, -20, 6, 4)
            ctx.fillStyle = '#dc2626'
            ctx.beginPath()
            ctx.moveTo(-8, -10)
            ctx.lineTo(-18, 12 + Math.sin(Date.now() * 0.01) * 3)
            ctx.lineTo(-4, 10)
            ctx.fill()
            ctx.fillStyle = '#78350f'
            ctx.fillRect(2, -4, 16, 4)
            ctx.fillStyle = '#f59e0b'
            ctx.fillRect(14, -7, 3, 10)

        }

        ctx.restore();
    }

    


    enemies.forEach(e => {

        let drawX = e.x - cameraX
        if (drawX + e.w < -50 || drawX > CANVAS_WIDTH + 50) return

        ctx.save()
        ctx.translate(drawX + e.w / 2, e.y + e.h / 2)


        if (e.type === 'orc') {
            ctx.fillStyle = '#15803d'
            ctx.fillRect(-12, -15, 24, 30)
            ctx.fillStyle = '#ef4444'
            ctx.fillRect(2, -10, 4, 4)

        } else if (e.type === 'gargoyle') {
            ctx.fillStyle = '#64748b'
            ctx.fillRect(-12, -12, 24, 24)
            ctx.fillStyle = '#475569'
            ctx.beginPath()
            ctx.moveTo(-10, -10); ctx.lineTo(-24, -18); ctx.lineTo(-12, 5)
            ctx.moveTo(10, -10); ctx.lineTo(24, -18); ctx.lineTo(12, 5)
            ctx.fill()

        } else if (e.type === 'archer') {
            ctx.fillStyle = '#e2e8f0'
            ctx.fillRect(-10, -15, 20, 30)
            ctx.fillStyle = '#0f172a'
            ctx.fillRect(-6, -10, 4, 4)
            ctx.fillRect(2, -10, 4, 4)

        }


        ctx.restore()

    })


    
    if (boss) {

        let drawX = boss.x - cameraX
        ctx.save()
        ctx.translate(drawX + boss.w / 2, boss.y + boss.h / 2)

        ctx.fillStyle = '#450a0a'
        ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h)
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.moveTo(-25, -boss.h / 2); ctx.lineTo(-45, -boss.h / 2 - 30); ctx.lineTo(-10, -boss.h / 2 + 10)
        ctx.moveTo(25, -boss.h / 2); ctx.lineTo(45, -boss.h / 2 - 30); ctx.lineTo(10, -boss.h / 2 + 10)
        ctx.fill()
        ctx.fillStyle = '#facc15'
        ctx.fillRect(-20, -20, 10, 10)
        ctx.fillRect(10, -20, 10, 10)

        ctx.restore()

    }



    bullets.forEach(b => {

        let drawX = b.x - cameraX
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(drawX, b.y, 4, 0, Math.PI * 2)
        ctx.fill()

    })



    enemyBullets.forEach(eb => {

        let drawX = eb.x - cameraX
        ctx.fillStyle = eb.color
        ctx.beginPath()
        ctx.arc(drawX, eb.y, 5, 0, Math.PI * 2)
        ctx.fill()

    })

    

    particles.forEach(pt => {

        let drawX = pt.x - cameraX
        ctx.fillStyle = pt.color
        ctx.fillRect(drawX, pt.y, pt.size, pt.size)

    })

}


function gameLoop() {
    update()
    draw()
    requestAnimationFrame(gameLoop)
}

document.getElementById('startBtn').addEventListener('click', startGame)
document.getElementById('restartBtn').addEventListener('click', restartGame)
document.getElementById('restartPauseBtn').addEventListener('click', restartGame)
document.getElementById('victoryRestartBtn').addEventListener('click', restartGame)
document.getElementById('pauseBtn').addEventListener('click', togglePause)
document.getElementById('resumeBtn').addEventListener('click', togglePause)

const crtToggleBtn = document.getElementById('crtToggleBtn')
const crtOverlay = document.getElementById('crtOverlay')
crtToggleBtn.addEventListener('click', () => {
    const crtEnabled = crtOverlay.classList.toggle('hidden') === false
    crtToggleBtn.textContent = `CRT: ${crtEnabled ? 'ON' : 'OFF'}`
    crtToggleBtn.setAttribute('aria-pressed', String(crtEnabled))
})

const soundToggleBtn = document.getElementById('soundToggleBtn')
const soundIcon = document.getElementById('soundIcon')
soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled
    soundIcon.classList.toggle('fa-volume-up', soundEnabled)
    soundIcon.classList.toggle('fa-volume-mute', !soundEnabled)
    soundToggleBtn.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound')
    soundToggleBtn.setAttribute('aria-pressed', String(!soundEnabled))
})

requestAnimationFrame(gameLoop)