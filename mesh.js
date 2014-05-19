"use strict";



function VertexBuffer() {
    this.bin = gl.createBuffer();
    this.size = 0;
    this.length = 0;
    this.format = [ ];
}
VertexBuffer.prototype.delete = function() {
    gl.deleteBuffer(this.bin);
};
VertexBuffer.prototype.bind = function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bin);
};
VertexBuffer.prototype.set = function(data, size) {
    if (data instanceof Array) {
        data = new Float32Array(data);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bin);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    this.size = size;
    this.length = data.length / this.size;
};
VertexBuffer.prototype.formatClear = function() {
    this.format = [ ];
};
VertexBuffer.prototype.formatAdd = function(name, size, skip) {
    this.format.push({
        name: name,
        size: size,
        skip: skip || 0
    });
};


function IndexBuffer() {
    this.bin = gl.createBuffer();
    this.length = 0;
}
IndexBuffer.prototype.delete = function() {
    gl.deleteBuffer(this.bin);
};
IndexBuffer.prototype.bind = function() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bin);
};
IndexBuffer.prototype.set = function(data) {
    if (data instanceof Array) {
        data = new Uint16Array(data);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bin);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    this.length = data.length;
};
IndexBuffer.prototype.draw = function() {
    gl.drawElements(gl.TRIANGLES, this.length, gl.UNSIGNED_SHORT, 0);
};



function Mesh(parent, args) {
    SceneNode.call(this, parent, args);
    args = args || { };

    this.vertices = args.vertices || null;
    this.indices = args.indices || null;
    this.program = args.program || null;
    this.textures = args.textures || [ ];

    this.matNorm = mat3.create();
}
Mesh.prototype = Object.create(SceneNode.prototype);

Mesh.prototype.delete = function() {
    if (this.vertices) {
        this.vertices.delete();
        this.vertices = null;
    }
    if (this.indices) {
        this.indices.delete();
        this.indices = null;
    }
    if (this.program) {
        this.program.delete();
        this.program = null;
    }
};

Mesh.prototype.texture = function(texture, index) {
    this.textures[index] = texture;
};

Mesh.prototype.render = function() {
    if (this.program && ! this.program.isLoaded) return;

    for(var i = 0; i < this.textures.length; i++) {
        if (this.textures[i] && ! this.textures[i].isLoaded) {
            return;
        }
    }

    if (this.vertices) {
        this.vertices.bind();
    }
    if (this.indices) {
        this.indices.bind();
    }
    if (this.program) {
        this.program.use();

        if (this.vertices) {
            for (var i = 0, len = this.vertices.format.length; i < len; i++) {
                this.program.point(
                    this.program.vs.attribute[this.vertices.format[i].name] || this.vertices.format[i].name,
                    this.vertices.format[i].size,
                    this.vertices.size,
                    this.vertices.format[i].skip
                );
            }
        }

        this.program.setMat4fv(this.program.vs.uniform['MAT_PROJ'] || 'MAT_PROJ', camera._projection);
        this.program.setMat4fv(this.program.vs.uniform['MAT_WORLDVIEW'] || 'MAT_WORLDVIEW', this._world);

        mat3.normalFromMat4(this.matNorm, this._world);
        this.program.setMat3fv(this.program.vs.uniform['MAT_NORMAL'] || 'MAT_NORMAL', this.matNorm);

        for(var i = 0, len = this.textures.length; i < len; i++) {
            if (this.textures[i] && this.textures[i].isLoaded) {
                this.textures[i].bind(i);
                this.program.set1i(this.program.vs.uniform['TEXTURE' + i] || this.program.fs.uniform['TEXTURE' + i] || 'TEXTURE' + i, i);
            }
        }
        if (this.indices) {
            this.indices.draw();

            // if failed to draw,
            // has to check if all attributes
            // in shader were provided by vertices buffers
        }
    }
};


function Model(args) {
    Mesh.call(this, args);

    var self = this;

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var data = parseObj(this.responseText);
        console.log('parsed (' + data.time + 'ms): ' + args.file);

        self.vertices = new VertexBuffer();
        self.vertices.set(data.vertices, 8);
        self.vertices.formatAdd('POSITION0', 3, 0);
        self.vertices.formatAdd('TEXCOORDS0', 2, 3);
        self.vertices.formatAdd('NORMALS', 3, 5);

        self.indices = new IndexBuffer();
        self.indices.set(data.indices);
    };
    xhr.open('GET', args.file, true);
    xhr.send();
}
Model.prototype = Object.create(Mesh.prototype);


