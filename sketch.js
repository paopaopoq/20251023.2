// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【新增】用於儲存所有煙火物件的陣列


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        // 在分數改變時呼叫 redraw()，但因為我們要跑動畫，所以 draw 裡面已經有 loop
        // 這裡可以保留，確保第一次接收到分數時畫面更新
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 【新增】步驟零：煙火所需類別 - 粒子 Particle
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hue, firework, lifespan = 255) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否為發射中的火箭或爆炸中的碎片
        this.lifespan = lifespan;
        this.hue = hue;
        this.acc = createVector(0, 0); // 加速度

        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(0, random(-15, -8));
        } else {
            // 爆炸碎片向隨機方向發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 碎片會逐漸減速並受重力影響
            this.vel.mult(0.9);
            this.lifespan -= 4; // 逐漸消失
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
    }

    show() {
        colorMode(HSB);
        if (this.firework) {
            strokeWeight(4);
            stroke(this.hue, 255, 255);
        } else {
            strokeWeight(2);
            stroke(this.hue, 255, 255, this.lifespan);
        }

        point(this.pos.x, this.pos.y);
        colorMode(RGB); // 切回預設
    }

    done() {
        return this.lifespan < 0;
    }
}


// =================================================================
// 【新增】步驟零：煙火所需類別 - 煙火 Firework (包含爆炸邏輯)
// -----------------------------------------------------------------

class Firework {
    constructor() {
        this.hue = random(255); // 隨機顏色
        // 在畫布底部隨機位置產生火箭 (Particle)
        this.firework = new Particle(random(width), height, this.hue, true);
        this.exploded = false;
        this.particles = []; // 爆炸後的碎片
    }

    update() {
        if (!this.exploded) {
            // 在火箭未爆炸時，持續給予一個向下的重力
            this.firework.applyForce(createVector(0, 0.2));
            this.firework.update();

            // 如果火箭速度開始向下 (代表達到頂點)，則爆炸
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸後的碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(createVector(0, 0.2)); // 碎片受重力
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 爆炸產生 100 個碎片
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hue, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let p of this.particles) {
            p.show();
        }
    }

    done() {
        // 如果火箭已爆炸且所有碎片都消失，則此煙火結束
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 【修改】為了讓動畫(煙火)可以運行，移除 noLoop()
    // noLoop(); 
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 【修改】背景使用半透明黑色，創造拖尾和夜空效果，並讓畫面持續更新
    background(0, 0, 0, 50); // 半透明黑色
    
    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【新增】觸發煙火效果的邏輯
        if (random(1) < 0.1) { // 約 10% 的機率在每幀中發射一個新的煙火
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); // 文本改為白色，在黑色背景下更清晰
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        // 由於我們添加了煙火，這裡的圖形可以移除或移動位置以避免與煙火重疊
        // circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        // 由於我們添加了煙火，這裡的圖形可以移除或移動位置以避免與煙火重疊
        // rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    
    // -----------------------------------------------------------------
    // 【新增】 C. 更新和繪製煙火
    // -----------------------------------------------------------------
    
    // 迭代所有煙火，更新狀態並繪製
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 如果煙火已結束，則從陣列中移除
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
}
