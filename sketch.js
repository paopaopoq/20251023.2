// =================================================================
// 步驟一：分數數據與煙火系統的全域變數
// -----------------------------------------------------------------

// 全域變數，用於儲存 p5.js 的 Canvas 元素
let myCanvas; 
let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績回傳..."; // 初始提示文字

// 【煙火系統】用於儲存所有煙火物件的陣列
let fireworks = []; 


window.addEventListener('message', function (event) {
    // 執行來源驗證... (請根據您的實際環境調整)
    // ...
    const data = event.data;
    
    // 檢查收到的資料是否為 H5P 成績結果
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        
        console.log("新的分數已接收:", `最終成績分數: ${finalScore}/${maxScore}`); 
        
        // !!! 關鍵：收到成績後，顯示 Canvas 畫面 !!!
        if (myCanvas) {
            myCanvas.style('display', 'block');
        }
    }
}, false);


// =================================================================
// 【煙火系統】 - 粒子 Particle Class
// -----------------------------------------------------------------
class Particle {
    constructor(x, y, hue, isRocket, lifespan = 255) {
        this.pos = createVector(x, y);
        this.isRocket = isRocket; 
        this.lifespan = lifespan;
        this.hue = hue;
        this.acc = createVector(0, 0); 

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
// 【煙火系統】 - 煙火 Firework Class
// -----------------------------------------------------------------
class Firework {
    constructor() {
        this.hue = random(255); 
        this.firework = new Particle(random(width), height, this.hue, true);
        this.exploded = false;
        this.particles = []; 
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, 0.2)); // 重力
            this.firework.update();

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
        return this.exploded && this.particles.length === 0;
    }
}


// =================================================================
// 步驟二：p5.js setup 和 draw 函數
// -----------------------------------------------------------------

function setup() { 
    // 1. 創建 Canvas，並用全域變數 myCanvas 儲存它
    // 使用 windowWidth/Height 確保它覆蓋整個視窗/父容器
    myCanvas = createCanvas(windowWidth, windowHeight); 
    
    // 2. 設定 Canvas 的位置和層級，實現覆蓋效果
    myCanvas.position(0, 0, 'fixed'); 
    myCanvas.style('z-index', '100'); // 確保在 H5P 內容之上
    
    // 3. 初始隱藏 Canvas
    myCanvas.style('display', 'none'); 
} 

function draw() { 
    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // 【煙火觸發條件】：答對題數 (finalScore) >= 2 
    let triggerFirework = finalScore >= 2;
    
    // -----------------------------------------------------------------
    // A. 處理背景與煙火邏輯
    // -----------------------------------------------------------------
    
    if (triggerFirework) {
        // 【煙火模式】：使用半透明黑色背景 (alpha: 50)，創造煙火拖尾效果
        background(0, 0, 0, 50); 
        
        // 【煙火發射邏輯】
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
        // 【一般模式】：使用完全不透明的黑色背景
        background(0);
        // 如果分數不達標，則清除所有煙火
        fireworks = [];
    }
    
    
    // -----------------------------------------------------------------
    // B. 顯示文字和分數
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    // 文字位置應該相對於 Canvas 的中心 (width/2, height/2)
    const textCenterX = width / 2;
    const textCenterY = height / 2;

    if (maxScore === 0) {
        fill(255);
        text(scoreText, textCenterX, textCenterY);
        
    } else if (triggerFirework) {
        fill(0, 255, 100); 
        text("恭喜！優異成績！", textCenterX, textCenterY - 50);
        
    } else if (percentage > 0) {
        fill(255, 200, 50); 
        text("成績良好，請再接再厲。", textCenterX, textCenterY - 50);
        
    } else {
        fill(255, 50, 50); 
        text("需要加強努力！", textCenterX, textCenterY - 50);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); 
    text(`得分: ${finalScore}/${maxScore}`, textCenterX, textCenterY + 50);
    
    
    // -----------------------------------------------------------------
    // C. 根據分數觸發不同的幾何圖形反映 (只在非煙火模式下顯示)
    // -----------------------------------------------------------------
    
    if (!triggerFirework && maxScore > 0) {
        
        if (finalScore >= 1) { // 答對 1 題
            // 畫一個方形
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(textCenterX, textCenterY + 150, 150, 150);
            
        } else if (finalScore === 0) { // 答對 0 題
            // 畫一個三角形
            fill(200, 0, 0, 150);
            triangle(
                textCenterX, textCenterY + 80,
                textCenterX - 75, textCenterY + 230,
                textCenterX + 75, textCenterY + 230
            );
        }
    }
}
