"use strict";

var SHADER_VARIABLE_TYPES = [ 'attribute', 'uniform', 'varying' ];
var SHADER_DATA_TYPES = [ 'void', 'bool', 'int', 'float', 'vec2', 'vec3', 'vec4', 'bvec2', 'bvec3', 'bvec4', 'ivec2', 'ivec3', 'ivec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube' ];
// var SHADER_DATA_TYPES_MAP = {
//     'void': 0,
//     'bool': gl.BOOL,
//     'int': gl.INT,
//     'float': gl.FLOAT,
//     'vec2': gl.FLOAT_VEC2,
//     'vec3': gl.FLOAT_VEC3,
//     'vec4': gl.FLOAT_VEC4,
//     'bvec2': gl.BOOL_VEC2,
//     'bvec3': gl.BOOL_VEC3,
//     'bvec4': gl.BOOL_VEC4,
//     'ivec2': gl.INT_VEC2,
//     'ivec3': gl.INT_VEC3,
//     'ivec4': gl.INT_VEC4,
//     'mat2': gl.FLOAT_MAT2,
//     'mat3': gl.FLOAT_MAT3,
//     'mat4': gl.FLOAT_MAT4,
//     'sampler2D': gl.SAMPLER_2D,
//     'samplerCube': gl.SAMPLER_CUBE
// };

var REGEXP_SHADER = new RegExp('^\s*(' + SHADER_VARIABLE_TYPES.join('|') + ')\\s+(' + SHADER_DATA_TYPES.join('|') + ')\\s+([a-z0-9_]+);.*$', 'mgi');
var REGEXP_SHADER_VARIABLE = new RegExp('^(' + SHADER_VARIABLE_TYPES.join('|') + ')\\s+(' + SHADER_DATA_TYPES.join('|') + ')\\s+([a-z0-9_]+)(\\s*;\\s*//\\s*:([a-z0-9]+))?', 'mi');


function Shader(file) {
    Events.call(this);
    var self = this;

    this.file = file;
    this.type = this.file.indexOf('.vs') != -1 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    this.bin;

    this.attributes = [ ];
    this.uniforms = [ ];

    this.attribute = { };
    this.uniform = { };
    this.varying = { };
    this.meta = { };

    this._load();
}
Shader.prototype = Object.create(Events.prototype);

