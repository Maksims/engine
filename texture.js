"use strict";

function Texture(type) {
    Events.call(this);

    this.bin;
    this.type = type;
    this.width = 0;
    this.height = 0;
}
Texture.prototype = Object.create(Events.prototype);

Texture.prototype.bind = function() {

}

Object.defineProperty(
    Texture.prototype,
    'isLoaded', {
        get: function() { return !!this.bin; },
        set: function(value) { },
        enumerable: true,
        configurable: true
    }
);

Texture.prototype.bind = function(index) {
    if (! this.bin) return;
    gl.activeTexture(gl.TEXTURE0 + (index || 0));
    gl.bindTexture(this.type, this.bin);
};

Texture.prototype.unbind = function(index) {
    if (! this.bin) return;
    gl.activeTexture(gl.TEXTURE0 + (index || 0));
    gl.bindTexture(this.type, null);
};

Texture.prototype.delete = function() {
    if (this.image) {
        this.image.src = '';
        this.image = null;
    }
    if (this.bin) {
        gl.deleteTexture(this.bin);
        this.bin = null;
    }
};


function Texture2D(image) {
    Texture.call(this, gl.TEXTURE_2D);

    this.image = (image instanceof Image) ? image : new Image();

    if (typeof(image) == 'string') {
        this.image.src = image;
    }

    if (this.image.complete) {
        this.onImageLoad();
    } else {
        this.image.onload = this.onImageLoad.bind(this);
    }
}
Texture2D.prototype = Object.create(Texture.prototype);

Texture2D.prototype.delete = function() {
    this.image.src = '';
    this.image = null;

    this.__proto__.__proto__.delete();
};

Texture2D.prototype.onImageLoad = function() {
    this.width = this.image.width;
    this.height = this.image.height;
    this.imageToTexture();
};

Texture2D.prototype.imageToTexture = function() {
    if (this.bin) return;

    this.bin = gl.createTexture();

    gl.bindTexture(this.type, this.bin);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(this.type, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var ext = (
        gl.getExtension('EXT_texture_filter_anisotropic') ||
        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
        gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
        gl.getExtension('OP_EXT_texture_filter_anisotropic')
    );
    if (ext) {
        gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(this.type, ext.TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    } else {
        gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(this.type);
    }

    gl.bindTexture(this.type, null);
};


function TextureCube(images) {
    Texture.call(this, gl.TEXTURE_CUBE_MAP);

    this.images = [ ];
    this.loaded = 0;

    for(var i = 0; i < 6; i++) {
        this.images[i] = (images[i] instanceof Image) ? images[i] : new Image();

        if (typeof(images[i]) == 'string') {
            this.images[i].src = images[i];
        }

        if (this.images[i].complete) {
            this.onImageLoad();
        } else {
            this.images[i].onload = this.onImageLoad.bind(this);
        }
    }
}
TextureCube.prototype = Object.create(Texture.prototype);

TextureCube.prototype.delete = function() {
    for(var i = 0; i < 6; i++) {
        this.images.src = '';
        this.images[i] = null;
    }

    this.__proto__.__proto__.delete();
};

TextureCube.prototype.onImageLoad = function() {
    this.loaded++;

    if (this.loaded == 6) {
        this.width = this.images[0].width;
        this.height = this.images[0].height;
        this.imageToTexture();
    }
};

TextureCube.prototype.imageToTexture = function() {
    if (this.bin) return;

    this.bin = gl.createTexture();

    gl.bindTexture(this.type, this.bin);

    gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    for(var i = 0; i < 6; i++) {
        gl.bindTexture(this.type, this.bin);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.images[i]);
    }

    /*
    var ext = (
        gl.getExtension('EXT_texture_filter_anisotropic') ||
        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
        gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
        gl.getExtension('OP_EXT_texture_filter_anisotropic')
    );
    if (ext) {
        gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(this.type, ext.TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    } else {
        gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(this.type);
    }
    */

    gl.bindTexture(this.type, null);
};