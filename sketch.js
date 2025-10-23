// =================================================================
// 步驟一：分數數據與煙火系統的全域變數
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績回傳..."; // 初始提示文字

// 【煙火系統】用於儲存所有煙火物件的陣列
let fireworks = []; 


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    // 檢查收到的資料是否為 H5P 成績結果
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        // 由於 draw() 會持續運行，這裡不再需要手動更新 scoreText 字串，直接在 draw() 中渲染即可
        
        console.log("新的分數已接收:", `最終成績分數: ${finalScore}/${maxScore}`); 
        
        // 【移除 noLoop/redraw 邏輯】：因為我們要跑動畫，所以 draw() 必須持續運行。
    }
}, false);


// =================================================================
// 【新增煙火系統】 - 粒子 Particle
// -----------------------------------------------------------------
class Particle {
    constructor(x, y, hue, isRocket, lifespan = 255) {
        this.pos = createVector(x, y);
        this.isRocket = isRocket; // 是否為發射中的火箭 (true) 或爆炸中的碎片 (false)
        this.lifespan = lifespan;
        this.hue = hue;
        this.acc = createVector(0, 0); // 加速度

        if (this.isRocket) {
            this.vel = createVector(0, random(-15, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isRocket) {
            this.vel.mult(0.9); // 空氣阻力
            this.lifespan -= 4; // 逐漸消失
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); 
    }

    show() {
        colorMode(HSB, 255); 
        
        if (this.isRocket) {
            strokeWeight(4);
            stroke(this.hue, 255, 255);
        } else {
            strokeWeight(2);
            // 碎片的透明度(Alpha)取決於 lifespan
            stroke(this.hue, 255, 255, this.lifespan); 
        }

        point(this.pos.x, this.pos.y);
        
        colorMode(RGB); // 切回 RGB 模式
    }

    isDone() {
        return this.lifespan < 0;
    }
}


// =================================================================
// 【新增煙火系統】 - 煙火 Firework (包含爆炸邏輯)
// -----------------------------------------------------------------
class Firework {
    constructor() {
        this.hue = random(255); 
        // 在畫布底部隨機位置產生火箭 (Particle)
        this.firework = new Particle(random(width), height, this.hue, true);
        this.exploded = false;
        this.particles = []; 
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, 0.2)); // 重力
            this.firework.update();

            // 如果火箭速度開始向下 (代表達到最高點)，則爆炸
            if (this.firework.vel.y >= 0) { 
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(createVector(0, 0.2)); 
            this.particles[i].update();
            if (this.particles[i].isDone()) {
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

    isDone() {
        // 如果火箭已爆炸且所有碎片都消失，則此煙火結束
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟二：p5.js setup 和 draw 函數
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 【關鍵修改】：移除 noLoop()，讓 draw() 持續執行以實現動畫
} 

function draw() { 
    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // -----------------------------------------------------------------
    // A. 處理背景與煙火邏輯
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 【高分/煙火模式】：使用半透明黑色背景 (alpha: 50)，創造煙火拖尾效果
        background(0, 0, 0, 50); 
        
        // 【煙火發射邏輯】：約 10% 的機率在每幀中發射一個新的煙火
        if (random(1) < 0.1) { 
            fireworks.push(new Firework());
        }
        
        // 更新和繪製煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].isDone()) {
                fireworks.splice(i, 1);
            }
        }
        
    } else {
        // 【一般/初始模式】：使用完全不透明的黑色背景，確保文字和圖案清晰
        background(0);
        // 如果分數不達標，則清除所有煙火
        fireworks = [];
    }
    
    
    // -----------------------------------------------------------------
    // B. 顯示文字和分數
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    if (maxScore === 0) {
        // 尚未收到分數 (初始狀態)
        fill(255); // 白色文字
        text(scoreText, width / 2, height / 2);
        
    } else if (percentage >= 90) {
        // 優異成績
        fill(0, 255, 100); // 亮綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 成績良好
        fill(255, 200, 50); // 橘黃色 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else {
        // 需要加強
        fill(255, 50, 50); // 亮紅色 
        text("需要加強努力！", width / 2, height / 2 - 50);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); // 白色文本
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // C. 根據分數觸發不同的幾何圖形反映 (只在非煙火模式下顯示，避免衝突)
    // -----------------------------------------------------------------
    
    if (percentage > 0 && percentage < 90) {
        
        if (percentage >= 60) {
            // 畫一個方形 
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(width / 2, height / 2 + 150, 150, 150);
            
        } else if (percentage > 0) {
            // 畫一個三角形
            fill(200, 0, 0, 150);
            triangle(
                width / 2, height / 2 + 80,
                width / 2 - 75, height / 2 + 230,
                width / 2 + 75, height / 2 + 230
            );
        }
    }
}
