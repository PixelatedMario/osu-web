import { Audio } from './audio.js';
import { Renderer } from './renderer.js';

export const Game = {
    map: null,
    replayData: null,
    activeObjects: [],
    cursor: { x: 0, y: 0, down: false },
    score: 0,
    combo: 0,
    isReplay: false,
    preempt: 600,
    fadeIn: 400,
    radius: 54.4,

    start(mapData, replay = null) {
        this.map = mapData;
        this.replayData = replay;
        this.isReplay = !!replay;
        this.score = 0;
        this.combo = 0;
        this.activeObjects = [];
        
        Renderer.hitContainer.removeChildren();

        const AR = this.map.Difficulty.ApproachRate || 5;
        this.preempt = AR < 5 ? 1200 + 120 * (5 - AR) : 1200 - 120 * (AR - 5);
        this.fadeIn = AR < 5 ? 800 + 120 * (5 - AR) : 800 - 120 * (AR - 5);
        
        const CS = this.map.Difficulty.CircleSize || 4;
        this.radius = 54.4 - 4.48 * CS;

        if (!this.cursorSprite) {
            this.cursorSprite = new PIXI.Sprite(Renderer.assets['cursor'] || Renderer.assets['cursor']);
            this.cursorSprite.anchor.set(0.5);
            Renderer.cursorContainer.addChild(this.cursorSprite);
        }

        Audio.playMusic();
        Renderer.app.ticker.add(this.update, this);
    },

    update(delta) {
        const time = Audio.getTime();

        if (this.isReplay && this.replayData) {
        } else {
        }
        
        this.cursorSprite.x = this.cursor.x;
        this.cursorSprite.y = this.cursor.y;

        this.map.HitObjects.forEach(obj => {
            if (!obj.spawned && time >= obj.time - this.preempt) {
                obj.spawned = true;
                let sprite;
                
                if (obj.typeStr === 'slider') {
                    sprite = Renderer.spawnSlider(obj, this.radius);
                } else if (obj.typeStr === 'spinner') {
                    sprite = Renderer.spawnSpinner(obj);
                } else {
                    sprite = Renderer.spawnCircle(obj, this.radius);
                }
                
                Renderer.hitContainer.addChild(sprite);
                obj.sprite = sprite;
                this.activeObjects.push(obj);
            }
        });

        for (let i = this.activeObjects.length - 1; i >= 0; i--) {
            const obj = this.activeObjects[i];
            const diff = obj.time - time;

            const appCircle = obj.sprite.getChildByName("approach");
            if (appCircle) {
                const scale = 1 + (2 * (diff / this.preempt));
                appCircle.scale.set(scale);
                if (diff <= 0) appCircle.visible = false;
            }

            if (diff > this.preempt - this.fadeIn) {
                obj.sprite.alpha = (this.preempt - diff) / this.fadeIn;
            } else {
                obj.sprite.alpha = 1;
            }

            if (diff < -200 && !obj.hit) {
                this.handleResult(obj, 0);
            }
            
            if (this.cursor.down && !obj.hit && Math.abs(diff) < 150) {
                const localX = (this.cursor.x - Renderer.offset.x) / Renderer.scale;
                const localY = (this.cursor.y - Renderer.offset.y) / Renderer.scale;
                
                const d = Math.sqrt((localX - obj.x) ** 2 + (localY - obj.y) ** 2);
                if (d < this.radius) {
                    this.handleResult(obj, 300);
                    this.cursor.down = false;
                }
            }
        }
    },

    handleResult(obj, points) {
        obj.hit = true;
        obj.sprite.visible = false;
        this.activeObjects = this.activeObjects.filter(o => o !== obj);
        
        if (points > 0) {
            this.combo++;
            this.score += points * this.combo;
            Audio.playHitSound();
        } else {
            this.combo = 0;
        }
        
        document.getElementById('score').innerText = this.score.toString().padStart(7, '0');
        document.getElementById('combo').innerText = this.combo + 'x';
    }
};