Shader.prototype._load = function() {
    new Load(this.file)
    .on('load', function(source) {

        var bin = gl.createShader(this.type);
        gl.shaderSource(bin, source);
        gl.compileShader(bin);

        if (! gl.getShaderParameter(bin, gl.COMPILE_STATUS)) {
            console.error('Couldn\' compile shader: ' + this.file);
            console.warn(gl.getShaderInfoLog(bin));
            gl.deleteShader(bin);
            this.emit('error', gl.getShaderInfoLog(bin));
            return;
        }

        this.delete();
        this.bin = bin;
        this.preprocess(source);
        this.emit('load', bin);

    }.bind(this))
    .on('error', function() {
        console.error('Couldn\'t load shader: ' + this.file);
        this.emit('error');
    }.bind(this));
};
Shader.prototype.reload = function() {
    this._load();
};
Shader.prototype.delete = function() {
    if (! this.bin) return;
    gl.deleteShader(this.bin);
    this.bin = null;
};
Shader.prototype.preprocess = function(source) {
    var raw = source.replace(/\/\*([^]*?)\*\//g, ''); // remove comment blocks
    var lines = raw.match(REGEXP_SHADER);
    if (! lines || ! lines.length) return;

    var line, match, kind, type, name, meta;

    for(var i = 0, len = lines.length; i < len; i++) {
        try {
            line = lines[i].trim();
            match = line.match(REGEXP_SHADER_VARIABLE);

            kind = match[1];
            // type = SHADER_DATA_TYPES_MAP[match[2]] || 0;
            type = match[2];
            name = match[3];
            meta = match[5];

            if (meta) {
                this[kind][meta] = name;
                this.meta[meta] = {
                    kind: kind,
                    type: type,
                    name: name,
                    meta: meta
                };
            }
            if (kind == 'attribute') {
                this.attributes.push(name);
            } else if (kind == 'uniform') {
                this.uniforms.push(name);
            }
        } catch(ex) {
            console.warn('error parsing shader', ex);
        }
    }
};


function Program(args) {
    Events.call(this);

    this.bin = null;

    this._attributes = { };
    this._uniforms = { };

    this.vs = (typeof(args.vs) == 'string') ? new Shader(args.vs) : args.vs;
    this.vs.on('load', this._link.bind(this));

    this.fs = (typeof(args.fs) == 'string') ? new Shader(args.fs) : args.fs;
    this.fs.on('load', this._link.bind(this));

    this.on('load', function() {
        if (args.attribute) this.attribute(args.attribute);
        this.attribute(this.vs.attributes);

        if (args.uniform) this.uniform(args.uniform);
        this.uniform(this.vs.uniforms);
        this.uniform(this.fs.uniforms);
    });

    this._link();
}
Program.prototype = Object.create(Events.prototype);

Program.prototype._link = function() {
    if (!this.vs || !this.vs.bin || !this.fs || !this.fs.bin) return;

    var bin = gl.createProgram();
    gl.attachShader(bin, this.vs.bin);
    gl.attachShader(bin, this.fs.bin);
    gl.linkProgram(bin);

    if (! gl.getProgramParameter(bin, gl.LINK_STATUS)) {
        console.error('could not initialise shaders');
        console.warn(gl.getProgramInfoLog(bin));
        gl.deleteProgram(bin);
        this.emit('error');
    } else {
        this.delete();
        this.bin = bin;
        gl.useProgram(this.bin);
        this.emit('load');
        this.unuse();
    }
};

Program.prototype.delete = function() {
    if (! this.bin) return;

    this._attributes = null;
    this._uniforms = null;

    if (this.vs) {
        this.vs.delete();
        this.vs = null;
    }
    if (this.fs) {
        this.fs.delete();
        this.fs = null;
    }
    if (this.bin) {
        gl.deleteProgram(this.bin);
        this.bin = null;
    }
}

Object.defineProperty(
    Program.prototype,
    'isLoaded', {
        get: function() { return !!this.bin; },
        set: function(value) { },
        enumerable: true,
        configurable: true
    }
);


Program.prototype.attribute = function(args) {
    if (! (args instanceof Array)) args = [ args ];

    for(var i = 0, len = args.length; i < len; ++i) {
        if (! this._attributes[args[i]]) {
            this._attributes[args[i]] = gl.getAttribLocation(this.bin, args[i]);
        }
    }
};


Program.prototype.point = function(name, length, size, offset) {
    if (this._attributes[name] != undefined) {
        gl.vertexAttribPointer(this._attributes[name], length, gl.FLOAT, false, size * 4, offset * 4);
    }
};

Program.prototype.uniform = function(args) {
    if (! (args instanceof Array)) args = [ args ];

    for(var i = 0, len = args.length; i < len; ++i) {
        if (! this._uniforms[args[i]]) {
            this._uniforms[args[i]] = gl.getUniformLocation(this.bin, args[i]);
        }
    }
};


Program.prototype.setMat4fv = function(name, value) {
    if (this._uniforms[name] === undefined) return;
    gl.uniformMatrix4fv(this._uniforms[name], false, value);
};
Program.prototype.setMat3fv = function(name, value) {
    if (this._uniforms[name] === undefined) return;
    gl.uniformMatrix3fv(this._uniforms[name], false, value);
};

Program.prototype.set1i = function(name, value) {
    if (this._uniforms[name] === undefined) return;
    gl.uniform1i(this._uniforms[name], value);
};

Program.prototype.set1f = function(name, value) {
    if (this._uniforms[name] === undefined) return;
    gl.uniform1f(this._uniforms[name], value);
};
Program.prototype.set2f = function(name, value) {
    if (this._uniforms[name] === undefined) return;
    gl.uniform2fv(this._uniforms[name], value);
};


Program.prototype.reload = function() {
    gl.detatchShader(this.bin, this.vs.bin);
    gl.detatchShader(this.bin, this.fs.bin);
    this.vs.reload();
    this.fs.reload();
};

Program.prototype.use = function() {
    gl.useProgram(this.bin);
    for(var name in this._attributes) {
        gl.enableVertexAttribArray(this._attributes[name]);
    }
};

Program.prototype.unuse = function() {
    gl.useProgram(null);
    for(var name in this._attributes) {
        gl.disableVertexAttribArray(this._attributes[name]);
    }
};