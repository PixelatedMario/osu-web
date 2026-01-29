export const Renderer = {
    app: null,
    container: null,
    hitContainer: null,
    cursorContainer: null,
    scale: 1,
    offset: { x: 0, y: 0 },
    assets: {},
    
    init(canvas) {
        this.app = new PIXI.Application({
            view: canvas,
            resizeTo: window,
            backgroundAlpha: 0,
            antialias: true
        });
        
        this.container = new PIXI.Container();
        this.hitContainer = new PIXI.Container();
        this.cursorContainer = new PIXI.Container();
        
        this.container.addChild(this.hitContainer);
        this.app.stage.addChild(this.container);
        this.app.stage.addChild(this.cursorContainer);
        
        this.createDefaultAssets();
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
    },
    
    createDefaultAssets() {
        const g = new PIXI.Graphics();
        
        g.clear().lineStyle(4, 0xFFFFFF).beginFill(0x222222, 0.9).drawCircle(0, 0, 50);
        this.assets['hitcircle'] = this.app.renderer.generateTexture(g);
        
        g.clear().lineStyle(3, 0xFFFFFF).drawCircle(0, 0, 50);
        this.assets['approach'] = this.app.renderer.generateTexture(g);
        
        g.clear().beginFill(0x444444, 0.8).drawCircle(0, 0, 45);
        this.assets['sliderbody'] = this.app.renderer.generateTexture(g);
        
        g.clear().beginFill(0xFF0055).drawCircle(0, 0, 15).lineStyle(2, 0xFFFFFF).drawCircle(0, 0, 15);
        this.assets['cursor'] = this.app.renderer.generateTexture(g);
        
        g.clear().lineStyle(3, 0xFFFFFF, 0.8).drawCircle(0, 0, 100);
        this.assets['spinner-circle'] = this.app.renderer.generateTexture(g);
    },
    
    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ratio = 4 / 3;
        
        if (w / h > ratio) {
            this.scale = h / 384 * 0.8;
        } else {
            this.scale = w / 512 * 0.9;
        }
        
        this.offset.x = (w - 512 * this.scale) / 2;
        this.offset.y = (h - 384 * this.scale) / 2;
        
        this.container.x = this.offset.x;
        this.container.y = this.offset.y;
        this.container.scale.set(this.scale);
    },
    
    spawnCircle(obj, radius) {
        const c = new PIXI.Container();
        c.x = obj.x;
        c.y = obj.y;
        
        const circleTexture = this.assets['hitcircle'] || this.assets['hitcircle'];
        const circle = new PIXI.Sprite(circleTexture);
        circle.anchor.set(0.5);
        circle.width = circle.height = radius * 2;
        circle.tint = 0x66ccff;
        
        const approachTexture = this.assets['approachcircle'] || this.assets['approach'];
        const appCircle = new PIXI.Sprite(approachTexture);
        appCircle.anchor.set(0.5);
        appCircle.name = "approach";
        appCircle.width = appCircle.height = radius * 2;
        
        c.addChild(circle, appCircle);
        return c;
    },
    
    spawnSlider(obj, radius) {
        const c = new PIXI.Container();
        c.x = obj.x;
        c.y = obj.y;
        
        const bodyTexture = this.assets['sliderbody'] || this.assets['sliderbody'];
        const body = new PIXI.Sprite(bodyTexture);
        body.anchor.set(0.5);
        body.width = body.height = radius * 2;
        body.tint = 0xffcc00;
        
        const approachTexture = this.assets['approachcircle'] || this.assets['approach'];
        const appCircle = new PIXI.Sprite(approachTexture);
        appCircle.anchor.set(0.5);
        appCircle.name = "approach";
        appCircle.width = appCircle.height = radius * 2;
        
        c.addChild(body, appCircle);
        return c;
    },
    
    spawnSpinner(obj) {
        const c = new PIXI.Container();
        c.x = 256;
        c.y = 192;
        
        const spinnerTexture = this.assets['spinner-circle'] || this.assets['spinner-circle'];
        const spinner = new PIXI.Sprite(spinnerTexture);
        spinner.anchor.set(0.5);
        spinner.name = "spinner-visual";
        
        c.addChild(spinner);
        return c;
    }
};
