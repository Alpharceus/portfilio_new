let stars = [];
let shootingStars = [];
let hoveredStar = null;
let orionStarScreenPos = []; // store positions per frame for clicks

const orionStars = [
    { name: "Betelgeuse", ra: 5.92, dec: 7.4, type: "M2", info: "Red supergiant, Alpha Orionis" },
    { name: "Bellatrix", ra: 5.42, dec: 6.3, type: "B2", info: "Blue giant, Gamma Orionis" },
    { name: "Alnilam", ra: 5.60, dec: -1.2, type: "B0", info: "Blue supergiant, Epsilon Orionis" },
    { name: "Mintaka", ra: 5.53, dec: -0.3, type: "O9", info: "Blue giant, Delta Orionis" },
    { name: "Alnitak", ra: 5.68, dec: -1.9, type: "O9", info: "Blue supergiant, Zeta Orionis" },
    { name: "Saiph", ra: 5.80, dec: -9.7, type: "B2", info: "Blue supergiant, Kappa Orionis" },
    { name: "Rigel", ra: 5.24, dec: -8.2, type: "B8", info: "Blue supergiant, Beta Orionis" }
];

const orionLines = [
    [0,4], [1,3], [0,1], [2,3], [2,4], [4,5], [3,6], [5,6]
];

function randomColorFromType(type) {
    switch (type) {
        case "M2": return color(255, 136, 76);
        case "B2": return color(153, 217, 255);
        case "B0":
        case "O9":
        case "B8": return color(170, 210, 255);
        default: return color(220, 220, 255);
    }
}

// Mirror the X axis for classic sky orientation
function getNormalizedCoords(star) {
    let x = map(star.ra, 5.2, 5.92, 1, 0); // FLIP X
    let y = map(star.dec, -10, 8, 1, 0);
    return createVector(x, y);
}

function skyToScreenFlat(normVec, scale = 0.65, centerX = width/2, centerY = height/2) {
    let px = (normVec.x - 0.5) * scale * width * 0.6 + centerX;
    let py = (normVec.y - 0.5) * scale * width * 0.6 + centerY;
    return createVector(px, py);
}

function setup() {
    let canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.position(0, 0);
    canvas.style('z-index', '-1');
    canvas.style('position', 'fixed');

    // Animated background stars with Perlin noise
    for (let i = 0; i < 170; i++) {
        stars.push({
            base: createVector(random(), random()),
            r: random(1.1, 2.1),
            twinkleSeed: random(10000),
            noiseSeedX: random(10000),
            noiseSeedY: random(10000)
        });
    }
    noStroke();
}

function draw() {
    background(14, 16, 31);
    drawGradient();

    // Animated background stars
    for (let s of stars) {
        let wanderX = s.base.x + (noise(s.noiseSeedX + millis() * 0.00005) - 0.5) * 0.02;
        let wanderY = s.base.y + (noise(s.noiseSeedY + millis() * 0.00005) - 0.5) * 0.02;
        let spos = skyToScreenFlat(createVector(wanderX, wanderY), 1.0, width/2, height/2);
        let t = millis() * 0.0003 + s.twinkleSeed;
        let alpha = 195 + 60 * (noise(t) - 0.5) + 20 * sin(frameCount * 0.012 + s.twinkleSeed * 5);
        fill(255, 255, 220, alpha);
        circle(spos.x, spos.y, s.r);
    }

    // Smoother shooting stars (now with fading, curved tail)
    updateShootingStars();

    // Draw Orion
    drawOrionFlat(0.65);
}

function drawGradient() {
    let radius = sqrt(sq(width/2) + sq(height/2));
    for (let r = radius; r > 0; r -= 3) {
        let alpha = map(r, radius, 0, 0, 28);
        fill(30, 28, 40, alpha);
        ellipse(width/2, height/2, r*2);
    }
}

