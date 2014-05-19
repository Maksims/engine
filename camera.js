function Camera(parent, args) {
    SceneNode.call(this, parent, args);
    args = args || { };

    this._projection = mat4.create();
    this._near = args.near || 1;
    this._far = args.far || 1024;
    this._fov = args.fov || 45;
}
Camera.prototype = Object.create(SceneNode.prototype);

// near
Object.defineProperty(
    Camera.prototype,
    'near', {
        get: function() {
            return this._near;
        },
        set: function(value) {
            this._near = value;
        },
        enumerable: true
    }
);

// far
Object.defineProperty(
    Camera.prototype,
    'far', {
        get: function() {
            return this._far;
        },
        set: function(value) {
            this._far = value;
        },
        enumerable: true
    }
);

// fov
Object.defineProperty(
    Camera.prototype,
    'fov', {
        get: function() {
            return this._fov;
        },
        set: function(value) {
            this._fov = value;
        },
        enumerable: true
    }
);

Camera.prototype.render = function() {
    mat4.perspective(this._projection, this._fov, vp.size[0] / vp.size[1], this._near, this._far);
    mat4.invert(_tmp_mat4, this._world);
    mat4.mul(this._projection, this._projection, _tmp_mat4);
};