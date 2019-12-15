function indexData(tempPath: string) {
    const fs = require('fs');
    const path = require('path');
    const lunr = require('lunr');

    return new Promise((resolve, reject) => {

        fs.readdir(tempPath, (err, items) => {
            const dataFile = items.find(x => x.indexOf('.json') > -1);
            if (dataFile) {
                const jsonData = {};
                const indexData: any[] = [];
                const data = JSON.parse(fs.readFileSync(path.join(tempPath, dataFile)));

                console.time('POST');
                console.info(`Parsing post data...`);

                data.forEach((x: any) => {
                    const tags = generateHashtagsFor(x.shortcode_media);
                    const meta = {
                        id: x.shortcode_media.shortcode,
                        user: x.shortcode_media.owner.username,
                        comments: x.shortcode_media.edge_media_to_parent_comment.count,
                        likes: x.shortcode_media.edge_media_preview_like.count,
                        hashtags: tags,
                        hashtagCount: tags.length,
                    };
                    jsonData[x.shortcode_media.shortcode] = {
                        ...meta,
                        postData: {...x}
                    };
                    indexData.push({...meta});
                });

                console.timeEnd('POST');
                console.info(`Processed ${indexData.length} posts...`);

                console.time('INDEX');
                console.info(`Indexing post data...`);

                const idx = lunr((builder) => {
                    builder.ref('id');
                    builder.field('user');
                    builder.field('comments');
                    builder.field('likes');
                    builder.field('hashtags');
                    builder.field('hashtagCount');
                    builder.field('postData');

                    indexData.forEach(x => builder.add(x));
                });

                console.info(`Indexed ${indexData.length} posts...`);
                console.timeEnd('INDEX');

                resolve({index: idx, data: jsonData});
            }
        });

    });
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