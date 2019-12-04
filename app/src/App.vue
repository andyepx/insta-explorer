<template>
    <div id="app">
        <div class="content">
            <div class="right">
                <div class="filters">

                    <h4 style="margin-top: 0;">
                        Sort
                    </h4>
                    <multiselect v-model="sortBy"
                                 :options="sortByOptions"
                                 label="label"
                                 :searchable="false"
                                 :close-on-select="true"
                                 :multiple="false"
                                 placeholder="Default"></multiselect>

                    <h4>
                        Filter
                    </h4>

                    <p>Number of comments</p>
                    <!--                    <div class="chart-container">-->
                    <!--                        <canvas id="commentsChart" width="400" height="150"></canvas>-->
                    <!--                    </div>-->
                    <div class="slider-container">
                        <vue-range-slider ref="slider"
                                          :min="min['comments']"
                                          :max="max['comments']"
                                          v-model="count['comments']"
                                          :enable-cross="false"
                                          @drag-end="filterData('comments')"></vue-range-slider>
                    </div>

                    <p>Number of likes</p>
                    <!--                    <div class="chart-container">-->
                    <!--                        <canvas id="likesChart" width="400" height="150"></canvas>-->
                    <!--                    </div>-->
                    <div class="slider-container">
                        <vue-range-slider ref="slider"
                                          :min="min['likes']"
                                          :max="max['likes']"
                                          v-model="count['likes']"
                                          :enable-cross="false"
                                          @drag-end="filterData('likes')"></vue-range-slider>
                    </div>

                    <p>User</p>
                    <multiselect v-model="multiselectSelect['users']"
                                 :options="allUsers"
                                 :searchable="true"
                                 :close-on-select="false"
                                 :multiple="true"
                                 @close="filterData('users')"
                                 @remove="filterData('users')"
                                 placeholder="User"></multiselect>

                    <p>Hashtag</p>
                    <multiselect v-model="multiselectSelect['hashtags']"
                                 :options="allHashtags"
                                 :searchable="true"
                                 :close-on-select="false"
                                 :multiple="true"
                                 @close="filterData('hashtags')"
                                 @remove="filterData('hashtags')"
                                 placeholder="Hashtags"></multiselect>
                </div>
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
                                <!--                            <p>-->
                                <!--                                {{jsonData[item].shortcode_media.shortcode}}-->
                                <!--                            </p>-->
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
    import VueRangeSlider from 'vue-range-component';
    import Multiselect from 'vue-multiselect';
    import axios from 'axios';

    export interface Data {
        unique: number;
        id: string;
        user: string;
        comments: number;
        likes: number;
        hashtags: string[];
        hashtagCount: number
    }

    export interface Dataset {
        select: boolean;
        name: string;
        source: string;
        files: string;
    }

    @Component({
        components: {
            VueRangeSlider,
            Multiselect
        },
    })
    export default class App extends Vue {

        private aggs: { [key: string]: ReadonlyArray<{ count: number; item: number }> } = {};
        private allDisplay: { [key: string]: ReadonlyArray<{ count: number, id: string }> } = {};
        count: { [key: string]: number[] } = {
            comments: [0, 10],
            likes: [0, 10]
        };
        min: { [key: string]: number } = {
            comments: 0,
            likes: 0
        };
        max: { [key: string]: number } = {
            comments: 10,
            likes: 10
        };

        private display: { [key: string]: any } = {};
        private filterDirty: { [key: string]: boolean } = {
            comments: false,
            likes: false,
            users: false,
            hashtags: false
        };

        sortBy: { label: string, value: string } = {label: 'Default', value: ''};
        sortByOptions: { label: string, value: string }[] = [{
            label: 'Default',
            value: ''
        }, {
            label: 'Number of comments (asc)',
            value: 'COMMENTS'
        }, {
            label: 'Number of comments (desc)',
            value: '-COMMENTS'
        }, {
            label: 'Number of likes (asc)',
            value: 'LIKES'
        }, {
            label: 'Number of likes (desc)',
            value: '-LIKES'
        }];

        jsonData: { [key: string]: any } = {};
        private allKeys: ReadonlyArray<string> = [];
        private allData: ReadonlyArray<Data> = [];

        allHashtags: ReadonlyArray<string> = [];
        allUsers: ReadonlyArray<string> = [];

        multiselectSelect: { [key: string]: any } = {
            users: [],
            hashtags: []
        };

        datasets: Dataset[] = [];
        selectedDataset: Dataset | null = null;

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
            this.aggs[field] = Object.freeze(aggs);

            Vue.set(this.min, field, count[0]);
            Vue.set(this.max, field, count[count.length - 1]);
            Vue.set(this.count, field, [this.min[field], this.max[field]]);

            // new Chart(document.getElementById(field + 'Chart') as HTMLCanvasElement, {
            //     type: 'bar',
            //     options: {
            //         responsive: true,
            //         maintainAspectRatio: false,
            //     },
            //     data: {
            //         labels: this.aggs[field].map(x => String(x.item)),
            //         datasets: [{
            //             label: '# of Posts',
            //             data: this.aggs[field].map(x => x.count),
            //         }]
            //     }
            // })

        }

        mounted() {
            axios.get('/datasets.json').then(x => {
                this.datasets = [...x.data];
                const k = this.datasets.findIndex(x => x.select);
                if (k > -1) {
                    this.selectedDataset = {...this.datasets[k]};
                    this.datasetSelected();
                }
            });
        }

        clearFiltersAndSorting() {
            this.filterDirty = {
                comments: false,
                likes: false,
                users: false,
                hashtags: false
            };
            this.multiselectSelect = {
                users: [],
                hashtags: []
            };
            this.sortBy = {label: 'Default', value: ''};
        }

        datasetSelected() {
            this.clearFiltersAndSorting();

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
                this.jsonData = Object.freeze(jsonData);
                this.allKeys = Object.freeze(Array.from(new Set(allKeys)));

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
                this.multiselectSelect['users'].push(user);
                this.filterData('users');
            }
        }

        addTagToFilters(tag: string) {
            if (this.multiselectSelect['hashtags'].indexOf(tag) === -1) {
                this.multiselectSelect['hashtags'].push(tag);
                this.filterData('hashtags');
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
            this.allData = Object.freeze(data);

            this.allUsers = Object.freeze(Array.from(new Set(data.map(x => x.user))));
            this.allHashtags = Object.freeze(Array.from(new Set(data.flatMap(x => x.hashtags))));
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

        filterData(field: 'comments' | 'likes' | 'users' | 'hashtags') {
            this.filterDirty[field] = true;
            switch (field) {
                case "comments":
                case "likes":
                    Vue.set(this.display, field, [
                        ...this.allData
                            .filter(x => x[field] >= this.count[field][0] && x[field] <= this.count[field][1])
                            .map(x => ({
                                count: x[field],
                                id: x.id
                            }))
                    ]);
                    break;
                case "users":
                    Vue.set(this.display, field, [
                        ...this.allData
                            .filter(x => this.multiselectSelect[field].indexOf(x.user) > -1)
                            .map(x => ({
                                count: 0,
                                id: x.id
                            }))
                    ]);
                    if (this.multiselectSelect[field].length === 0) this.filterDirty[field] = false;
                    break;
                case "hashtags":
                    Vue.set(this.display, field, [
                        ...this.allData
                            .filter(x => x.hashtags.findIndex(k => this.multiselectSelect[field].indexOf(k) > -1) > -1)
                            .map(x => ({
                                count: 0,
                                id: x.id
                            }))
                    ]);
                    if (this.multiselectSelect[field].length === 0) this.filterDirty[field] = false;
                    break;
            }
        }
    }
</script>

<style lang="scss">
    @import url('https://fonts.googleapis.com/css?family=Rubik:400,500&display=swap');
    @import '~vue-range-component/dist/vue-range-slider.css';
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

                h4 {
                    margin: 2rem 0 1rem;
                    color: #c13584;
                    font-size: 1.2rem;
                    font-weight: 500;
                }

                p {
                    margin: .5rem 0;
                    font-weight: 500;
                }

                .filters {
                    width: 350px;

                    .chart-container {
                        width: 350px !important;
                        height: 150px !important;
                    }

                    .slider-container {
                        height: 60px;
                        display: flex;
                        align-items: flex-end;
                        padding: 0 1rem;
                        box-sizing: border-box;

                        .vue-range-slider {
                            width: 100% !important;

                            .slider-process, .slider-tooltip {
                                background-color: #e1306c !important;
                            }

                            .slider-tooltip {
                                border-color: #e1306c !important;
                            }
                        }
                    }

                }
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
