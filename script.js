const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

let currentLevel = 1

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
let coOpMode = false



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

}


const player2 = {

    x: 70,
    y: 300,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: -11,
    grounded: false,
    facing: 'right',
    weapon: 'NORMAL',
    invulnerable: 0,
    shootCooldown: 0

}

let p2lives = 3


// entities
let platforms = []
let bullets = []
let enemyBullets = []
let enemies = []
let pods = []
let particles = []
let boss = null
let bossDefeated = false
let portal = null


// controls
window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
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

    if (currentLevel === 1) {
        score = 0
        lives = 3
        p2lives = 3
    }
    cameraX = 0
    bullets = []
    enemyBullets = []
    enemies = []
    pods = []
    particles = []
    boss = null
    bossDefeated = false
    document.getElementById('bossHud').classList.add('hidden')

    player.x = 100
    player.y = 200
    player.vx = 0
    player.vy = 0
    player.grounded = false
    player.facing = 'right'
    player.weapon = 'NORMAL'
    player.invulnerable = 0
    player.shootCooldown = 0

    player2.x = 60
    player2.y = 200
    player2.vx = 0
    player2.vy = 0
    player2.grounded = false
    player2.facing = 'right'
    player2.weapon = 'NORMAL'
    player2.invulnerable = 0
    player2.shootCooldown = 0
    keys = {}



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


    if (currentLevel === 1) {

        levelWidth = 3500
        portal = { x: 3300, y: 280, w: 40, h: 100, active: false }

    } else if (currentLevel === 2) {
        levelWidth = 5000
        portal = null

        platforms = [
            { x: 0, y: 380, w: 850, h: 70 },
            { x: 270, y: 290, w: 170, h: 20 },
            { x: 530, y: 210, w: 160, h: 20 },
            { x: 950, y: 380, w: 1100, h: 70 },
            { x: 1080, y: 300, w: 170, h: 20 },
            { x: 1430, y: 230, w: 180, h: 20 },
            { x: 1740, y: 290, w: 170, h: 20 },
            { x: 2150, y: 380, w: 1050, h: 70 },
            { x: 2280, y: 300, w: 170, h: 20 },
            { x: 2580, y: 220, w: 180, h: 20 },
            { x: 2900, y: 285, w: 180, h: 20 },
            { x: 3300, y: 380, w: 1700, h: 70 },
            { x: 3430, y: 300, w: 180, h: 20 },
            { x: 3740, y: 220, w: 180, h: 20 },
            { x: 4040, y: 290, w: 180, h: 20 },
            { x: 4310, y: 250, w: 190, h: 20 }
        ]


        enemies = [
            { type: 'shadow_orc', x: 480, y: 348, w: 24, h: 32, vx: -1.5, vy: 0, hp: 3, maxHp: 3, shootTimer: 0 },
            { type: 'cavern_gargoyle', x: 690, y: 145, w: 28, h: 28, vx: -1, vy: 0, hp: 2, maxHp: 2, shootTimer: 0, startY: 145 },
            { type: 'cavern_joe', x: 990, y: 348, w: 28, h: 28, vx: 1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
            { type: 'archer', x: 1110, y: 268, w: 22, h: 32, vx: 0, vy: 0, hp: 3, maxHp: 3, shootTimer: 70 },
            { type: 'shadow_orc', x: 1480, y: 198, w: 24, h: 32, vx: -1.5, vy: 0, hp: 3, maxHp: 3, shootTimer: 0 },
            { type: 'cavern_gargoyle', x: 1840, y: 150, w: 28, h: 28, vx: -1, vy: 0, hp: 2, maxHp: 2, shootTimer: 0, startY: 150 },
            { type: 'cavern_joe', x: 2250, y: 348, w: 28, h: 28, vx: 1.5, vy: 0, hp: 2, maxHp: 2, shootTimer: 0 },
            { type: 'archer', x: 2620, y: 188, w: 22, h: 32, vx: 0, vy: 0, hp: 3, maxHp: 3, shootTimer: 60 },
            { type: 'shadow_orc', x: 2940, y: 253, w: 24, h: 32, vx: -1.5, vy: 0, hp: 3, maxHp: 3, shootTimer: 0 },
            { type: 'cavern_gargoyle', x: 3530, y: 145, w: 28, h: 28, vx: -1, vy: 0, hp: 2, maxHp: 2, shootTimer: 0, startY: 145 },
            { type: 'archer', x: 3800, y: 188, w: 22, h: 32, vx: 0, vy: 0, hp: 3, maxHp: 3, shootTimer: 55 }
        ]

        pods = [
            { x: 560, y: 172, w: 24, h: 24, type: 'SPREAD', floatOffset: 0 },
            { x: 1470, y: 192, w: 24, h: 24, type: 'FIRE', floatOffset: 2 },
            { x: 2630, y: 182, w: 24, h: 24, type: 'LIGHTNING', floatOffset: 4 },
            { x: 3760, y: 182, w: 24, h: 24, type: 'FIRE', floatOffset: 1 }
        ]
    }

}



