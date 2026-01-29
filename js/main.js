import { Loader } from './loader.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { Audio } from './audio.js';

const canvas = document.getElementById('game-canvas');
Renderer.init(canvas);

const ui = {
    mapBtn: document.getElementById('btn-map'),
    skinBtn: document.getElementById('btn-skin'),
    replayBtn: document.getElementById('btn-replay'),
    playBtn: document.getElementById('play-btn'),
    watchBtn: document.getElementById('watch-btn'),
    mapInput: document.getElementById('file-input-map'),
    skinInput: document.getElementById('file-input-skin'),
    replayInput: document.getElementById('file-input-replay'),
    status: document.getElementById('status'),
    menu: document.getElementById('menu-layer'),
    gameOverlay: document.getElementById('ui-layer'),
    dimSlider: document.getElementById('dim-slider'),
    blurSlider: document.getElementById('blur-slider'),
    bgOverlay: document.getElementById('bg-overlay'),
    bgLayer: document.getElementById('bg-layer')
};

let currentMap = null;

ui.mapBtn.onclick = () => ui.mapInput.click();
ui.skinBtn.onclick = () => ui.skinInput.click();
ui.replayBtn.onclick = () => ui.replayInput.click();

ui.mapInput.onchange = async (e) => {
    if (!e.target.files[0]) return;
    ui.status.innerText = "Loading Map...";
    try {
        currentMap = await Loader.loadMap(e.target.files[0]);
        ui.status.innerText = `Loaded: ${currentMap.Metadata.Title || 'Unknown'} - ${currentMap.Metadata.Artist || 'Unknown'}`;
        ui.playBtn.classList.remove('hidden');
        ui.replayBtn.disabled = false;
    } catch (err) {
        console.error(err);
        ui.status.innerText = "Error loading map: " + err.message;
    }
};

ui.skinInput.onchange = async (e) => {
    if (!e.target.files[0]) return;
    ui.status.innerText = "Loading Skin...";
    try {
        await Loader.loadSkin(e.target.files[0]);
        ui.status.innerText = "Skin Loaded";
    } catch (err) {
        console.error(err);
        ui.status.innerText = "Error loading skin: " + err.message;
    }
};

ui.playBtn.onclick = () => {
    ui.menu.classList.add('hidden');
    ui.gameOverlay.classList.remove('hidden');
    Game.start(currentMap);
};

ui.dimSlider.oninput = (e) => {
    ui.bgOverlay.style.opacity = e.target.value / 100;
};

ui.blurSlider.oninput = (e) => {
    ui.bgLayer.style.filter = `blur(${e.target.value}px)`;
};

window.addEventListener('mousemove', e => {
    Game.cursor.x = e.clientX;
    Game.cursor.y = e.clientY;
});

window.addEventListener('mousedown', e => Game.cursor.down = true);
window.addEventListener('mouseup', e => Game.cursor.down = false);

window.addEventListener('keydown', e => {
    if (e.key === 'z' || e.key === 'x') Game.cursor.down = true;
});

window.addEventListener('keyup', e => {
    if (e.key === 'z' || e.key === 'x') Game.cursor.down = false;
});
