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
                        <button @click="openDataset">Open dataset</button>
                        <!--                        <multiselect v-model="selectedDataset"-->
                        <!--                                     label="name"-->
                        <!--                                     :options="datasets"-->
                        <!--                                     :close-on-select="true"-->
                        <!--                                     :multiple="false"-->
                        <!--                                     @close="datasetSelected"-->
                        <!--                                     placeholder="Select dataset..."></multiselect>-->
                    </div>
                </div>
                <div class="toggle-mode">
                    <button @click="thumbMode = false"
                            :class="!thumbMode ? 'active' : ''">
                        <font-awesome-icon :icon="['fas', 'th-list']"></font-awesome-icon>
                    </button>
                    <button @click="thumbMode = true"
                            :class="thumbMode ? 'active' : ''">
                        <font-awesome-icon :icon="['fas', 'th']"></font-awesome-icon>
                    </button>
                </div>
                <div class="posts" :class="thumbMode ? 'thumb' : ''">
                    <template v-for="x in filteredData">
                        <item v-if="jsonData[x]"
                              :data="jsonData[x]"
                              :dataset="selectedDataset"
                              :thumb-mode="thumbMode"
                              :key="x"/>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import Multiselect from 'vue-multiselect';
    import axios from 'axios';
    import store from './core/store';
    import {Data, Dataset} from "./core/models";
    import Filters from "./components/filters.vue";
    import Item from "./components/item.vue";
    import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
    import Electron from 'electron';
    import lunr from "lunr";

    Vue.component('font-awesome-icon', FontAwesomeIcon);

    @Component({
        components: {
            Multiselect,
            Filters,
            Item
        }
    })
    export default class App extends Vue {

        private allDisplay: { [key: string]: ReadonlyArray<{ count: number, id: string }> } = {};

        selectedDataset: Dataset | null = null;
        thumbMode: boolean = false;

        jsonData: any = {};
        filteredData: any[] = [];

        get display() {
            return store.state.display;
        }

        get allData() {
            return store.state.allData;
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

        // get jsonData() {
        //     return store.state.jsonData;
        // }

        get datasets() {
            return store.state.datasets;
        }

        openDataset() {
            Electron.remote.dialog.showOpenDialog({properties: ['openFile']})
                .then(x => {
                    x.filePaths.forEach(k => {
                        const unzip = require('electron').remote.require('./unzip');
                        unzip(k).then((path: string) => {
                            store.commitTempPath(path);
                            const process = require('electron').remote.require('./process');
                            process(path).then((e: { index: lunr.Index, data: any }) => {
                                this.jsonData = {...e.data};
                                e.index.search('*')
                                    .forEach(r => {
                                        // console.log(e.data[r.ref]);
                                        this.filteredData.push(r.ref);
                                    });
                                console.log(this.filteredData);
                            });
                        })
                    })
                })
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
            store.commitAggs({field: field, value: aggs});

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
                store.commitKeys(Array.from(new Set(allKeys)));

                this.parseData(jsonData);

                Vue.nextTick(() => {
                    this.doFiltersAndAggs('comments');
                    this.doFiltersAndAggs('likes');
                })
            });
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
            return Array.from(new Set(this.display));
        }

        get show() {
            return (x: any) => this.filtersDirty
                ? this.allFilters.findIndex(k => k === this.jsonData[x].shortcode_media.shortcode) > -1
                : true
        }

        sortedDisplay(field: 'comments' | 'likes') {
            return [...this.allDisplay[field]].sort((a, b) => a.count - b.count).map(x => x.id);
            // return (this.filterDirty[field]
            //     ? [...this.display].sort((a, b) => this.allDisplay[field].count - this.allData[b])
            //     : [...this.allDisplay[field]].sort((a, b) => a.count - b.count)).map(x => x.id);
        }

        // get filteredData() {
        //     let filtered = [];
        //     switch (this.sortBy.value) {
        //         case 'COMMENTS':
        //             filtered = this.sortedDisplay('comments');
        //             break;
        //         case 'LIKES':
        //             filtered = this.sortedDisplay('likes');
        //             break;
        //         case '-COMMENTS':
        //             filtered = this.sortedDisplay('comments').reverse();
        //             break;
        //         case '-LIKES':
        //             filtered = this.sortedDisplay('likes').reverse();
        //             break;
        //         default:
        //             filtered = [...this.allKeys];
        //             break;
        //     }
        //     return Array.from(new Set(filtered.filter(e => this.show(e))));
        // }

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

                .toggle-mode {
                    padding: 0 .5rem;
                    text-align: right;

                    button {
                        width: 2rem;
                        height: 2rem;
                        background: white;
                        padding: .5rem;
                        cursor: pointer;
                        border: 1px solid #C13584;

                        &:first-of-type {
                            border-radius: 3px 0 0 3px;
                        }

                        &:last-of-type {
                            border-radius: 0 3px 3px 0;
                        }

                        &.active, &:hover {
                            background: #C13584;
                            color: white;
                        }
                    }
                }

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

                .posts {
                    display: flex;
                    flex-direction: column;

                    &.thumb {
                        flex-direction: row;
                        flex-wrap: wrap;
                    }
                }
            }
        }

    }
</style>
