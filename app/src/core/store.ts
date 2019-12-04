import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import {Action, createVuexStore, Mutation, State} from 'vuex-simple';
import {Data, Dataset, LabelValue} from "@/core/models";

Vue.use(Vuex);

export interface State {
    rangeSelection: { [key: string]: [number, number] };
    rangeMin: { [key: string]: number };
    rangeMax: { [key: string]: number };
    datasets: Dataset[];
    sortBy: LabelValue;
    sortByOptions: LabelValue[];
    allHashtags: ReadonlyArray<string>;
    allUsers: ReadonlyArray<string>;
    allKeys: ReadonlyArray<string>;
    allData: ReadonlyArray<Data>;
    jsonData: { [key: string]: any };
    filterDirty: { [key: string]: boolean };
    multiselectSelect: { [key: string]: string[] };
    display: { [key: string]: any };
    aggs: { [key: string]: ReadonlyArray<{ count: number; item: number }> };
}

export class Store {
    @State()
    state: State;

    constructor(state: State) {
        this.state = state;
    }

    @Action()
    dispatchGetDatasets() {
        return axios.get('/datasets.json').then(x => {
            this.commitDatasets(x.data);
        });
    }

    @Mutation()
    commitDatasets(x: Dataset[]) {
        this.state.datasets = [...x];
    }

    @Mutation()
    commitHashtags(x: string[]) {
        this.state.allHashtags = Object.freeze([...x]);
    }

    @Mutation()
    commitUsers(x: string[]) {
        this.state.allUsers = Object.freeze([...x]);
    }

    @Mutation()
    commitData(x: Data[]) {
        this.state.allData = Object.freeze([...x]);
    }

    @Mutation()
    commitKeys(x: string[]) {
        this.state.allKeys = Object.freeze([...x]);
    }

    @Mutation()
    commitJsonData(x: { [key: string]: any }) {
        this.state.jsonData = Object.freeze({...x});
    }

    @Mutation()
    commitSortBy(x: LabelValue) {
        this.state.sortBy = {...x};
    }

    @Mutation()
    commitFilterDirty(x: string) {
        Vue.set(this.state.filterDirty, x, true);
    }

    @Mutation()
    commitDisplay(x: { field: string, data: any[] }) {
        Vue.set(this.state.display, x.field, [...x.data]);
    }

    @Mutation()
    commitRangeMin(x: { field: string, data: number }) {
        Vue.set(this.state.rangeMin, x.field, x.data);
    }

    @Mutation()
    commitRangeMax(x: { field: string, data: number }) {
        Vue.set(this.state.rangeMax, x.field, x.data);
    }

    @Mutation()
    commitRangeSelection(x: { field: string, data: [number, number] }) {
        Vue.set(this.state.rangeSelection, x.field, x.data);
    }

    @Mutation()
    commitMultiselectSelect(x: { field: 'users' | 'hashtags', value: string[] }) {
        this.state.multiselectSelect[x.field] = [...x.value];
        this.dispatchFilterData(x.field);
    }

    @Mutation()
    commitAggs(x: { field: 'likes' | 'comments', value: { count: number; item: number; }[] }) {
        Vue.set(this.state.aggs, x.field, Object.freeze(x.value));
    }

    @Action()
    dispatchFilterData(field: 'comments' | 'likes' | 'users' | 'hashtags') {
        this.commitFilterDirty(field);
        switch (field) {
            case "comments":
            case "likes":
                this.commitDisplay({
                    field: field,
                    data: [
                        ...this.state.allData
                            .filter(x => x[field] >= this.state.rangeSelection[field][0] && x[field] <= this.state.rangeSelection[field][1])
                            .map(x => ({
                                count: x[field],
                                id: x.id
                            }))
                    ]
                });
                break;
            case "users":
                this.commitDisplay({
                    field: field,
                    data: [
                        ...this.state.allData
                            .filter(x => this.state.multiselectSelect[field].indexOf(x.user) > -1)
                            .map(x => ({
                                count: 0,
                                id: x.id
                            }))
                    ]
                });
                // if (this.state.multiselectSelect[field].length === 0) this.filterDirty[field] = false;
                break;
            case "hashtags":
                this.commitDisplay({
                    field: field,
                    data: [
                        ...this.state.allData
                            .filter(x => x.hashtags.findIndex(k => this.state.multiselectSelect[field].indexOf(k) > -1) > -1)
                            .map(x => ({
                                count: 0,
                                id: x.id
                            }))
                    ]
                });
                // if (this.multiselectSelect[field].length === 0) this.filterDirty[field] = false;
                break;
        }
    }

    @Mutation()
    commitDefaultFilterDirty() {
        this.state.filterDirty = {
            comments: false,
            likes: false,
            users: false,
            hashtags: false
        };
    }

    @Mutation()
    commitDefaultMultiselectSelect() {
        this.state.multiselectSelect = {
            users: [],
            hashtags: []
        };
    }

    @Action()
    dispatchClearFiltersAndSorting() {
        this.commitDefaultFilterDirty();
        this.commitDefaultMultiselectSelect();
        this.commitSortBy({label: 'Default', value: ''});
    }

    @Mutation()
    commitClearData() {
        this.state.allHashtags = [];
        this.state.allUsers = [];
        this.state.allData = [];
        this.state.allKeys = [];
        this.state.jsonData = {};
        this.state.rangeMin = {
            comments: 0,
            likes: 0
        };
        this.state.rangeMax = {
            comments: 0,
            likes: 0
        };
        this.state.rangeSelection = {
            comments: [0, 0],
            likes: [0, 0]
        };
    }

    @Action()
    dispatchClearAllData() {
        this.commitClearData();
    }
}

const instance = new Store({
    datasets: [],
    sortBy: {label: 'Default', value: ''},
    sortByOptions: [{
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
    }],
    allHashtags: [],
    allUsers: [],
    allData: [],
    allKeys: [],
    jsonData: {},
    filterDirty: {
        comments: false,
        likes: false,
        users: false,
        hashtags: false
    },
    multiselectSelect: {
        users: [],
        hashtags: []
    },
    display: [],
    rangeMin: {
        comments: 0,
        likes: 0
    },
    rangeMax: {
        comments: 0,
        likes: 0
    },
    rangeSelection: {
        comments: [0, 0],
        likes: [0, 0]
    },
    aggs: {}
});

export const vuexStore = createVuexStore<Store>(instance, {
    strict: true
});

export default instance;