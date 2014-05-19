"use strict";

function Load(url) {
    Events.call(this);

    this.progress = 0;
    this.xhr = new XMLHttpRequest();

    this.xhr.open('GET', url, true);

    this.xhr.addEventListener('load', function(e) {
        if (e.target.status == 200 && e.target.readyState == 4) {
            this.data = e.target.responseText;
            this.emit('load', this.data);
        } else {
            this.emit('error');
        }
    }.bind(this));

    this.xhr.addEventListener('error', function(err) {
        this.emit('error', err);
    }.bind(this));

    this.xhr.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            this.progress = e.loaded / e.total;
            this.emit('progress', this.progress);
        }
    }.bind(this));

    this.xhr.send();
}
Load.prototype = Object.create(Events.prototype);
