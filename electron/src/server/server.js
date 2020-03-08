const http = require('http');
const fs = require('fs');
const path = require('path');

const ipc = require('electron').ipcRenderer;

let port = 0;
let tempPath = '';

async function getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, {withFileTypes: true});
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

const server = http.createServer((req, res) => {
    getFiles(tempPath).then(files => {
        const file = files.find(k => k.indexOf(req.url.replace('/', '')) > -1);
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        res.end(fs.readFileSync(file));
    });
    res.writeHead(404);
});

server.listen(0);
server.on('listening', function () {
    port = server.address().port;
    console.log(port);
    ipc.send('web-server-config', JSON.stringify({
        port: port
    }));
});

ipc.on('temp-path', (e, x) => {
    tempPath = x;
});

ipc.on('new-port', (e, x) => {
    ipc.send('web-server-config', JSON.stringify({
        port: port
    }));
});