function startGame() {

    initAudio()
    currentLevel = 1
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
    document.getElementById('p2LivesText').innerText = p2lives
    document.getElementById('p2LivesContainer').classList.toggle('hidden', !coOpMode)
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

    const aimUp = coOpMode ? keys['w'] || keys['W'] : keys['ArrowUp'] || keys['w'] || keys['W']
    const aimDown = coOpMode ? keys['s'] || keys['S'] : keys['ArrowDown'] || keys['s'] || keys['S']
    const aimRight = coOpMode ? keys['d'] || keys['D'] : keys['ArrowRight'] || keys['d'] || keys['D']
    const aimLeft = coOpMode ? keys['a'] || keys['A'] : keys['ArrowLeft'] || keys['a'] || keys['A']

    if (aimUp) {

        angle = -Math.PI / 2
        if (aimRight) angle = -Math.PI / 4
        if (aimLeft) angle = -3 * Math.PI / 4

    } else if (aimDown) {

        if (!player.grounded) {

            angle = Math.PI / 2
            if (aimRight) angle = Math.PI / 4
            if (aimLeft) angle = 3 * Math.PI / 4

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



function firePlayer2Weapon() {

    if (player2.shootCooldown > 0) return
    playSound('shoot')

    const angle = player2.facing === 'right' ? 0 : Math.PI
    const startX = player2.x + player2.w / 2
    const startY = player2.y + player2.h / 2

    const fire = (shotAngle, speed, damage, color) => {
        bullets.push({
            x: startX,
            y: startY,
            vx: Math.cos(shotAngle) * speed,
            vy: Math.sin(shotAngle) * speed,
            type: player2.weapon,
            damage,
            color
        })
    }

    if (player2.weapon === 'SPREAD') {
        const spreadOffsets = [-0.25, 0, 0.25]
        spreadOffsets.forEach(offset => fire(angle + offset, 9, 1, '#38bdf8'))
        player2.shootCooldown = 16
    } else if (player2.weapon === 'LIGHTNING') {
        fire(angle, 14, 2, '#e0e7ff')
        player2.shootCooldown = 8
    } else if (player2.weapon === 'FIRE') {
        fire(angle, 7, 1.5, '#f97316')
        player2.shootCooldown = 10
    } else {
        fire(angle, 10, 1, '#38bdf8')
        player2.shootCooldown = 12
    }

}



function spawnBoss() {

    if (currentLevel === 2) {
        spawnBoss2()
        return
    }

    boss = {

        x: levelWidth - 500,
        y: 180,
        w: 90,
        h: 110,
        hp: 40,
        maxHp: 40,
        name: 'John',
        state: 'IDLE',
        timer: 0,
        vy: 0
    }

    document.getElementById('bossHud').classList.remove('hidden')
    document.getElementById('bossHealthBar').style.width = '100%'
    document.getElementById('bossName').innerText = boss.name
    document.getElementById('bossHealthText').innerText = '100%'

}


function spawnBoss2() {

    boss = {
        x: levelWidth - 500,
        y: 150,
        baseY: 150,
        w: 110,
        h: 130,
        hp: 75,
        maxHp: 75,
        name: 'Jeremy',
        state: 'CHARGING',
        timer: 0,
        vy: 0
    }

    document.getElementById('bossHud').classList.remove('hidden')
    document.getElementById('bossHealthBar').style.width = '100%'
    document.getElementById('bossName').innerText = boss.name
    document.getElementById('bossHealthText').innerText = '100%'

}


function update() {

    if (gameState !== 'PLAYING') return

    if (lives > 0) {
        const rightKey = coOpMode ? keys['d'] || keys['D'] : keys['ArrowRight'] || keys['d'] || keys['D']
        const leftKey = coOpMode ? keys['a'] || keys['A'] : keys['ArrowLeft'] || keys['a'] || keys['A']
        const jumpKey = coOpMode ? keys['w'] || keys['W'] || keys[' '] : keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']

        if (rightKey) {
            player.vx = player.speed
            player.facing = 'right'
        } else if (leftKey) {
            player.vx = -player.speed
            player.facing = 'left'
        } else {
            player.vx = 0
        }

        if (jumpKey && player.grounded) {
            player.vy = player.jumpPower
            player.grounded = false
        }

        if (keys['j'] || keys['J'] || keys['x'] || keys['X'] || keys['Control'] || keys['c'] || keys['C'] ) {
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
        })

        if (player.y > CANVAS_HEIGHT + 50) hurtPlayer()
    }

    if (coOpMode && p2lives > 0) {
        if (keys['ArrowRight']) {
            player2.vx = player2.speed
            player2.facing = 'right'
        } else if (keys['ArrowLeft']) {
            player2.vx = -player2.speed
            player2.facing = 'left'
        } else {
            player2.vx = 0
        }

        if (keys['ArrowUp'] && player2.grounded) {
            player2.vy = player2.jumpPower
            player2.grounded = false
        }

        if (keys['k'] || keys['K']) firePlayer2Weapon()
        if (player2.shootCooldown > 0) player2.shootCooldown--
        if (player2.invulnerable > 0) player2.invulnerable--

        player2.vy += 0.55
        player2.x += player2.vx
        player2.y += player2.vy
        if (player2.x < 0) player2.x = 0
        if (player2.x > levelWidth - player2.w) player2.x = levelWidth - player2.w

        player2.grounded = false
        platforms.forEach(p => {
            if (player2.x + player2.w > p.x && player2.x < p.x + p.w &&
                player2.y + player2.h >= p.y && player2.y + player2.h <= p.y + p.h + player2.vy) {
                if (player2.vy >= 0) {
                    player2.grounded = true
                    player2.vy = 0
                    player2.y = p.y - player2.h
                }
            }
        })

        if (player2.y > CANVAS_HEIGHT + 50) hurtPlayer2()
    }
    

    const cameraTargetX = coOpMode && lives > 0 && p2lives > 0
        ? (player.x + player2.x) / 2
        : (lives > 0 ? player.x : player2.x)
    if (cameraTargetX - cameraX > CANVAS_WIDTH * 0.5 && cameraX < levelWidth - CANVAS_WIDTH) {
        cameraX = cameraTargetX - CANVAS_WIDTH * 0.5

    } else if (cameraTargetX - cameraX < CANVAS_WIDTH * 0.25 && cameraX > 0) {
        cameraX = cameraTargetX - CANVAS_WIDTH * 0.25
    }

    const furthestPlayerX = coOpMode && p2lives > 0
        ? Math.max(lives > 0 ? player.x : 0, player2.x)
        : player.x
    if (furthestPlayerX > levelWidth - 900 && !boss && !bossDefeated) {
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
            document.getElementById('bossHealthText').innerText = Math.ceil(hpPercent) + '%'


            if (boss.hp <= 0) {

                addExplosion(boss.x + boss.w/2, boss.y + boss.h/2, '#facc15', 40)
                playSound('explosion')
                boss = null
                bossDefeated = true
                score += 2000
                updateHUD()

                if (currentLevel === 1) {
                    if (portal) portal.active = true
                    document.getElementById('bossHud').classList.add('hidden')
                } else {
                    setTimeout(() => {
                        gameState = 'VICTORY'
                        document.getElementById('victoryMenu').classList.remove('hidden')
                    }, 1000)
                }

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

        
        if (lives > 0 && eb.x > player.x && eb.x < player.x + player.w &&
            eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(idx, 1)
            hurtPlayer()
        } else if (coOpMode && p2lives > 0 &&
            eb.x > player2.x && eb.x < player2.x + player2.w &&
            eb.y > player2.y && eb.y < player2.y + player2.h) {
            enemyBullets.splice(idx, 1)
            hurtPlayer2()
        }

    })


    
    enemies.forEach(e => {
        const targetPlayer = coOpMode && p2lives > 0 &&
            (lives <= 0 || Math.abs(e.x - player2.x) < Math.abs(e.x - player.x))
            ? player2
            : player

        if (e.type === 'orc' || e.type === 'shadow_orc' || e.type === 'cavern_joe') {
            e.x += e.vx

            if (e.x < 100 || e.x > levelWidth - 100) e.vx *= -1
        } else if (e.type === 'gargoyle' || e.type === 'cavern_gargoyle') {
            e.x += e.vx
            e.y = e.startY + Math.sin(Date.now() * 0.005) * 30

            if (Math.abs(e.x - targetPlayer.x) < 400 && Math.random() < 0.008) {
                enemyBullets.push({
                    x: e.x + e.w/2, y: e.y + e.h,
                    vx: 0, vy: 4, color: '#dc2626'
                })
            }

        } else if (e.type === 'archer') {
            e.shootTimer--

            if (e.shootTimer <= 0 && Math.abs(e.x - targetPlayer.x) < 450) {
                let dir = targetPlayer.x < e.x ? -1 : 1

                enemyBullets.push({
                    x: e.x + (dir === 1 ? e.w : 0), y: e.y + 10,
                    vx: dir * 5, vy: -1, color: '#f59e0b'
                })
                e.shootTimer = 90

            }

        }

        
        if (lives > 0 && player.x + player.w > e.x && player.x < e.x + e.w &&
            player.y + player.h > e.y && player.y < e.y + e.h) {
            hurtPlayer()
        }
        if (coOpMode && p2lives > 0 &&
            player2.x + player2.w > e.x && player2.x < e.x + e.w &&
            player2.y + player2.h > e.y && player2.y < e.y + e.h) {
            hurtPlayer2()
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

        } else if (coOpMode && p2lives > 0 &&
            player2.x + player2.w > pod.x && player2.x < pod.x + pod.w &&
            player2.y + player2.h > podDrawY && player2.y < podDrawY + pod.h) {

            player2.weapon = pod.type
            playSound('powerup')
            addExplosion(pod.x, pod.y, '#f59e0b', 12)
            pods.splice(pIdx, 1)

        }

    })



    if (boss) {
        boss.timer++
        if (currentLevel === 2) {
            boss.y = boss.baseY + Math.sin(boss.timer * 0.035) * 22
        }

        const attackInterval = currentLevel === 2
            ? (boss.hp <= boss.maxHp / 2 ? 78 : 108)
            : 120
        if (boss.timer % attackInterval === 0) {
            const targetPlayer = coOpMode && p2lives > 0 &&
                (lives <= 0 || Math.abs(boss.x - player2.x) < Math.abs(boss.x - player.x))
                ? player2
                : player
            const dx = targetPlayer.x + targetPlayer.w / 2 - (boss.x + boss.w / 2)
            const dy = targetPlayer.y + targetPlayer.h / 2 - (boss.y + boss.h / 2)

            if (currentLevel === 2) {
                const aimAngle = Math.atan2(dy, dx)
                const enraged = boss.hp <= boss.maxHp / 2
                const spread = enraged ? 0.62 : 0.48
                const shotCount = enraged ? 5 : 3
                const speed = enraged ? 5.4 : 4.6

                for (let shot = 0; shot < shotCount; shot++) {
                    const offset = shotCount === 1
                        ? 0
                        : -spread + (spread * 2 * shot) / (shotCount - 1)
                    const angle = aimAngle + offset
                    enemyBullets.push({
                        x: boss.x + boss.w / 2,
                        y: boss.y + boss.h / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: enraged ? '#fb7185' : '#f97316'
                    })
                }
            } else {
                const dist = Math.hypot(dx, dy) || 1
                for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
                    enemyBullets.push({
                        x: boss.x + boss.w / 2,
                        y: boss.y + boss.h / 2,
                        vx: (dx / dist) * 5 + offset * 2,
                        vy: (dy / dist) * 5,
                        color: '#ef4444'
                    })
                }
            }
        }


        if (lives > 0 && player.x + player.w > boss.x && player.x < boss.x + boss.w &&
            player.y + player.h > boss.y && player.y < boss.y + boss.h) {
            hurtPlayer()
        }
        if (coOpMode && p2lives > 0 &&
            player2.x + player2.w > boss.x && player2.x < boss.x + boss.w &&
            player2.y + player2.h > boss.y && player2.y < boss.y + boss.h) {
            hurtPlayer2()
        }
    }




    particles.forEach((pt, idx) => {

        pt.x += pt.vx
        pt.y += pt.vy
        pt.life--
        if (pt.life <= 0) particles.splice(idx, 1)

    })


    if (portal && portal.active && currentLevel === 1) {
        const playerAtPortal = player.x + player.w > portal.x && player.x < portal.x + portal.w &&
            player.y + player.h > portal.y && player.y < portal.y + portal.h
        const player2AtPortal = coOpMode && p2lives > 0 &&
            player2.x + player2.w > portal.x && player2.x < portal.x + portal.w &&
            player2.y + player2.h > portal.y && player2.y < portal.y + portal.h

        if (playerAtPortal || player2AtPortal) {

            currentLevel = 2
            initLevel()
            playSound('powerup')
            updateHUD()
        }

    }

}




function hurtPlayer() {

    if (lives <= 0 || player.invulnerable > 0) return

    lives--
    playSound('hit')
    updateHUD()

    if (lives <= 0 && (!coOpMode || p2lives <= 0)) {
        gameState = 'GAMEOVER'
        document.getElementById('gameOverMenu').classList.remove('hidden')

    } else if (lives > 0) {

        player.invulnerable = 1200; 
        player.x = Math.max(100, cameraX + 50)
        player.y = 100
        player.vx = 0
        player.vy = 0

    }
}

function hurtPlayer2() {

    if (p2lives <= 0 || player2.invulnerable > 0) return

    p2lives--
    playSound('hit')
    updateHUD()

    if (p2lives <= 0 && lives <= 0) {
        gameState = 'GAMEOVER'
        document.getElementById('gameOverMenu').classList.remove('hidden')
    } else if (p2lives > 0) {
        player2.invulnerable = 2
        player2.x = Math.max(60, cameraX + 50)
        player2.y = 100
        player2.vx = 0
        player2.vy = 0
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


    if (currentLevel === 2) {
        const caveGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        caveGrad.addColorStop(0, '#090718')
        caveGrad.addColorStop(0.65, '#171126')
        caveGrad.addColorStop(1, '#29172f')
        ctx.fillStyle = caveGrad
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        for (let i = 0; i < 8; i++) {
            const crystalX = ((i * 137 - cameraX * 0.16) % 1000 + 1000) % 1000
            const crystalY = 150 + (i % 3) * 48
            ctx.fillStyle = i % 2 === 0 ? 'rgba(168, 85, 247, 0.18)' : 'rgba(249, 115, 22, 0.14)'
            ctx.beginPath()
            ctx.moveTo(crystalX, crystalY)
            ctx.lineTo(crystalX + 12, crystalY + 30)
            ctx.lineTo(crystalX + 2, crystalY + 66)
            ctx.lineTo(crystalX - 10, crystalY + 30)
            ctx.closePath()
            ctx.fill()
        }

        ctx.fillStyle = 'rgba(124, 58, 237, 0.12)'
        ctx.fillRect(0, 370, CANVAS_WIDTH, 80)
    } else {
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
            const archX = i - (cameraX * 0.2) % 100
            const archY = 300 + Math.sin(i + 1) * 35
            ctx.lineTo(archX, archY)
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fill()

        ctx.fillStyle = '#1b3b2b'
        ctx.beginPath()
        ctx.moveTo(0, CANVAS_HEIGHT)
        for (let i = 0; i <= CANVAS_WIDTH + 80; i += 80) {
            const hillX = i - (cameraX * 0.4) % 80
            const hillY = 370 + Math.sin(i * 0.05) * 20
            ctx.lineTo(hillX, hillY)
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fill()
    }

    

    platforms.forEach(p => {

        let drawX = p.x - cameraX
        if (drawX + p.w < -50 || drawX > CANVAS_WIDTH + 50) return

        ctx.fillStyle = currentLevel === 2 ? '#292333' : '#2d241e'
        ctx.fillRect(drawX, p.y, p.w, p.h)
        ctx.strokeStyle = currentLevel === 2 ? '#6d4c8d' : '#43362d'
        ctx.lineWidth = 2
        ctx.strokeRect(drawX, p.y, p.w, p.h)


        ctx.fillStyle = currentLevel === 2 ? '#c084fc' : '#38a169'
        ctx.fillRect(drawX - 2, p.y - 2, p.w + 4, 6)
        ctx.fillStyle = currentLevel === 2 ? '#6b21a8' : '#2f855a'

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


    if ((gameState === 'PLAYING' || gameState === 'VICTORY') && lives > 0) {

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


    if ((gameState === 'PLAYING' || gameState === 'VICTORY') && coOpMode && p2lives > 0) {

        let drawX2 = player2.x - cameraX
        ctx.save()
        ctx.translate(drawX2 + player2.w / 2, player2.y + player2.h / 2)
        if (player2.facing === 'left') ctx.scale(-1, 1)

        if (player2.invulnerable % 4 < 2) {

            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(-10, -10, 20, 26)
            ctx.fillStyle = '#93c5fd'
            ctx.fillRect(-8, -24, 16, 14)

            ctx.fillStyle = '#1d4ed8'
            ctx.beginPath()
            ctx.moveTo(-8, -10)
            ctx.lineTo(-18, 12 + Math.sin(Date.now() * 0.01) * 3)
            ctx.lineTo(-4, 10)
            ctx.fill()

        }

        ctx.restore()

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

        } else if (e.type === 'shadow_orc') {
            ctx.fillStyle = '#312e81'
            ctx.fillRect(-12, -15, 24, 30)
            ctx.fillStyle = '#c4b5fd'
            ctx.fillRect(2, -10, 4, 4)

        } else if (e.type === 'cavern_joe') {
            ctx.fillStyle = '#78350f'
            ctx.fillRect(-12, -12, 24, 24)
            ctx.fillStyle = '#fbbf24'
            ctx.fillRect(2, -6, 4, 4)

        } else if (e.type === 'gargoyle') {
            ctx.fillStyle = '#64748b'
            ctx.fillRect(-12, -12, 24, 24)
            ctx.fillStyle = '#475569'
            ctx.beginPath()
            ctx.moveTo(-10, -10); ctx.lineTo(-24, -18); ctx.lineTo(-12, 5)
            ctx.moveTo(10, -10); ctx.lineTo(24, -18); ctx.lineTo(12, 5)
            ctx.fill()

        } else if (e.type === 'cavern_gargoyle') {
            ctx.fillStyle = '#581c87'
            ctx.fillRect(-12, -12, 24, 24)
            ctx.fillStyle = '#7e22ce'
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

        if (currentLevel === 2) {
            const enraged = boss.hp <= boss.maxHp / 2
            const armorColor = enraged ? '#3f1022' : '#18181b'
            const glowColor = enraged ? '#fb7185' : '#c084fc'
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 18
            ctx.fillStyle = armorColor
            ctx.fillRect(-boss.w / 2, -boss.h / 2 + 12, boss.w, boss.h - 12)
            ctx.shadowBlur = 0

            ctx.fillStyle = '#27202f'
            ctx.fillRect(-boss.w / 2 - 12, -18, 28, 52)
            ctx.fillRect(boss.w / 2 - 16, -18, 28, 52)
            ctx.fillStyle = glowColor
            ctx.fillRect(-boss.w / 2 - 12, -18, 28, 5)
            ctx.fillRect(boss.w / 2 - 16, -18, 28, 5)

            ctx.fillStyle = '#581c87'
            ctx.beginPath()
            ctx.moveTo(-40, -boss.h / 2 + 16)
            ctx.lineTo(-58, -boss.h / 2 - 30)
            ctx.lineTo(-19, -boss.h / 2 + 13)
            ctx.moveTo(40, -boss.h / 2 + 16)
            ctx.lineTo(58, -boss.h / 2 - 30)
            ctx.lineTo(19, -boss.h / 2 + 13)
            ctx.fill()

            ctx.fillStyle = '#09090b'
            ctx.fillRect(-32, -30, 64, 47)
            ctx.fillStyle = glowColor
            ctx.fillRect(-24, -20, 14, 7)
            ctx.fillRect(10, -20, 14, 7)
            ctx.fillStyle = '#facc15'
            ctx.fillRect(-5, -5, 10, 12)
            ctx.strokeStyle = enraged ? '#fb7185' : '#7e22ce'
            ctx.lineWidth = 3
            ctx.strokeRect(-boss.w / 2 + 8, -boss.h / 2 + 18, boss.w - 16, boss.h - 28)
        } else {
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
        }

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

    if (portal && portal.active && currentLevel === 1) {

        let drawPortalX = portal.x - cameraX
        ctx.fillStyle = '#8b5cf6'
        ctx.fillRect(drawPortalX, portal.y, portal.w, portal.h)
        ctx.fillStyle = '#c4b5fd'
        ctx.fillRect(drawPortalX + 8, portal.y + 8, portal.w - 16, portal.h - 16)

    }


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



const soloModeBtn = document.getElementById('soloModeBtn')
const coopModeBtn = document.getElementById('coopModeBtn')
const startBtn = document.getElementById('startBtn')
const controlHint = document.getElementById('controlHint')




function selectGameMode(useCoOp) {

    coOpMode = useCoOp
    soloModeBtn.classList.toggle('active', !coOpMode)
    coopModeBtn.classList.toggle('active', coOpMode)
    soloModeBtn.setAttribute('aria-pressed', String(!coOpMode))
    coopModeBtn.setAttribute('aria-pressed', String(coOpMode))
    startBtn.textContent = coOpMode ? 'Start Co-op Game' : 'Start Solo Game'
    controlHint.textContent = coOpMode
        ? 'P1: A/D move, W/Space jump, J fire · P2: Arrows move, Up jump, K fire'
        : 'Move: A/D or Left/Right · Jump: W/Up/Space · Fire: J/X/L'

}

soloModeBtn.addEventListener('click', () => selectGameMode(false))
coopModeBtn.addEventListener('click', () => selectGameMode(true))
selectGameMode(false)


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