function unzip(path: string) {
    const AdmZip = require('adm-zip');
    const temp = require('temp');

    return new Promise((resolve, reject) => {

        const zip = new AdmZip(path);
        const e = zip.getEntries();

        e.forEach((ee: any | { entryName: string }) => {
            if (ee.entryName.indexOf('.json') > -1) {
                temp.mkdir('dataset', (err: any, extractTo: string) => {
                    if (!err) {
                        zip.extractAllTo(extractTo, true);
                        resolve(extractTo);
                    } else {
                        reject(err);
                    }
                });
            }
        });

    });
}

module.exports = unzip;