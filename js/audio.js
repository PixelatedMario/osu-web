export const Audio = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    bgmSource: null,
    bgmBuffer: null,
    sounds: {},
    startTime: 0,
    isPlaying: false,
    
    async loadSound(name, buffer) {
        this.sounds[name] = await this.ctx.decodeAudioData(buffer);
    },
    
    playHitSound(sampleSet = 'normal', type = 'hitnormal') {
        const soundKey = `${sampleSet}-${type}`;
        let sound = this.sounds[soundKey] || this.sounds['normal-hitnormal'];
        
        if (sound) {
            const src = this.ctx.createBufferSource();
            src.buffer = sound;
            src.connect(this.ctx.destination);
            src.start(0);
        }
    },
    
    playMusic(offset = 0) {
        if (this.bgmSource) this.bgmSource.stop();
        this.bgmSource = this.ctx.createBufferSource();
        this.bgmSource.buffer = this.bgmBuffer;
        this.bgmSource.connect(this.ctx.destination);
        this.startTime = this.ctx.currentTime - offset;
        this.bgmSource.start(0, offset);
        this.isPlaying = true;
    },
    
    stop() {
        if (this.bgmSource) this.bgmSource.stop();
        this.isPlaying = false;
    },
    
    getTime() {
        if (!this.isPlaying) return 0;
        return (this.ctx.currentTime - this.startTime) * 1000;
    }
};