function Cube(parent, args) {
    Mesh.call(this, parent, args);

    this.vertices = new VertexBuffer();
    this.vertices.set([
        // front
        -1.0, -1.0,  1.0,   1.0, 1.0, 1.0, 1.0,   0.0, 0.0,   0.0,  0.0,  1.0,
         1.0, -1.0,  1.0,   1.0, 1.0, 1.0, 1.0,   1.0, 0.0,   0.0,  0.0,  1.0,
         1.0,  1.0,  1.0,   1.0, 1.0, 1.0, 1.0,   1.0, 1.0,   0.0,  0.0,  1.0,
        -1.0,  1.0,  1.0,   1.0, 1.0, 1.0, 1.0,   0.0, 1.0,   0.0,  0.0,  1.0,

        // back
        -1.0, -1.0, -1.0,   1.0, 0.0, 0.0, 1.0,   0.0, 0.0,   0.0,  0.0, -1.0,
        -1.0,  1.0, -1.0,   1.0, 0.0, 0.0, 1.0,   1.0, 0.0,   0.0,  0.0, -1.0,
         1.0,  1.0, -1.0,   1.0, 0.0, 0.0, 1.0,   1.0, 1.0,   0.0,  0.0, -1.0,
         1.0, -1.0, -1.0,   1.0, 0.0, 0.0, 1.0,   0.0, 1.0,   0.0,  0.0, -1.0,

        // top
        -1.0,  1.0, -1.0,   0.0, 1.0, 0.0, 1.0,   0.0, 0.0,   0.0, 0.0, -1.0,
        -1.0,  1.0,  1.0,   0.0, 1.0, 0.0, 1.0,   1.0, 0.0,   0.0, 0.0, -1.0,
         1.0,  1.0,  1.0,   0.0, 1.0, 0.0, 1.0,   1.0, 1.0,   0.0, 0.0, -1.0,
         1.0,  1.0, -1.0,   0.0, 1.0, 0.0, 1.0,   0.0, 1.0,   0.0, 0.0, -1.0,

        // bottom
        -1.0, -1.0, -1.0,   0.0, 0.0, 1.0, 1.0,   0.0, 0.0,   0.0, -1.0,  0.0,
         1.0, -1.0, -1.0,   0.0, 0.0, 1.0, 1.0,   1.0, 0.0,   0.0, -1.0,  0.0,
         1.0, -1.0,  1.0,   0.0, 0.0, 1.0, 1.0,   1.0, 1.0,   0.0, -1.0,  0.0,
        -1.0, -1.0,  1.0,   0.0, 0.0, 1.0, 1.0,   0.0, 1.0,   0.0, -1.0,  0.0,

        // right
         1.0, -1.0, -1.0,   1.0, 1.0, 0.0, 1.0,   0.0, 0.0,   1.0,  0.0,  0.0,
         1.0,  1.0, -1.0,   1.0, 1.0, 0.0, 1.0,   1.0, 0.0,   1.0,  0.0,  0.0,
         1.0,  1.0,  1.0,   1.0, 1.0, 0.0, 1.0,   1.0, 1.0,   1.0,  0.0,  0.0,
         1.0, -1.0,  1.0,   1.0, 1.0, 0.0, 1.0,   0.0, 1.0,   1.0,  0.0,  0.0,

        // left
        -1.0, -1.0, -1.0,   1.0, 0.0, 1.0, 1.0,   0.0, 0.0,  -1.0,  0.0,  0.0,
        -1.0, -1.0,  1.0,   1.0, 0.0, 1.0, 1.0,   1.0, 0.0,  -1.0,  0.0,  0.0,
        -1.0,  1.0,  1.0,   1.0, 0.0, 1.0, 1.0,   1.0, 1.0,  -1.0,  0.0,  0.0,
        -1.0,  1.0, -1.0,   1.0, 0.0, 1.0, 1.0,   0.0, 1.0,  -1.0,  0.0,  0.0
    ], 12);
    this.vertices.formatAdd('POSITION0', 3, 0);
    this.vertices.formatAdd('COLOR0', 4, 3);
    this.vertices.formatAdd('TEXCOORDS0', 2, 7);
    this.vertices.formatAdd('NORMALS', 3, 9);

    this.indices = new IndexBuffer();
    this.indices.set([
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
    ]);
}
Cube.prototype = Object.create(Mesh.prototype);


