var WEBGL_CONTEXTS = [ 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl' ];

function Viewport(args) {
    Events.call(this);

    args = args || { };

    this.targetFPS = 60;
    this.rendering;

    this.now = Date.now();
    this.lastTime = this.now;
    this.lastFPS = 0;
    this.fps = 0;
    this.ticks = 0;
    this.dt = 1.0;

    this.size = vec2.fromValues(Math.floor(args.width || 0), Math.floor(args.height || 0));

    this.canvas = args.canvas || document.createElement('canvas');

    this.canvas.width = this.size[0];
    this.canvas.height = this.size[1];

    this.gl = null;
    this.type = '';

    this.getContext();
    this.gl.getExtension('OES_standard_derivatives');

    this.fullscreen = false;
}
Viewport.prototype = Object.create(Events.prototype);


Viewport.prototype.getContext = function() {
    for(var i = 0, len = WEBGL_CONTEXTS.length; i < len; ++i) {
        try {
            this.gl = this.canvas.getContext(WEBGL_CONTEXTS[i]);
            if (this.gl) {
                this.type = WEBGL_CONTEXTS[i];
                this.emit('context');
                return true;
            }
        } catch(e) {
            console.warn(e);
            console.log(e.stack);
        }
    }
    // this.emit('context:error');
    return false;
};

Viewport.prototype.resize = function(width, height) {
    width = Math.floor(width || 0);
    height = Math.floor(height || 0);

    if (this.size[0] !== width || this.size[1] !== height) {

        this.size[0] = this.canvas.width = width;
        this.size[1] = this.canvas.height = height;

        this.emit('resize', width, height);
        if (this.rendering) this.render();
    }
};

Viewport.prototype.start = function() {
    if (this.rendering) return;

    this.emit('start');
    this.rendering = setInterval(this.render.bind(this), 1000 / this.targetFPS);
    this.render();
};

Viewport.prototype.stop = function() {
    if (! this.rendering) return;

    this.emit('stop');
    clearInterval(this.rendering);
    this.rendering = null;
};

Viewport.prototype.render = function() {
    this.lastTime = this.now;
    this.now = Date.now();

    if (this.lastFPS + 1000 < this.now) {
        this.lastFPS = this.now;
        this.fps = this.ticks;
        this.ticks = 0;
        this.emit('fps', this.fps);
    }
    this.ticks++;
    this.dt = (this.now - this.lastTime) / (1000 / 60);

    this.emit('render');
};

Object.defineProperty(
    Viewport.prototype,
    'fullscreen', {
        get: function() {
            return window.fullScreen || (window.innerWidth == screen.width && window.innerHeight == screen.height);
        },
        set: function() { },
        enumerable: true
    }
);

Viewport.prototype.fullscreenRequest = function() {
    if (this.fullscreen) return;

    if (this.canvas.requestFullscreen) {
        this.canvas.requestFullscreen();
    } else if (this.canvas.msRequestFullscreen) {
        this.canvas.msRequestFullscreen();
    } else if (this.canvas.mozRequestFullScreen) {
        this.canvas.mozRequestFullScreen();
    } else if (this.canvas.webkitRequestFullscreen) {
        this.canvas.webkitRequestFullscreen();
    } else {
        return;
    }

    this.emit('fullscreen', true);
};

Viewport.prototype.fullscreenExit = function() {
    if (! this.fullscreen) return;

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else {
        return;
    }

    this.emit('fullscreen', false);
};

Viewport.prototype.pointerLockRequest = function() {
    if (this.canvas.requestPointerLock) {
        this.canvas.requestPointerLock();
    } else if (this.canvas.mozRequestPointerLock) {
        this.canvas.mozRequestPointerLock();
    } else if (this.canvas.webkitRequestPointerLock) {
        this.canvas.webkitRequestPointerLock();
    }
};