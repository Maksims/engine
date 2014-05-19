var _tmp_vec3 = vec3.create();
var _tmp_quat_x = quat.create();
var _tmp_quat_y = quat.create();
var _tmp_quat_z = quat.create();
var _tmp_mat3 = mat3.create();
var _tmp_mat4 = mat4.create();


function SceneNode(parent) {
    Events.call(this);

    this.name = ''

    this._world = mat4.create();
    this._local = mat4.create();

    this._position = vec3.create();
    this._rotation = quat.create();
    this._scale = vec3.fromValues(1, 1, 1);

    // _parent
    Object.defineProperty(
        this,
        '_parent', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: parent || null
        }
    );

    this.children = [ ];

    if (this._parent) {
        this._parent.children.push(this);
    }
}
SceneNode.prototype = Object.create(Events.prototype);

SceneNode.prototype.delete = function() {
    // cache this.mat
};

SceneNode.prototype.render = function() {
    if (! this._parent) {
        this._render();
    }
};

SceneNode.prototype._render = function() {
    if (this._parent) {
        this.render();
    }

    var i = this.children.length;
    while(i--) {
        this.children[i]._render();
    }
};


// parent
Object.defineProperty(
    SceneNode.prototype,
    'parent', {
        get: function() {
            return this._parent;
        },
        set: function(value) {
            if (!(parent instanceof SceneNode)) {
                throw new Error('parent should be an SceneNode')
            }

            if (this._parent) {
                this._parent.children.splice(this._parent.children.indexOf(this), 1);
            }

            this._parent = value;

            if (this._parent) {
                this._parent.children.push(this);
            }
        },
        enumerable: true
    }
);

SceneNode.prototype.updateMatrix = function(local) {
    if (local) {
        mat4.fromRotationTranslation(this._local, this._rotation, this._position);
        mat4.scale(this._local, this._local, this._scale);
    }

    if (! this._parent) {
        mat4.copy(this._world, this._local);
    } else {
        mat4.mul(this._world, this._parent._world, this._local);
    }

    var i = this.children.length;
    while(i--) {
        this.children[i].updateMatrix();
    }
};


SceneNode.prototype.move = function(x, y, z, global) {
    if (global) {
        if (this._parent) {
            mat4.invert(_tmp_mat4, this._parent._world);
            vec3.transformMat4(_tmp_vec3, [ x || 0, y || 0, -(z || 0) ], _tmp_mat4);
            vec3.add(this._position, this._position, _tmp_vec3);
        } else {
            vec3.add(this._position, this._position, [ x || 0, y || 0, -(z || 0) ]);
        }
    } else {
        vec3.set(_tmp_vec3, x || 0, y || 0, -(z || 0));
        vec3.transformQuat(_tmp_vec3, _tmp_vec3, this._rotation);
        vec3.add(this._position, this._position, _tmp_vec3);
    }
    this.updateMatrix(true);
};

SceneNode.prototype.position = function(x, y, z, global) {
    if (global) {
        if (this._parent) {
            mat4.invert(_tmp_mat4, this._parent._world);
            vec3.transformMat4(this._position, [ x || 0, y || 0, -(z || 0) ], _tmp_mat4);
        } else {
            vec3.set(this._position, x || 0, y || 0, -(z || 0));
        }
    } else {
        vec3.set(this._position, x || 0, y || 0, -(z || 0));
    }
    this.updateMatrix(true);
};

SceneNode.prototype.turn = function(pitch, yaw, roll, global) {
    if (global) {
        // TODO
    } else {
        quat.setAxisAngle(_tmp_quat_x, [ -1, 0, 0 ], (pitch || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_y, [ 0, -1, 0 ], (yaw || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_z, [ 0, 0, -1 ], (roll || 0) * ANGLE_RAD);
        quat.mul(this._rotation, this._rotation, _tmp_quat_x);
        quat.mul(this._rotation, this._rotation, _tmp_quat_y);
        quat.mul(this._rotation, this._rotation, _tmp_quat_z);
    }

    this.updateMatrix(true);
};

SceneNode.prototype.rotate = function(pitch, yaw, roll, global) {
    if (global && this._parent) {
        mat3.fromMat4(_tmp_mat3, this._parent._world);
        quat.fromMat3(this._rotation, _tmp_mat3);

        quat.setAxisAngle(_tmp_quat_x, [ -1, 0, 0 ], (pitch || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_y, [ 0, -1, 0 ], (yaw || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_z, [ 0, 0, -1 ], (roll || 0) * ANGLE_RAD);
        quat.mul(this._rotation, this._rotation, _tmp_quat_x);
        quat.mul(this._rotation, this._rotation, _tmp_quat_y);
        quat.mul(this._rotation, this._rotation, _tmp_quat_z);
    } else {
        quat.setAxisAngle(_tmp_quat_x, [ -1, 0, 0 ], (pitch || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_y, [ 0, -1, 0 ], (yaw || 0) * ANGLE_RAD);
        quat.setAxisAngle(_tmp_quat_z, [ 0, 0, -1 ], (roll || 0) * ANGLE_RAD);
        quat.mul(this._rotation, _tmp_quat_x, _tmp_quat_y);
        quat.mul(this._rotation, this._rotation, _tmp_quat_z);
    }
    this.updateMatrix(true);
};


// x
Object.defineProperty(
    SceneNode.prototype,
    'x', {
        get: function() {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(_tmp_vec3, this._position, _tmp_quat_x);
            return _tmp_vec3[0];
        },
        set: function(value) {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(this._position, this._position, _tmp_quat_x);
            this._position[0] = value || 0;
            vec3.transformQuat(this._position, this._position, this._rotation);
            this.updateMatrix(true);
        },
        enumerable: true
    }
);

// y
Object.defineProperty(
    SceneNode.prototype,
    'y', {
        get: function() {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(_tmp_vec3, this._position, _tmp_quat_x);
            return _tmp_vec3[1];
        },
        set: function(value) {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(this._position, this._position, _tmp_quat_x);
            this._position[1] = value || 0;
            vec3.transformQuat(this._position, this._position, this._rotation);
            this.updateMatrix(true);
        },
        enumerable: true
    }
);

// z
Object.defineProperty(
    SceneNode.prototype,
    'z', {
        get: function() {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(_tmp_vec3, this._position, _tmp_quat_x);
            return -_tmp_vec3[2];
        },
        set: function(value) {
            quat.invert(_tmp_quat_x, this._rotation);
            vec3.transformQuat(this._position, this._position, _tmp_quat_x);
            this._position[2] = -(value || 0);
            vec3.transformQuat(this._position, this._position, this._rotation);
            this.updateMatrix(true);
        },
        enumerable: true
    }
);


// pitch
Object.defineProperty(
    SceneNode.prototype,
    'pitch', {
        get: function() {
            return quat.pitch(this._rotation) * RAD_ANGLE;
        },
        set: function(value) {
            // TODO
        },
        enumerable: true
    }
);


// yaw
Object.defineProperty(
    SceneNode.prototype,
    'yaw', {
        get: function() {
            return quat.yaw(this._rotation) * RAD_ANGLE;
        },
        set: function(value) {
            // TODO
        },
        enumerable: true
    }
);

// roll
Object.defineProperty(
    SceneNode.prototype,
    'roll', {
        get: function() {
            return quat.roll(this._rotation) * RAD_ANGLE;
        },
        set: function(value) {
            // TODO
        },
        enumerable: true
    }
);