function Sphere(parent, args) {
    Mesh.call(this, parent, args);
    args = args || { };

    var latitudeBands = 128;
    var longitudeBands = 128;
    var radius = args.radius || 1;
    var size = 18;

    var vertices = [ ];
    for (var lat = 0; lat <= latitudeBands; lat++) {
        var theta = lat * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var lng = 0; lng <= longitudeBands; lng++) {
            var phi = lng * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (lng / longitudeBands);
            var v = 1 - (lat / latitudeBands);

            // position
            vertices.push(radius * x); // x
            vertices.push(radius * y); // y
            vertices.push(radius * z); // z
            // normal
            vertices.push(x); // nx
            vertices.push(y); // ny
            vertices.push(z); // nz
            // tangent
            vertices.push(0); // tx
            vertices.push(0); // ty
            vertices.push(0); // tz
            // binormal
            vertices.push(0); // bx
            vertices.push(0); // by
            vertices.push(0); // bz
            // color
            vertices.push(1.0); // r
            vertices.push(1.0); // g
            vertices.push(1.0); // b
            vertices.push(1.0); // a
            // uv
            vertices.push(u); // u
            vertices.push(v); // v
        }
    }

    this.vertices = new VertexBuffer();
    this.vertices.set(vertices, size);

    this.vertices.formatAdd('POSITION0', 3, 0);
    this.vertices.formatAdd('NORMALS', 3, 3);
    this.vertices.formatAdd('TANGENT', 3, 6);
    this.vertices.formatAdd('BINORMAL', 3, 9);
    this.vertices.formatAdd('COLOR0', 4, 12);
    this.vertices.formatAdd('TEXCOORDS0', 2, 16);


    var indices = [ ];
    for (var lat = 0; lat < latitudeBands; lat++) {
        for (var lng = 0; lng < longitudeBands; lng++) {
            var first = (lat * (longitudeBands + 1)) + lng;
            var second = first + longitudeBands + 1;
            indices.push(first);
            indices.push(first + 1);
            indices.push(second);

            indices.push(second);
            indices.push(first + 1);
            indices.push(second + 1);


            var v0 = this._getVertex(vertices, size, first);
            var v1 = this._getVertex(vertices, size, first + 1);
            var v2 = this._getVertex(vertices, size, (lat * (longitudeBands + 1)));

            var r = this._generateNormalAndTangent(v0.p, v1.p, v0.t, v1.t);

            vertices[first * size + 6] = r[0];
            vertices[first * size + 7] = r[1];
            vertices[first * size + 8] = r[2];

            if (lng == longitudeBands - 1) {
                v1.t[0] = (1.0 / longitudeBands);
                v2.t[0] = 0;

                var r = this._generateNormalAndTangent(v1.p, v2.p, v1.t, v2.t);

                vertices[(first + 1) * size + 6] = r[0];
                vertices[(first + 1) * size + 7] = r[1];
                vertices[(first + 1) * size + 8] = r[2];
            }
        }
    }

    this.indices = new IndexBuffer();
    this.indices.set(indices)
}
Sphere.prototype = Object.create(Mesh.prototype);

Sphere.prototype._getVertex = function(buffer, size, ind) {
    var p = vec3.create();
    p[0] = buffer[ind * size];
    p[1] = buffer[ind * size + 1];
    p[2] = buffer[ind * size + 2];

    var t = vec2.create();
    t[0] = buffer[ind * size + 16];
    t[1] = buffer[ind * size + 17];

    return {
        p: p,
        t: t
    }
};

Sphere.prototype._generateNormalAndTangent = function(v1, v2, st1, st2) {
    var coef = 1.0 / (st1[0] * st2[1] - st2[0] * st1[1]);
    var tangent = vec3.create();

    tangent[0] = coef * ((v1[0] * st2[1]) + (v2[0] * -st1[1]));
    tangent[1] = coef * ((v1[1] * st2[1]) + (v2[1] * -st1[1]));
    tangent[2] = coef * ((v1[2] * st2[1]) + (v2[2] * -st1[1]));

    return tangent;
};