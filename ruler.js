function Ruler() {
    Events.call(this);

    this.width = 0;
    this.height = 0;

    this.element = document.createElement('div');

    this.element.css({
        position:   'fixed',
        top:        '0',
        right:      '0',
        bottom:     '0',
        left:       '0',
        width:      'auto',
        height:     'auto',
        visibility: 'hidden',
        opacity:    '0',
        zIndex:     '-1'
    });

    document.body.prepend(this.element);

    window.addEventListener('load',              this.check.bind(this), false);
    window.addEventListener('resize',            this.check.bind(this), false);
    window.addEventListener('orientationchange', this.check.bind(this), false);
    setInterval(this.check.bind(this), 200);

    this.check();
}
Ruler.prototype = Object.create(Events.prototype);


Ruler.prototype.check = function check() {
    var bounds = this.element.getBoundingClientRect();

    var width  = Math.floor(bounds.width);
    var height = Math.floor(bounds.height);

    if (width !== this.width || height !== this.height) {
        this.width  = width;
        this.height = height;

        this.emit('resize', width, height);
    }
};
