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

            <div class="toggle-container">
                <toggle-button v-model="noImages"
                               @change="filterData()"
                               color="#e1306c"/>
                <span>Include posts without images</span>
            </div>


            <p>Number of comments</p>
            <div class="slider-container">
                <vue-range-slider ref="slider"
                                  :min="min['comments']"
                                  :max="max['comments']"
                                  v-model="rangeSelectionComments"
                                  :enable-cross="false"
                                  @drag-end="filterData()"></vue-range-slider>
            </div>

            <p>Number of likes</p>
            <div class="slider-container">
                <vue-range-slider ref="slider"
                                  :min="min['likes']"
                                  :max="max['likes']"
                                  v-model="rangeSelectionLikes"
                                  :enable-cross="false"
                                  @drag-end="filterData()"></vue-range-slider>
            </div>

            <p>User</p>
            <multiselect v-model="multiselectSelectUsers"
                         :options="allUsers"
                         :searchable="true"
                         :close-on-select="false"
                         :multiple="true"
                         :options-limit="allUsers.length"
                         @close="filterData()"
                         @remove="filterData()"
                         placeholder="User"></multiselect>

            <p>Hashtag</p>
            <multiselect v-model="multiselectSelectHashtags"
                         :options="allHashtags"
                         :searchable="true"
                         :close-on-select="false"
                         :multiple="true"
                         :options-limit="allHashtags.length"
                         @close="filterData()"
                         @remove="filterData()"
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
    import ToggleButton from 'vue-js-toggle-button'

    Vue.use(ToggleButton);

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

        get noImages() {
            return store.state.showNoImages;
        }

        set noImages(x: boolean) {
            store.dispatchShowNoImages(x);
        }

        filterData(x: any) {
            console.log("A", x);
            this.$emit('filter');
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

        .toggle-container {
            display: flex;
            align-items: center;
            margin: 0.5rem 0 1rem;
            font-weight: 500;

            span {
                display: inline-block;
                margin-left: .5rem;
            }
        }

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