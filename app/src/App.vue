<template>
    <div id="app">
        <div class="content">
            <div class="right">
                <filters></filters>
            </div>
            <div class="data">
                <div class="header">
                    <h3>
                        Showing {{filteredData.length}} posts
                    </h3>
                    <div style="width: 20%;">
                        <multiselect v-model="selectedDataset"
                                     label="name"
                                     :options="datasets"
                                     :close-on-select="true"
                                     :multiple="false"
                                     @close="datasetSelected"
                                     placeholder="Select dataset..."></multiselect>
                    </div>
                </div>
                <template v-for="item in filteredData">
                    <div v-if="jsonData[item] && jsonData[item].shortcode_media"
                         :key="item">
                        <div class="content">
                            <div class="img-container"
                                 :style="{backgroundImage: `url('${selectedDataset.files}/${jsonData[item].shortcode_media.shortcode}.jpg')`}"></div>
                            <div class="post-data">
                                <p>
                                    <a href="#"
                                       @click.stop.prevent="addUserToFilters(jsonData[item].shortcode_media.owner.username)">
                                        @{{jsonData[item].shortcode_media.owner.username}}
                                    </a>
                                </p>
                                <p>
                                    <span>Likes</span> {{jsonData[item].shortcode_media.edge_media_preview_like.count}}
                                </p>
                                <p>
                                    <span>Comments</span>
                                    {{jsonData[item].shortcode_media.edge_media_to_parent_comment.count}}
                                </p>
                                <div class="tags">
                                    <a class="tag"
                                       href="#"
                                       v-for="tag in getHashtags(item)"
                                       @click.stop.prevent="addTagToFilters(tag)">
                                        {{tag}}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import Multiselect from 'vue-multiselect';
    import axios from 'axios';
    import store from './core/store';
    import {Data, Dataset} from "@/core/models";
    import Filters from "@/components/filters.vue";

    @Component({
        components: {
            Multiselect,
            Filters
        },
    })
    export default class App extends Vue {

        private allDisplay: { [key: string]: ReadonlyArray<{ count: number, id: string }> } = {};

        selectedDataset: Dataset | null = null;

        get display() {
            return store.state.display;
        }

        get allData() {
            return store.state.allData;
        }

        get multiselectSelect() {
            return store.state.multiselectSelect;
        }

        get allKeys() {
            return store.state.allKeys;
        }

        get filterDirty() {
            return store.state.filterDirty;
        }

        get sortBy() {
            return store.state.sortBy;
        }

        get jsonData() {
            return store.state.jsonData;
        }

        get datasets() {
            return store.state.datasets;
        }

        private doFiltersAndAggs(field: 'comments' | 'likes') {
            let count: number[] = [];
            const allDisplay: { id: string, count: number }[] = [];
            const aggs: { count: number; item: number; }[] = [];

            this.allData.forEach(x => {
                count.push(x[field]);
                allDisplay.push({
                    id: x.id,
                    count: x[field]
                });
            });

            this.allDisplay[field] = Object.freeze(allDisplay);

            count = count.sort((a, b) => a - b);

            count.forEach(c => {
                const ix = aggs.findIndex(x => x.item === c);
                if (ix > -1) {
                    aggs[ix] = {
                        ...aggs[ix],
                        count: aggs[ix].count + 1
                    };
                } else {
                    aggs.push({
                        item: c,
                        count: 1
                    })
                }
            });
            store.commitAggs({field: field, aggs: aggs});

            store.commitRangeMin({field: field, data: count[0]});
            store.commitRangeMax({field: field, data: count[count.length - 1]});
            store.commitRangeSelection({field: field, data: [count[0], count[count.length - 1]]});

        }

        mounted() {
            store.dispatchGetDatasets().then(() => {
                const k = this.datasets.findIndex(x => x.select);
                if (k > -1) {
                    this.selectedDataset = {...this.datasets[k]};
                    this.datasetSelected();
                }
            })
        }

        datasetSelected() {
            store.dispatchClearFiltersAndSorting();
            store.dispatchClearAllData();

            axios.get(this.selectedDataset!.source).then(x => {
                const json = x.data;

                const jsonData: { [key: string]: any } = {};
                const allKeys: string[] = [];

                json.forEach((x: any) => {
                    jsonData[x.shortcode_media.shortcode] = {
                        id: x.shortcode_media.shortcode,
                        ...x
                    };
                    allKeys.push(x.shortcode_media.shortcode);
                });

                store.commitJsonData(jsonData);
                store.commitKeys(Array.from(new Set(allKeys)))

                this.parseData(jsonData);

                Vue.nextTick(() => {
                    this.doFiltersAndAggs('comments');
                    this.doFiltersAndAggs('likes');
                })
            });
        }

        getHashtags(item: string) {
            return this.allData.find(x => x.id === item)?.hashtags
        }

        addUserToFilters(user: string) {
            if (this.multiselectSelect['users'].indexOf(user) === -1) {
                // store.commitMultiselectSelect({field: 'users', value: user});
            }
        }

        addTagToFilters(tag: string) {
            if (this.multiselectSelect['hashtags'].indexOf(tag) === -1) {
                // store.commitMultiselectSelect({field: 'hashtags', value: tag});
            }
        }

        private parseData(jsonData: { [p: string]: any }) {
            const data: Data[] = [];
            Object.keys(jsonData).forEach((k: any, i: number) => {
                const x = jsonData[k];
                const tags = this.generateHashtagsFor(x.shortcode_media);
                data.push({
                    unique: i,
                    id: x.shortcode_media.shortcode,
                    user: x.shortcode_media.owner.username,
                    comments: x.shortcode_media.edge_media_to_parent_comment.count,
                    likes: x.shortcode_media.edge_media_preview_like.count,
                    hashtags: tags,
                    hashtagCount: tags.length
                });
            });

            store.commitData(data);
            store.commitUsers(Array.from(new Set(data.map(x => x.user))));
            store.commitHashtags(Array.from(new Set(data.flatMap(x => x.hashtags))));
        }

        get filtersDirty() {
            return Object.keys(this.filterDirty).map(x => this.filterDirty[x]).reduce((a, b) => a || b, false);
        }

        get allFilters() {
            return Array.from(new Set(Object.keys(this.display).flatMap(x => this.display[x])));
        }

        get show() {
            return (x: any) => this.filtersDirty ? this.allFilters.findIndex(k => k.id === this.jsonData[x].shortcode_media.shortcode) > -1 : true
        }

        sortedDisplay(field: 'comments' | 'likes') {
            return (this.filterDirty[field]
                ? [...this.display[field]].sort((a, b) => a.count - b.count)
                : [...this.allDisplay[field]].sort((a, b) => a.count - b.count)).map(x => x.id);
        }

        get filteredData() {
            let filtered = [];
            if (this.sortBy.value === 'COMMENTS') {
                filtered = this.sortedDisplay('comments').filter((e: any) => this.show(e))
            } else if (this.sortBy.value === 'LIKES') {
                filtered = this.sortedDisplay('likes').filter((e: any) => this.show(e))
            } else if (this.sortBy.value === '-COMMENTS') {
                filtered = this.sortedDisplay('comments')
                    .filter((e: any) => this.show(e))
                    .reverse()
            } else if (this.sortBy.value === '-LIKES') {
                filtered = this.sortedDisplay('likes')
                    .filter((e: any) => this.show(e))
                    .reverse()
            } else {
                filtered = this.allKeys.filter(e => this.show(e))
            }
            return Array.from(new Set(filtered));
        }

        private generateHashtagsFor(x: any) {
            const caption = x.edge_media_to_caption?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
            let comment = [];
            if (x.owner.username === x.edge_media_preview_comment?.edges[0]?.node?.owner?.username) {
                comment = x.edge_media_preview_comment?.edges[0]?.node?.text?.match(/(#[a-zA-Z0-9]*)/g) || [];
            }
            return [...caption, ...comment];
        }
    }
</script>

<style lang="scss">
    @import url('https://fonts.googleapis.com/css?family=Rubik:400,500&display=swap');
    @import '~vue-multiselect/dist/vue-multiselect.min.css';

    body {
        margin: 0;
        padding: 0;
    }

    #app {
        font-family: 'Rubik', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #fafafa;

        .content {
            display: flex;

            .right {
                width: 30vw;
                min-height: 100vh;
                max-width: 350px;
                background: #F3F3f3;
                padding: 2rem;
                box-shadow: 1px 0 14px #e0d7da;
            }

            .data {
                min-width: 70vw;
                padding: 2rem;

                .header {
                    padding: 0 0 2rem .5rem;
                    display: flex;

                    h3 {
                        margin: 0;
                        color: #C13584;
                        font-size: 1.4rem;
                        font-weight: 500;
                        width: 80%;
                    }
                }

                .scroller {
                    height: 100%;
                    width: 100%;
                }

                .content {
                    padding: 0;
                    height: 200px;
                    display: flex;
                    box-sizing: border-box;
                    border: 1px solid #eaeaea;
                    margin: 0.5rem;
                    border-radius: 5px;
                    background: white;
                    overflow: hidden;

                    .img-container {
                        width: 200px;
                        height: 200px;
                        background-size: cover;
                        background-repeat: no-repeat;
                        background-position: center;
                        flex: 0 0 200px;
                    }

                    .post-data {
                        display: flex;
                        flex-direction: column;
                        overflow-y: auto;
                        overflow-x: hidden;
                        margin: 1rem;

                        p {
                            text-align: left;
                            margin: 0 0 0.2rem;
                        }

                        a {
                            text-decoration: none;
                            color: #405de6;

                            &:hover {
                                color: #5851db;
                            }
                        }

                        .tags {
                            .tag {
                                display: inline-block;
                                padding: .2rem;
                            }
                        }
                    }

                }
            }
        }

    }
</style>
