<template>
    <div class="content">
        <div class="right">
            <filters @filter="filterData"></filters>
        </div>
        <div class="data">
            <div class="header">
                <h3>
                    Showing {{displayData.length}} posts
                </h3>
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
            </div>
            <div class="posts" v-show="!thumbMode">
                <RecycleScroller page-mode
                                 class="scroller"
                                 :items="displayData"
                                 :item-size="266"
                                 :prerender="5"
                                 key-field="id"
                                 v-slot="{ item }">
                    <item :data="jsonData[item.id]" :key="item.id"/>
                </RecycleScroller>
            </div>
            <div class="posts thumb" v-show="thumbMode">
                <template v-for="item in displayData">
                    <item :data="jsonData[item.id]" :key="item.id"/>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import Multiselect from 'vue-multiselect';
    import store from '../core/store';
    import Filters from '../components/filters.vue';
    import Item from '../components/item.vue';
    import lunr from 'lunr';
    import _ from 'lodash';

    import VueVirtualScroller from 'vue-virtual-scroller';
    import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

    Vue.use(VueVirtualScroller);


    @Component({
        components: {
            Multiselect,
            Filters,
            Item
        }
    })
    export default class Explore extends Vue {

        private lastResults: { [key: string]: { data: string, results: string[] } } = {};

        thumbMode: boolean = false;

        get jsonData() {
            return store.state.jsonData;
        }

        get displayData() {
            return store.state.display;
        }

        filterData() {
            if ((window as any).lunrIndex) {
                const withNoImages = store.state.showNoImages;
                const withImagesSearch = !withNoImages
                    ? this.search('hasImage', 'true')
                    : this.search('hasImage', '*');

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
                    ? this.search('likesSearch', _.range(likesRange[0], likesRange[1] + 1).map(e => `L${e}L`).join(' '))
                    : [];

                const commentsRange = store.state.rangeSelection['comments'];
                const searchComments = commentsRange[0] !== store.state.rangeMin['comments'] || commentsRange[1] !== store.state.rangeMax['comments'];
                const commentsSearch = searchComments
                    ? this.search('commentsSearch', _.range(commentsRange[0], commentsRange[1] + 1).map(e => `C${e}C`).join(' '))
                    : [];

                // if (withNoImages && users.length === 0 && hashtags.length === 0 && !searchLikes && !searchComments) {
                //     store.commitDisplay([...store.state.allKeys]);
                //     return;
                // }

                const e = _.intersection(...[withImagesSearch, usersSearch, hashtagsSearch, likesSearch, commentsSearch].filter(x => x.length > 0));

                store.commitDisplay([...e]);
            }
        }

        search(field: string, data: string) {
            const query = `${field}:${data}`;
            console.log("QUERY::: ", query);
            if (Object.keys(this.lastResults).indexOf(field) === -1 ||
                this.lastResults[field].data !== data) {
                this.lastResults[field] = {
                    data: data,
                    results: [
                        ...((window as any).lunrIndex as lunr.Index)
                            .search(query)
                            .map(x => x.ref)
                    ]
                };
            }
            return [...this.lastResults[field].results];
        }

        mounted() {
            console.log(fetch("app://-"), store.state.tempPath)
            if (Object.keys(store.state.jsonData).length === 0) {
                this.$router.push({name: 'home'})
            }
        }

    }
</script>

<style lang="scss">
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
            flex: 1;
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
                    flex: 1;
                }

                .toggle-mode {
                    padding: 0 .5rem;
                    text-align: right;
                    display: flex;

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
</style>