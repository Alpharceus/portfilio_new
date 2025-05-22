document.addEventListener("DOMContentLoaded", () => {

    fetch('assets/projects.json')
      .then(res => res.json())
      .then(projects => {
          const el = document.getElementById('project-list');
          projects.forEach(proj => {
              const div = document.createElement('div');
              div.className = 'project';
              div.innerHTML = `
                  <h2>${proj.title}</h2>
                  <p>${proj.desc || ""}</p>
                  ${proj.summary ? `<details><summary>Show Summary</summary><div>${proj.summary}</div></details>` : ""}
              `;
              el.appendChild(div);
          });
      })
      .catch(() => {
          document.getElementById('project-list').innerHTML = "<p>No projects available.</p>";
      });

    const canvas = document.createElement('canvas');
    canvas.id = "circuit-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = 0;
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = 2
    ;
    document.body.insertBefore(canvas, document.body.firstChild);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    const ctx = canvas.getContext('2d');
    let t = 0;

    function drawChip(cx, cy, size, pinsPerSide) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - size/2, cy - size/2, size, size);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#fffcc1";
        ctx.shadowColor = "#fffcc1";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = "#ded850";
        ctx.stroke();

        // Draw chip pins
        let spacing = size / (pinsPerSide + 1);
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = "#ded850";
        for (let i = 0; i < pinsPerSide; i++) {
            // Top
            ctx.beginPath();
            ctx.moveTo(cx-size/2 + spacing*(i+1), cy-size/2);
            ctx.lineTo(cx-size/2 + spacing*(i+1), cy-size/2-16);
            ctx.stroke();
            // Right
            ctx.beginPath();
            ctx.moveTo(cx+size/2, cy-size/2 + spacing*(i+1));
            ctx.lineTo(cx+size/2+16, cy-size/2 + spacing*(i+1));
            ctx.stroke();
            // Bottom
            ctx.beginPath();
            ctx.moveTo(cx+size/2 - spacing*(i+1), cy+size/2);
            ctx.lineTo(cx+size/2 - spacing*(i+1), cy+size/2+16);
            ctx.stroke();
            // Left
            ctx.beginPath();
            ctx.moveTo(cx-size/2, cy+size/2 - spacing*(i+1));
            ctx.lineTo(cx-size/2-16, cy+size/2 - spacing*(i+1));
            ctx.stroke();
        }

        // CHIP label
        ctx.font = `${Math.round(size*0.22)}px 'JetBrains Mono', 'Fira Mono', 'Consolas', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#444";
        ctx.globalAlpha = 0.55;
        ctx.fillText("CHIP", cx, cy);
        ctx.restore();
    }
//manhattanWirePath
function manhattanWirePath(side, i, pinsPerSide, chipRect, canvasW, canvasH) {
    // Params
    let chipSize = chipRect.size;
    let spacing = chipSize / (pinsPerSide + 1);
    let pinOffset = (i + 1) * spacing;
    let chipEdge = chipSize / 2;
    let leadLength = 35;
    let diag1Len = 45;
    let legLen = 45;
    let diag2Len = 50;
    let margin = 20;
    let mid = Math.floor(pinsPerSide/2);

    let path = [];
    let x, y, sign;

    // 0: Top, 1: Right, 2: Bottom, 3: Left
    // Each side: set up start, directions, and output
    if (side === 0) { // Top, wires go up
        x = chipRect.cx - chipEdge + pinOffset;
        y = chipRect.cy - chipEdge;
        path.push({x, y});

        y -= leadLength;
        path.push({x, y});

        sign = (i < mid) ? -1 : 1; // Left: -1, Right: +1

        // 1st diagonal
        x += sign * diag1Len;
        y -= diag1Len;
        path.push({x, y});

        // 90° horizontal leg
        x += sign * legLen;
        path.push({x, y});

        // 2nd diagonal
        x += sign * diag2Len;
        y -= diag2Len;
        path.push({x, y});

        // Go up to top edge
        path.push({x, y: margin});
    }
    else if (side === 1) { // Right, wires go right
        x = chipRect.cx + chipEdge;
        y = chipRect.cy - chipEdge + pinOffset;
        path.push({x, y});

        x += leadLength;
        path.push({x, y});

        sign = (i < mid) ? -1 : 1; // Up: -1, Down: +1

        // 1st diagonal
        x += diag1Len;
        y += sign * diag1Len;
        path.push({x, y});

        // 90° vertical leg
        y += sign * legLen;
        path.push({x, y});

        // 2nd diagonal
        x += diag2Len;
        y += sign * diag2Len;
        path.push({x, y});

        // Out to right edge
        path.push({x: canvasW - margin, y});
    }
    else if (side === 2) { // Bottom, wires go down
        x = chipRect.cx + chipEdge - pinOffset;
        y = chipRect.cy + chipEdge;
        path.push({x, y});

        y += leadLength;
        path.push({x, y});

        sign = (i < mid) ? -1 : 1; // Left: -1, Right: +1

        // 1st diagonal
        x += sign * diag1Len;
        y += diag1Len;
        path.push({x, y});

        // 90° horizontal leg
        x += sign * legLen;
        path.push({x, y});

        // 2nd diagonal
        x += sign * diag2Len;
        y += diag2Len;
        path.push({x, y});

        // Go down to bottom edge
        path.push({x, y: canvasH - margin});
    }
    else { // Left, wires go left
        x = chipRect.cx - chipEdge;
        y = chipRect.cy + chipEdge - pinOffset;
        path.push({x, y});

        x -= leadLength;
        path.push({x, y});

        sign = (i < mid) ? -1 : 1; // Up: -1, Down: +1

        // 1st diagonal
        x -= diag1Len;
        y += sign * diag1Len;
        path.push({x, y});

        // 90° vertical leg
        y += sign * legLen;
        path.push({x, y});

        // 2nd diagonal
        x -= diag2Len;
        y += sign * diag2Len;
        path.push({x, y});

        // Out to left edge
        path.push({x: margin, y});
    }
    return path;
}



    function drawWirePath(path, t, pulsePhase) {
        ctx.save();
        ctx.strokeStyle = "#6efff2";
        ctx.lineWidth = 2.3;
        ctx.shadowColor = "#83fff9";
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.39;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for(let i=1;i<path.length;i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();

        // Glow
        ctx.shadowBlur = 15;
        ctx.strokeStyle = "#23ff94";
        ctx.globalAlpha = 0.13;
        ctx.lineWidth = 6.7;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for(let i=1;i<path.length;i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // End node (pad)
        const end = path[path.length-1];
        ctx.save();
        ctx.beginPath();
        ctx.arc(end.x, end.y, 7.2, 0, 2*Math.PI);
        ctx.fillStyle = "#d4fff6";
        ctx.shadowColor = "#aaffee";
        ctx.shadowBlur = 11;
        ctx.globalAlpha = 0.19;
        ctx.fill();
        ctx.restore();

        // Pulse animation
        let totalLen = 0, segLens = [];
        for(let i=1;i<path.length;i++) {
            let len = Math.hypot(path[i].x-path[i-1].x, path[i].y-path[i-1].y);
            segLens.push(len);
            totalLen += len;
        }
        let pulsePos = ((Math.sin(t/17 + pulsePhase) + 1)/2) * totalLen;
        let px = path[0].x, py = path[0].y;
        for(let i=1;i<path.length;i++) {
            if (pulsePos < segLens[i-1]) {
                let frac = pulsePos/segLens[i-1];
                px = path[i-1].x + (path[i].x-path[i-1].x)*frac;
                py = path[i-1].y + (path[i].y-path[i-1].y)*frac;
                break;
            } else {
                pulsePos -= segLens[i-1];
            }
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 6.3 + 1.3*Math.sin(t/2 + pulsePhase), 0, 2*Math.PI);
        ctx.fillStyle = "#e6fff2";
        ctx.shadowColor = "#9efff8";
        ctx.shadowBlur = 13;
        ctx.globalAlpha = 0.41;
        ctx.fill();
        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        const cx = canvas.width/2, cy = canvas.height/2;
        const chipSize = Math.min(canvas.width, canvas.height) * 0.23;
        const pinsPerSide = 10; // exactly what you want

        drawChip(cx, cy, chipSize, pinsPerSide);

        // Four sides: 0=top, 1=right, 2=bottom, 3=left
        for(let side=0;side<4;side++) {
            for(let i=0; i<pinsPerSide; i++) {
                const chipRect = { cx, cy, size: chipSize };
                const path = manhattanWirePath(side, i, pinsPerSide, chipRect, canvas.width, canvas.height);
                drawWirePath(path, t, side*0.9+i*0.17);
            }
        }

        t += 1.05;
        requestAnimationFrame(draw);
    }
    draw();
});
