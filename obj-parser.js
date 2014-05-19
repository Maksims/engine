function parseObj(raw) {
    var start = Date.now();
    var lines = raw.split('\n');

    var vertices = [ ];

    var positions = [ ];
    var textures = [ ];
    var normals = [ ];
    var indices = [ ];

    var line = '';
    var type = '';
    var parts;
    var v, i, len;
    var bits, pos, tex, norm;

    for(var l = 0; l < lines.length; l++) {
        line = lines[l];

        if (line.length === 0) continue;

        type = line.substr(0, line.indexOf(' '));

        switch(type) {
            case 'v':
                parts = line.substr(2).split(' ');
                positions.push(parseFloat(parts[0], 10), parseFloat(parts[1], 10), parseFloat(parts[2], 10));
                break;
            case 'f':
                parts = line.substr(2).split(' ');

                if (/^\d+$/.test(parts[0])) {
                    // v1 v2 v3 . . .
                    i = parts.length;
                    while(i--) {
                        parts[i] = parseInt(parts[i], 10);

                        vertices[parts[i] * 8 + 0] = positions[parts[i] * 3 + 0];
                        vertices[parts[i] * 8 + 1] = positions[parts[i] * 3 + 1];
                        vertices[parts[i] * 8 + 2] = positions[parts[i] * 3 + 2];
                        vertices[parts[i] * 8 + 3] = 0;
                        vertices[parts[i] * 8 + 4] = 0;
                        vertices[parts[i] * 8 + 5] = 0;
                        vertices[parts[i] * 8 + 6] = 1;
                        vertices[parts[i] * 8 + 7] = 0;
                    }
                } else if (/^\d+\/\d+$/.test(parts[0])) {
                    // v1/vt1 v2/vt2 v3/vt3 . . .
                    i = parts.length;
                    while(i--) {
                        bits = parts[i].split('/');
                        parts[i] = parseInt(bits[0], 10) - 1;
                        tex = parseInt(bits[1], 10) - 1;

                        vertices[parts[i] * 8 + 0] = positions[parts[i] * 3 + 0];
                        vertices[parts[i] * 8 + 1] = positions[parts[i] * 3 + 1];
                        vertices[parts[i] * 8 + 2] = positions[parts[i] * 3 + 2];
                        vertices[parts[i] * 8 + 3] = textures[tex * 2 + 0];
                        vertices[parts[i] * 8 + 4] = textures[tex * 2 + 1];
                        vertices[parts[i] * 8 + 5] = 0;
                        vertices[parts[i] * 8 + 6] = 1;
                        vertices[parts[i] * 8 + 7] = 0;
                    }
                } else if (/^\d+\/\/\d+$/.test(parts[0])) {
                    // v1//vn1 v2//vn2 v3//vn3 . . .
                    i = parts.length;
                    while(i--) {
                        bits = parts[i].split('//');
                        parts[i] = parseInt(bits[0], 10) - 1;
                        norm = parseInt(bits[1], 10) - 1;

                        vertices[parts[i] * 8 + 0] = positions[parts[i] * 3 + 0];
                        vertices[parts[i] * 8 + 1] = positions[parts[i] * 3 + 1];
                        vertices[parts[i] * 8 + 2] = positions[parts[i] * 3 + 2];
                        vertices[parts[i] * 8 + 3] = 0;
                        vertices[parts[i] * 8 + 4] = 0;
                        vertices[parts[i] * 8 + 5] = normals[norm * 3 + 0];
                        vertices[parts[i] * 8 + 6] = normals[norm * 3 + 1];
                        vertices[parts[i] * 8 + 7] = normals[norm * 3 + 2];
                    }
                } else if (/^\d+\/\d+\/\d+$/.test(parts[0])) {
                    // v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 . . .
                    i = parts.length;
                    while(i--) {
                        bits = parts[i].split('/');
                        parts[i] = parseInt(bits[0], 10) - 1;
                        tex = parseInt(bits[1], 10) - 1;
                        norm = parseInt(bits[2], 10) - 1;

                        vertices[parts[i] * 8 + 0] = positions[parts[i] * 3 + 0];
                        vertices[parts[i] * 8 + 1] = positions[parts[i] * 3 + 1];
                        vertices[parts[i] * 8 + 2] = positions[parts[i] * 3 + 2];
                        vertices[parts[i] * 8 + 3] = textures[tex * 2 + 0];
                        vertices[parts[i] * 8 + 4] = textures[tex * 2 + 1];
                        vertices[parts[i] * 8 + 5] = normals[norm * 3 + 0];
                        vertices[parts[i] * 8 + 6] = normals[norm * 3 + 1];
                        vertices[parts[i] * 8 + 7] = normals[norm * 3 + 2];
                    }
                }

                // triangle fan
                if (typeof(parts[0]) == 'number') {
                    for(i = 0, len = parts.length; i < len - 2; i++) {
                        indices.push(parts[0]);
                        indices.push(parts[i + 1]);
                        indices.push(parts[i + 2]);
                    }
                }
                break;
            case 'vt':
                parts = line.substr(3).split(' ');
                textures.push(parseFloat(parts[0], 10), parseFloat(parts[1], 10));
                break;
            case 'vn':
                parts = line.substr(3).split(' ');
                normals.push(parseFloat(parts[0], 10), parseFloat(parts[1], 10), parseFloat(parts[2], 10));
                break;
        }
    }

    return {
        vertices: vertices,
        indices: indices,
        time: Date.now() - start
    };
};