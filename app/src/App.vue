<template>
    <div id="app">
        <div class="data">
            <template v-if="jsonData"
                      v-for="x in filteredData">
                <div class="content">
                    <img :src="'/data/nofilter/'+x.shortcode_media.shortcode+'.jpg'" alt="">
                    <p>
                        Likes: {{x.shortcode_media.edge_media_preview_like.count}}
                    </p>
                    <p>
                        Comments: {{x.shortcode_media.edge_media_to_parent_comment.count}}
                    </p>
                </div>
            </template>
        </div>

        <div class="right">
            <div class="chart-container">
                <canvas id="commentsChart" width="400" height="200"></canvas>
            </div>

            <div class="chart-container">
                <canvas id="likesChart" width="400" height="200"></canvas>
            </div>

            <div class="filters">
                <vue-range-slider ref="slider"
                                  :min="minComments"
                                  :max="maxComments"
                                  v-model="commentsCount"
                                  :enable-cross="false"></vue-range-slider>

                <vue-range-slider ref="slider"
                                  :min="minLikes"
                                  :max="maxLikes"
                                  v-model="likesCount"
                                  :enable-cross="false"></vue-range-slider>
            </div>

            <div class="filters">
                <select name="" id="" v-model="sortBy">
                    <option value="">Default</option>
                    <option value="COMMENTS">Number of comments</option>
                    <option value="LIKES">Number of likes</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import json from './data/nofilter.json';
    import VueRangeSlider from 'vue-range-component';
    import Chart from 'chart.js';

    @Component({
        components: {
            VueRangeSlider
        },
    })
    export default class App extends Vue {

        commentsAggs: { count: number, item: number }[] = [];
        commentsCount: number[] = [0, 10];
        minComments = 0;
        maxComments = 10;

        likesAggs: { count: number, item: number }[] = [];
        likesCount: number[] = [0, 10];
        minLikes = 0;
        maxLikes = 10;

        displayComments: { count: number, id: string }[] = [];
        displayLikes: { count: number, id: string }[] = [];

        sortBy: string = '';

        mounted() {
            console.log(json);
        }

        get jsonData() {
            return json;
        }

        get show() {
            return (x: any) => (this.displayComments !== null ? this.sortedDisplayComments.findIndex(k => k.id === x.shortcode_media.shortcode) > -1 : true)
                && (this.displayLikes !== null ? this.sortedDisplayLikes.findIndex(k => k.id === x.shortcode_media.shortcode) > -1 : true);
        }

        get sortedDisplayComments() {
            return [...(this.displayComments || [])].sort((a, b) => a.count - b.count);
        }

        get sortedDisplayLikes() {
            return [...(this.displayLikes || [])].sort((a, b) => a.count - b.count);
        }

        get filteredData() {
            if (this.sortBy === '') {
                return [...this.jsonData].filter(e => this.show(e))
            } else if (this.sortBy === 'COMMENTS') {
                return this.sortedDisplayComments
                    .filter(x => this.displayLikes.findIndex(k => k.id === x.id) > -1)
                    .map(x => ({...this.jsonData.find(e => e.shortcode_media.shortcode === x.id)}))
            } else if (this.sortBy === 'LIKES') {
                return this.sortedDisplayLikes
                    .filter(x => this.displayComments.findIndex(k => k.id === x.id) > -1)
                    .map(x => ({...this.jsonData.find(e => e.shortcode_media.shortcode === x.id)}))
            } else {
                return [];
            }
        }

        private generateHashtagsFor(x: any) {
            const caption = x.edge_media_to_caption?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
            let comment = [];
            if (x.owner.username === x.edge_media_preview_comment?.edges[0]?.node?.owner?.username) {
                comment = x.edge_media_preview_comment?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
            }
            return [...caption, ...comment];
        }

        @Watch('jsonData', {immediate: true})
        updateDb() {
            let openRequest = indexedDB.open("store");
            openRequest.onupgradeneeded = (event: any) => {
                console.log('upgradeneeded');
                let db = openRequest.result;
                if (!db.objectStoreNames.contains('data')) {
                    const os = db.createObjectStore('data', {keyPath: ['id', 'unique']});
                    os.createIndex("user", "user", {unique: false});
                    os.createIndex("comments", "comments", {unique: false});
                    os.createIndex("likes", "likes", {unique: false});
                    os.createIndex("hashtagCount", "hashtagCount", {unique: false});
                }

                event.target.transaction.oncomplete = () => {
                    let transaction = db.transaction("data", "readwrite");
                    let data = transaction.objectStore("data");

                    transaction.onabort = (e: any) => console.log("ABORT", e);

                    (this.jsonData as any[]).forEach((x: any, i: number) => {
                        const tags = this.generateHashtagsFor(x.shortcode_media);
                        data.add({
                            unique: i,
                            id: x.shortcode_media.shortcode,
                            user: x.shortcode_media.owner.username,
                            comments: x.shortcode_media.edge_media_to_parent_comment.count,
                            likes: x.shortcode_media.edge_media_preview_like.count,
                            hashtags: tags,
                            hashtagCount: tags.length
                        });
                    })
                };
            }

            openRequest.onsuccess = (e: any) => {
                console.log("success??");
                const objectStore = openRequest.result.transaction("data").objectStore("data");

                let commentsCount: number[] = [];
                const comments = objectStore.index("comments");
                comments.openKeyCursor().onsuccess = (ee: any) => {
                    const cursor = ee.target.result;
                    if (cursor) {
                        commentsCount.push(Number(cursor.key));
                        cursor.continue();
                    } else {
                        commentsCount = commentsCount.sort((a, b) => a - b);
                        this.commentsAggs = [];
                        commentsCount.forEach(c => {
                            const ix = this.commentsAggs.findIndex(x => x.item === c);
                            if (ix > -1) {
                                this.commentsAggs[ix] = {
                                    ...this.commentsAggs[ix],
                                    count: this.commentsAggs[ix].count + 1
                                };
                            } else {
                                this.commentsAggs.push({
                                    item: c,
                                    count: 1
                                })
                            }
                        });
                        this.minComments = commentsCount[0];
                        this.maxComments = commentsCount[commentsCount.length - 1];
                        this.commentsCount = [this.minComments, this.maxComments];

                        const ctx = document.getElementById('commentsChart') as HTMLCanvasElement;
                        const commentsChart = new Chart(ctx, {
                            type: 'bar',
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                            },
                            data: {
                                labels: this.commentsAggs.map(x => String(x.item)),
                                datasets: [{
                                    label: '# of Posts',
                                    data: this.commentsAggs.map(x => x.count),
                                }]
                            }
                        });
                    }
                };

                let likesCount: number[] = [];
                const likes = objectStore.index("likes");
                likes.openKeyCursor().onsuccess = (ee: any) => {
                    const cursor = ee.target.result;
                    if (cursor) {
                        likesCount.push(Number(cursor.key));
                        cursor.continue();
                    } else {
                        likesCount = likesCount.sort((a, b) => a - b);
                        this.likesAggs = [];
                        likesCount.forEach(c => {
                            const ix = this.likesAggs.findIndex(x => x.item === c);
                            if (ix > -1) {
                                this.likesAggs[ix] = {
                                    ...this.likesAggs[ix],
                                    count: this.likesAggs[ix].count + 1
                                };
                            } else {
                                this.likesAggs.push({
                                    item: c,
                                    count: 1
                                })
                            }
                        });

                        const ctx = document.getElementById('likesChart') as HTMLCanvasElement;
                        const likesChart = new Chart(ctx, {
                            type: 'bar',
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                            },
                            data: {
                                labels: this.likesAggs.map(x => String(x.item)),
                                datasets: [{
                                    label: '# of Posts',
                                    data: this.likesAggs.map(x => x.count),
                                }]
                            }
                        });

                        this.minLikes = likesCount[0];
                        this.maxLikes = likesCount[likesCount.length - 1];
                        this.likesCount = [this.minLikes, this.maxLikes];
                    }
                };
            }
        }

        @Watch('commentsCount', {deep: true, immediate: false})
        filterComments() {
            let x: { count: number, id: string }[] = [];
            let openRequest = indexedDB.open("store");
            openRequest.onsuccess = (event: any) => {
                const objectStore = openRequest.result.transaction("data").objectStore("data");
                const index = objectStore.index("comments");
                index.openKeyCursor(IDBKeyRange.bound(this.commentsCount[0], this.commentsCount[1], false, false)).onsuccess = (e: any) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        x.push({
                            count: Number(cursor.key),
                            id: cursor.primaryKey[0]
                        });
                        cursor.continue();
                    } else {
                        if (this.displayComments === null) this.displayComments = [];
                        this.displayComments = [...x];
                    }
                };
            }
        }

        @Watch('likesCount', {deep: true, immediate: false})
        filterLikes() {
            let x: { count: number, id: string }[] = [];
            let openRequest = indexedDB.open("store");
            openRequest.onsuccess = (event: any) => {
                const objectStore = openRequest.result.transaction("data").objectStore("data");
                const index = objectStore.index("likes");
                index.openKeyCursor(IDBKeyRange.bound(this.likesCount[0], this.likesCount[1], false, false)).onsuccess = (e: any) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        x.push({
                            count: Number(cursor.key),
                            id: cursor.primaryKey[0]
                        });
                        cursor.continue();
                    } else {
                        if (this.displayLikes === null) this.displayLikes = [];
                        this.displayLikes = [...x];
                    }
                };
            }
        }
    }
</script>

<style lang="scss">
    @import '~vue-range-component/dist/vue-range-slider.css';

    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;

        display: flex;

        .right {
            flex: 0 0 20vw;

            .chart-container {
                width: 400px !important;
                height: 200px;
            }

            .filters {
            }
        }


        .data {
            display: flex;
            flex-wrap: wrap;
            flex: 0 0 80vw;

            .content {
                margin: .5rem;

                img {
                    max-width: 150px;
                    max-height: 150px;
                }
            }
        }

    }
</style>
