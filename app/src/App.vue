<template>
    <div id="app">
        <button @click.stop="filter">Filter > 5 comments</button>
        <template v-if="jsonData"
                  v-for="x in jsonData">
            <div class="content">
                <img :src="'/data/filmisnotdead/'+x.shortcode_media.shortcode+'.jpg'" alt="">
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import json from './data/filmisnotdead.json';

    @Component({
        components: {},
    })
    export default class App extends Vue {
        mounted() {
            console.log(json);
        }

        get jsonData() {
            return json;
        }

        private generateHashtagsFor(x: any) {
            const caption = x.edge_media_to_caption?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) ?? [];
            let comment = [];
            if (x.owner.username === x.edge_media_preview_comment?.edges[0]?.node?.owner?.username) {
                comment = x.edge_media_preview_comment?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) ?? [];
            }
            return [...caption, ...comment];
        }

        @Watch('jsonData', {immediate: true})
        updateDb() {
            let openRequest = indexedDB.open("store");
            openRequest.onupgradeneeded = (event: any) => {

                let db = openRequest.result;
                if (!db.objectStoreNames.contains('data')) {
                    const os = db.createObjectStore('data', {keyPath: ['id']});
                    os.createIndex("user", "user", {unique: false});
                    os.createIndex("comments", "comments", {unique: false});
                    os.createIndex("likes", "likes", {unique: false});
                    os.createIndex("hashtagsCount", "hashtagsCount", {unique: false});
                }

                event.target.transaction.oncomplete = () => {
                    let transaction = db.transaction("data", "readwrite");
                    let data = transaction.objectStore("data");
                    this.jsonData.forEach((x: any) => {
                        const tags = this.generateHashtagsFor(x.shortcode_media);
                        data.add({
                            id: x.shortcode_media.shortcode,
                            user: x.shortcode_media.owner.username,
                            comments: x.shortcode_media.edge_media_to_parent_comment.count,
                            likes: x.shortcode_media.edge_media_preview_like.count,
                            hashtags: tags,
                            hashtagsCount: tags.length
                        });
                    })
                }
            }
        }

        filter() {
            let openRequest = indexedDB.open("store");
            openRequest.onsuccess = (event: any) => {
                const objectStore = openRequest.result.transaction("data").objectStore("data");
                const index = objectStore.index("comments");
                index.openCursor(IDBKeyRange.bound(5, 20, false, true)).onsuccess = (e: any) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        console.log(cursor);
                        // Do something with the matches.
                        cursor.continue();
                    }
                }
            }
        }
    }
</script>

<style lang="scss">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        display: flex;
        flex-wrap: wrap;

        .content {
            width: 150px;
            height: 150px;
            margin: .5rem;
            overflow: hidden;

            img {
                max-width: 100%;
                max-height: 100%;
            }
        }
    }
</style>
