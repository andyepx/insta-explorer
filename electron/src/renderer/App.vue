<template>
    <div id="app">
        <div class="content">
            <div class="right">
                <filters @filter="filterData"></filters>
            </div>
            <div class="data">
                <div class="header">
                    <h3>
                        Showing {{displayData.length}} posts
                    </h3>
                    <div style="width: 20%;">
                        <button @click="openDataset">Open dataset</button>
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
                    <template v-for="x in allIds">
                        <item v-show="displayData.length > 0 && displayData.indexOf(x) > -1"
                              :data="jsonData[x]"
                              :key="x"/>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import Multiselect from 'vue-multiselect';
    import store from './core/store';
    import Filters from "./components/filters.vue";
    import Item from "./components/item.vue";
    import Electron from 'electron';
    import lunr from "lunr";
    import _ from 'lodash';

    @Component({
        components: {
            Multiselect,
            Filters,
            Item
        }
    })
    export default class App extends Vue {

        thumbMode: boolean = false;
        jsonData: Readonly<any> = {};
        allIds: string[] = [];

        displayData: string[] = [];

        get sortBy() {
            return store.state.sortBy;
        }

        openDataset() {
            Electron.remote.dialog.showOpenDialog({properties: ['openFile']})
                .then(x => {
                    x.filePaths.forEach(k => {
                        const unzip = require('electron').remote.require('./unzip');
                        unzip(k).then((path: string) => {
                            store.commitTempPath(path);
                            const process = require('electron').remote.require('./process');
                            process(path).then((e: {
                                index: lunr.Index,
                                data: any,
                                aggs: any,
                                ranges: any
                            }) => {

                                this.jsonData = Object.freeze({...e.data});
                                (window as any).lunrIndex = e.index;

                                Object.keys(e.ranges).forEach(field => {
                                    store.commitRangeMin({field: field, data: e.ranges[field].min});
                                    store.commitRangeMax({field: field, data: e.ranges[field].max});
                                    store.commitRangeSelection({
                                        field: field,
                                        data: [e.ranges[field].min, e.ranges[field].max]
                                    });
                                });

                                store.commitHashtags(e.aggs.hashtags);
                                store.commitUsers(e.aggs.users);

                                const display: string[] = [];
                                e.index.search('*')
                                    .forEach(r => {
                                        display.push(r.ref);
                                    });

                                this.allIds = [...display];
                                this.displayData = [...display];
                            });
                        })
                    })
                })
        }

        filterData() {
            if ((window as any).lunrIndex) {
                const users = store.state.multiselectSelect['users'];
                const usersSearch = users.length
                    ? this.search('user', users.join(' '))
                    : [];

                const hashtags = store.state.multiselectSelect['hashtags'];
                const hashtagsSearch = hashtags.length
                    ? this.search('hashtags', hashtags.map(e => e.replace('#', '')).join(' '))
                    : [];

                const likesRange = store.state.rangeSelection['likes'];
                const searchLikes = likesRange[0] !== store.state.rangeMin['likes'] || likesRange[1] !== store.state.rangeMax['likes'];
                const likesSearch = searchLikes
                    ? this.search('likesSearch', _.range(likesRange[0], likesRange[1]+1).map(e => `L${e}L`).join(' '))
                    : [];

                const commentsRange = store.state.rangeSelection['comments'];
                const searchComments = commentsRange[0] !== store.state.rangeMin['comments'] || commentsRange[1] !== store.state.rangeMax['comments'];
                const commentsSearch = searchComments
                    ? this.search('commentsSearch', _.range(commentsRange[0], commentsRange[1]+1).map(e => `C${e}C`).join(' '))
                    : [];

                console.log([usersSearch, hashtagsSearch, likesSearch, commentsSearch].filter(x => x.length > 0));

                const e = _.intersection(...[usersSearch, hashtagsSearch, likesSearch, commentsSearch].filter(x => x.length > 0));

                this.displayData = [...e];
            }
        }

        search(field: string, data: string) {
            const query = `${field}:${data}`;
            console.log("QUERY::: ", query);
            return ((window as any).lunrIndex as lunr.Index)
                .search(query)
                .map(x => x.ref);
        }

        @Watch('sortBy', {deep: true})
        sort() {
            let r = [...this.allIds];
            if (this.sortBy.value !== '') {
                switch (this.sortBy.value) {
                    case 'COMMENTS':
                    case '-COMMENTS':
                        r = r.sort((a, b) => this.jsonData[a].comments - this.jsonData[b].comments);
                        break;
                    case 'LIKES':
                    case '-LIKES':
                        r = r.sort((a, b) => this.jsonData[a].likes - this.jsonData[b].likes);
                        break;
                }
                if (this.sortBy.value.indexOf('-') === 0) r = r.reverse();
            }
            this.allIds = [...r];
        }

        mounted() {
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

                        .content {
                            width: 250px !important;

                            .post-data {
                                display: none !important;
                            }
                        }
                    }
                }
            }
        }

    }
</style>
