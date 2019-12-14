import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import {Action, createVuexStore, Mutation, State} from 'vuex-simple';
import {Data, Dataset, FilterField, LabelValue} from "./models";

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
    // display: { [key: string]: any };
    display: any[];
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
        this.state.allHashtags = Object.freeze(Array.from(new Set([...x].map(k => k.toLowerCase()))).sort());
    }

    @Mutation()
    commitUsers(x: string[]) {
        this.state.allUsers = Object.freeze(Array.from(new Set([...x].map(k => k.toLowerCase()))).sort());
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
    commitFilterDirty(x: FilterField) {
        if (x === 'hashtags' || x === 'users') {
            Vue.set(this.state.filterDirty, x, (this.state.multiselectSelect[x].length > 0));
        } else {
            Vue.set(this.state.filterDirty, x, true);
        }
    }

    @Mutation()
    commitDisplay(x: any[]) {
        this.state.display = [...x];
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
    dispatchFilterData(field: FilterField) {
        this.commitFilterDirty(field);
        let filteredData = [...this.state.allData];
        Object.keys(this.state.filterDirty)
            .filter(x => this.state.filterDirty[x])
            .forEach(f => {
                switch (f as FilterField) {
                    case "comments":
                        filteredData = filteredData
                            .filter(x => x.comments >= this.state.rangeSelection[f][0] && x.comments <= this.state.rangeSelection[f][1]);
                        break;
                    case "likes":
                        filteredData = filteredData
                            .filter(x => x.likes >= this.state.rangeSelection[f][0] && x.likes <= this.state.rangeSelection[f][1]);
                        break;
                    case "users":
                        filteredData = filteredData
                            .filter(x => this.state.multiselectSelect[f].indexOf(x.user.toLowerCase()) > -1);
                        break;
                    case "hashtags":
                        filteredData = filteredData
                            .filter(x => {
                                const t = x.hashtags.filter(l => this.state.multiselectSelect[field].indexOf(l.toLowerCase()) > -1);
                                return t.length === this.state.multiselectSelect[field].length;
                                // x.hashtags.findIndex(k => this.state.multiselectSelect[field].indexOf(k) > -1) > -1
                            });
                        break;
                }
            });
        this.commitDisplay(filteredData.map(x => x.id));
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