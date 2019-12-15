function image(tempPath: string, id: string) {
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve, reject) => {
        const f = fs.readFileSync(path.join(tempPath, 'images.json'));
        const e = JSON.parse(f);
        if (e[id]) {
            resolve(`data:image/jpg;base64,${new Buffer(fs.readFileSync(e[id])).toString('base64')}`);
        } else {
            resolve('');
        }
    });
}

module.exports = image;