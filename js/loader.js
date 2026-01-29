import { Audio } from './audio.js';
import { Renderer } from './renderer.js';
import { Parser } from './parser.js';

export const Loader = {
    async loadSkin(file) {
        const zip = await JSZip.loadAsync(file);
        const promises = [];
        
        zip.forEach((path, entry) => {
            const fileName = path.split('/').pop().toLowerCase();
            
            if (path.match(/\.(png|jpg|jpeg)$/i)) {
                promises.push(entry.async('base64').then(data => {
                    const name = fileName.replace(/\.(png|jpg|jpeg)$/i, '').replace(/@2x$/, '');
                    const ext = fileName.match(/\.(png|jpg|jpeg)$/i)[0];
                    Renderer.assets[name] = PIXI.Texture.from(`data:image/${ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png'};base64,${data}`);
                }));
            }
            
            if (path.match(/\.(wav|ogg|mp3)$/i)) {
                promises.push(entry.async('arraybuffer').then(async buffer => {
                    const name = fileName.replace(/\.(wav|ogg|mp3)$/i, '');
                    try {
                        await Audio.loadSound(name, buffer);
                    } catch(e) {
                        console.warn(`Failed to load sound: ${name}`);
                    }
                }));
            }
        });
        
        await Promise.all(promises);
        console.log("Skin loaded:", Object.keys(Renderer.assets).length, "textures,", Object.keys(Audio.sounds).length, "sounds");
    },
    
    async loadMap(file) {
        const zip = await JSZip.loadAsync(file);
        let osuFile, audioFile, bgFile;
        const difficulties = [];
        
        for (const [path, obj] of Object.entries(zip.files)) {
            if (path.endsWith('.osu')) {
                difficulties.push({ path, obj });
            }
            if (path.match(/\.(mp3|ogg)$/i) && !audioFile) {
                audioFile = obj;
            }
            if (path.match(/\.(jpg|jpeg|png)$/i) && !bgFile) {
                bgFile = obj;
            }
        }
        
        if (difficulties.length === 0 || !audioFile) {
            throw new Error("Invalid beatmap: missing .osu file or audio");
        }
        
        osuFile = difficulties[0].obj;
        
        const text = await osuFile.async('string');
        const mapData = Parser.parseOsu(text);
        
        const audioData = await audioFile.async('arraybuffer');
        Audio.bgmBuffer = await Audio.ctx.decodeAudioData(audioData);
        
        if (bgFile) {
            const bg64 = await bgFile.async('base64');
            const ext = bgFile.name.match(/\.(jpg|jpeg|png)$/i)[1];
            document.getElementById('bg-layer').style.backgroundImage = `url(data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${bg64})`;
        }
        
        const hitSounds = ['normal-hitnormal', 'normal-hitclap', 'normal-hitwhistle', 'normal-hitfinish',
                           'soft-hitnormal', 'soft-hitclap', 'soft-hitwhistle', 'soft-hitfinish',
                           'drum-hitnormal', 'drum-hitclap', 'drum-hitwhistle', 'drum-hitfinish'];
        
        for (const soundName of hitSounds) {
            const soundFile = zip.file(new RegExp(`${soundName}\.(wav|ogg)$`, 'i'));
            if (soundFile.length > 0) {
                try {
                    const buffer = await soundFile[0].async('arraybuffer');
                    await Audio.loadSound(soundName, buffer);
                } catch(e) {
                    console.warn(`Failed to load beatmap sound: ${soundName}`);
                }
            }
        }
        
        return mapData;
    },
    
    async loadReplay(file) {
        const buffer = await file.arrayBuffer();
        return Parser.parseReplay(buffer);
    }
};