function drawOrionFlat(scale = 0.65) {
    let centerX = width / 2;
    let centerY = height / 2;
    let normPos = orionStars.map(getNormalizedCoords);
    let starPositions = normPos.map(nv => skyToScreenFlat(nv, scale, centerX, centerY));

    // Store screen positions for click detection
    orionStarScreenPos = starPositions;

    // Lines
    stroke(90,140,240,120);
    strokeWeight(2.1);
    for (let pair of orionLines) {
        let [a, b] = pair;
        line(starPositions[a].x, starPositions[a].y, starPositions[b].x, starPositions[b].y);
    }
    noStroke();

    // Twinkling Orion stars, use smooth sin for twinkle
    hoveredStar = null;
    for (let i=0; i<orionStars.length; i++) {
        let sx = starPositions[i].x, sy = starPositions[i].y;
        let tw = 18 + 8*sin(frameCount*0.045 + i*7); // slower, smoother twinkle
        let d = dist(mouseX, mouseY, sx, sy);
        let baseCol = randomColorFromType(orionStars[i].type);
        fill(red(baseCol), green(baseCol), blue(baseCol), d<28 ? 255 : 215);
        ellipse(sx, sy, d<28 ? tw*1.4 : tw);
        if (d < 23) hoveredStar = { ...orionStars[i], sx, sy, idx: i };
    }
    if (hoveredStar) {
        fill(24, 28, 40, 250);
        rect(mouseX+16, mouseY-28, 210, 56, 10);
        fill(255, 255, 240);
        textSize(17);
        text(hoveredStar.name, mouseX+24, mouseY-10);
        textSize(12);
        text(hoveredStar.info, mouseX+24, mouseY+8);
        cursor(HAND);
    } else {
        cursor(ARROW);
    }
}

// --- Shooting Stars with Fading, Tapered Tail ---
function updateShootingStars() {
    // Slower, more natural
    if (random(1) < 0.012 && shootingStars.length < 2) {
        // Each meteor has a trail of previous positions
        shootingStars.push({
            x: random(width * 0.4, width),
            y: random(0, height * 0.4),
            vx: -random(2.5, 5.5),
            vy: random(1.0,2.5),
            trail: [],
            life: 0,
            maxLife: random(65,110)
        });
    }
    for (let i = shootingStars.length-1; i >= 0; i--) {
        let s = shootingStars[i];

        // Update position
        s.x += s.vx * 0.7;
        s.y += s.vy * 0.7;
        s.trail.unshift({x: s.x, y: s.y}); // add to front
        if (s.trail.length > 22) s.trail.pop();

        s.life++;
        let headAlpha = map(s.life, 0, s.maxLife, 230, 0);
        let headSize = 4 + 1.8 * sin(frameCount*0.11 + i*11);

        // Draw fading, tapered tail (overlapping ellipses)
        for (let j = s.trail.length - 1; j > 0; j--) {
            let pct = j / s.trail.length;
            let alpha = 55 * pct * pct; // fades out
            let size = headSize * pct * 1.6;
            fill(255, 255, 255, alpha);
            ellipse(s.trail[j].x, s.trail[j].y, size, size * 0.7); // slightly flattened
        }
        // Head
        fill(255, 255, 255, headAlpha);
        ellipse(s.x, s.y, headSize);

        if (s.life > s.maxLife) shootingStars.splice(i, 1);
    }
}

// --- Star click interaction ---
function mousePressed() {
    if (!orionStarScreenPos) return;
    for (let i = 0; i < orionStarScreenPos.length; i++) {
        let pos = orionStarScreenPos[i];
        if (dist(mouseX, mouseY, pos.x, pos.y) < 24) {
            handleStarClick(i);
            break;
        }
    }
}

// --- Star actions ---
function handleStarClick(idx) {
    // 0: Betelgeuse, 1: Bellatrix, 2: Alnilam, 3: Mintaka, 4: Alnitak, 5: Saiph, 6: Rigel
    switch(idx) {
        case 0:
            openTerminal(); break;
        case 1:
            alert("Bellatrix: About Me (placeholder)");
            break;
        case 2:
            alert("Alnilam: Projects (placeholder)");
            break;
        case 3:
            alert("Mintaka: Skills (placeholder)");
            break;
        case 4:
            alert("Alnitak: Contact (placeholder)");
            break;
        case 5:
            alert("Saiph: Resume (placeholder)");
            break;
        case 6:
            alert("Rigel: GitHub (placeholder)");
            break;
    }
}

// --- Demo function for Betelgeuse terminal (replace with your UI/modal logic!) ---
function openTerminal() {
    alert("Launching Terminal (replace this with your terminal overlay/modal!)");
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}
