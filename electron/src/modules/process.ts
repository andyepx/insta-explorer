interface Data {
    id: string;
    user: string;
    comments: number;
    commentsSearch: string;
    likes: number;
    likesSearch: string;
    hashtags: string[];
    hashtagCount: number;
    hasImage: boolean;
}

function indexData(tempPath: string) {
    const fs = require('fs');
    const path = require('path');
    const lunr = require('lunr');

    return new Promise((resolve, reject) => {

        fs.readdir(tempPath, (err, items) => {
            const dataFile = items.find(x => x.indexOf('.json') > -1);
            if (dataFile) {
                const jsonData = {};
                const indexData: Data[] = [];
                const data = JSON.parse(fs.readFileSync(path.join(tempPath, dataFile)));

                console.time('POST');
                console.info(`Parsing post data...`);

                data.forEach((x: any) => {
                    const tags = generateHashtagsFor(x.shortcode_media);
                    const meta: Data = {
                        id: x.shortcode_media.shortcode,
                        user: x.shortcode_media.owner.username,
                        comments: x.shortcode_media.edge_media_to_parent_comment.count,
                        commentsSearch: `C${x.shortcode_media.edge_media_to_parent_comment.count}C`,
                        likes: x.shortcode_media.edge_media_preview_like.count,
                        likesSearch: `L${x.shortcode_media.edge_media_preview_like.count}L`,
                        hashtags: tags,
                        hashtagCount: tags.length,
                        hasImage: false,
                    };
                    jsonData[x.shortcode_media.shortcode] = {
                        ...meta,
                        postData: {...x}
                    };
                    indexData.push({...meta});
                });

                console.timeEnd('POST');
                console.info(`Processed ${indexData.length} posts...`);

                console.time('IMAGES');
                console.info(`Processing images...`);

                getFiles(tempPath).then(files => {
                    const imagesData = {};
                    const images = {};
                    indexData.forEach(e => {
                        images[e.id] = files.find(k => k.indexOf(e.id) > -1);
                        if (images[e.id]) {
                            jsonData[e.id] = {
                                ...jsonData[e.id],
                                hasImage: true
                            }
                        }
                    });
                    fs.writeFileSync(path.join(tempPath, 'images.json'), JSON.stringify(images));

                    console.info(`Found ${Object.keys(imagesData).length} images...`);
                    console.timeEnd('IMAGES');

                    console.time('INDEX');
                    console.info(`Indexing post data...`);

                    const idx = lunr((builder) => {
                        builder.pipeline.remove(lunr.stemmer);
                        builder.searchPipeline.remove(lunr.stemmer);

                        builder.ref('id');
                        builder.field('user');
                        builder.field('comments');
                        builder.field('commentsSearch');
                        builder.field('likes');
                        builder.field('likesSearch');
                        builder.field('hashtags');
                        builder.field('hashtagCount');
                        builder.field('hasImage');

                        indexData.forEach(x => builder.add(jsonData[x.id]));
                    });

                    console.info(`Indexed ${indexData.length} posts...`);
                    console.timeEnd('INDEX');

                    resolve({
                        index: idx,
                        data: jsonData,
                        aggs: {
                            users: userAggs(indexData),
                            hashtags: hashtagAggs(indexData)
                        },
                        ranges: {
                            comments: minMax(indexData, 'comments'),
                            likes: minMax(indexData, 'likes'),
                        }
                    });
                });

            }
        });

    });
}

function minMax(indexData: Data[], field: 'comments' | 'likes') {
    const s = [...indexData].sort((a, b) => a[field] - b[field]);
    return {
        min: s[0][field],
        max: s[s.length - 1][field]
    };
}

function userAggs(indexData: Data[]) {
    return Array.from(new Set([...indexData].map(e => e.user.toLowerCase()))).sort();
}

function hashtagAggs(indexData: Data[]) {
    return Array.from(
        new Set([...indexData]
            .map(e => e.hashtags)
            .reduce((x, y) => [...x].concat(y.map(e => e.toLowerCase())), []))
    ).sort();
}

async function getFiles(dir): Promise<string[]> {
    const fs = require('fs');
    const path = require('path');

    const dirents = await fs.promises.readdir(dir, {withFileTypes: true});
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

function generateHashtagsFor(x: any) {
    const caption = x.edge_media_to_caption?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
    let comment = [];
    if (x.owner.username === x.edge_media_preview_comment?.edges[0]?.node?.owner?.username) {
        comment = x.edge_media_preview_comment?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
    }
    return [...caption, ...comment];
}

module.exports = indexData;

addEventListener('message', (message) => {
// onmessage = function(oEvent) {
    // postMessage('Hi ' + oEvent.data);
    self.postMessage(indexData(message.data), '*');
});