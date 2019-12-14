<template>
    <div>
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
                                  v-model="rangeSelectionComments"
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
                                  v-model="rangeSelectionLikes"
                                  :enable-cross="false"
                                  @drag-end="filterData('likes')"></vue-range-slider>
            </div>

            <p>User</p>
            <multiselect v-model="multiselectSelectUsers"
                         :options="allUsers"
                         :searchable="true"
                         :close-on-select="false"
                         :multiple="true"
                         :options-limit="allUsers.length"
                         @close="filterData('users')"
                         @remove="filterData('users')"
                         placeholder="User"></multiselect>

            <p>Hashtag</p>
            <multiselect v-model="multiselectSelectHashtags"
                         :options="allHashtags"
                         :searchable="true"
                         :close-on-select="false"
                         :multiple="true"
                         :options-limit="allHashtags.length"
                         @close="filterData('hashtags')"
                         @remove="filterData('hashtags')"
                         placeholder="Hashtags"></multiselect>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import VueRangeSlider from 'vue-range-component';
    import Multiselect from 'vue-multiselect';
    import store from '../core/store'
    import {LabelValue} from "../core/models";

    @Component({
        components: {
            VueRangeSlider,
            Multiselect
        },
    })
    export default class Filters extends Vue {
        get sortByOptions() {
            return store.state.sortByOptions;
        }

        get min() {
            return store.state.rangeMin;
        }

        get max() {
            return store.state.rangeMax;
        }

        get rangeSelectionLikes() {
            return store.state.rangeSelection['likes'];
        }

        set rangeSelectionLikes(data: [number, number]) {
            store.commitRangeSelection({field: 'likes', data: data})
        }

        get rangeSelectionComments() {
            return store.state.rangeSelection['comments'];
        }

        set rangeSelectionComments(data: [number, number]) {
            store.commitRangeSelection({field: 'comments', data: data})
        }

        get multiselectSelectHashtags() {
            return store.state.multiselectSelect['hashtags'];
        }

        set multiselectSelectHashtags(tag: string[]) {
            store.commitMultiselectSelect({field: 'hashtags', value: tag});
        }

        get multiselectSelectUsers() {
            return store.state.multiselectSelect['users'];
        }

        set multiselectSelectUsers(tag: string[]) {
            store.commitMultiselectSelect({field: 'users', value: tag});
        }

        get sortBy() {
            return store.state.sortBy;
        }

        set sortBy(x: LabelValue) {
            store.commitSortBy(x);
        }

        get allHashtags() {
            return store.state.allHashtags;
        }

        get allUsers() {
            return store.state.allUsers;
        }

        filterData(field: 'likes' | 'comments' | 'hashtags' | 'users') {
            store.dispatchFilterData(field);
        }
    }
</script>

<style lang="scss">
    @import '~vue-range-component/dist/vue-range-slider.css';
</style>

<style lang="scss" scoped>
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

            ::v-deep .vue-range-slider {
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
</style>