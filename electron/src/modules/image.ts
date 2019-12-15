function image(tempPath: string, id: string) {
    const fs = require('fs');
    const { readdir } = require('fs').promises;
    const path = require('path');

    async function getFiles(dir) {
        const dirents = await readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map((dirent) => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        }));
        return Array.prototype.concat(...files);
    }

    return new Promise((resolve, reject) => {

        getFiles(tempPath).then(items => {
            const dataFile = items.find(x => x.indexOf(`${id}`) > -1);
            if (dataFile) {
                resolve(`data:image/jpg;base64,${new Buffer(fs.readFileSync(dataFile)).toString('base64')}`);
            }
        });

    });
}

module.exports = image;