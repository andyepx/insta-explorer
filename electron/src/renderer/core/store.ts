import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import {Action, createVuexStore, Mutation, State} from 'vuex-simple';
import {Data, Dataset, FilterField, LabelValue} from "./models";

Vue.use(Vuex);

export interface State {
    tempPath: string;
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
    display: string[];
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
    commitTempPath(x: string) {
        this.state.tempPath = x;
    }

    @Mutation()
    commitDatasets(x: Dataset[]) {
        this.state.datasets = [...x];
    }

    @Mutation()
    commitHashtags(x: string[]) {
        this.state.allHashtags = [...x];
    }

    @Mutation()
    commitUsers(x: string[]) {
        this.state.allUsers = [...x];
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
    commitJsonData(x: any) {
        this.state.jsonData = Object.freeze({...x});
    }

    @Mutation()
    commitSortBy(x: LabelValue) {
        this.state.sortBy = {...x};
        if (this.state.sortBy.value !== '') {
            let r = [...this.state.allKeys];
            switch (this.state.sortBy.value) {
                case 'COMMENTS':
                case '-COMMENTS':
                    r = r.sort((a, b) => this.state.jsonData[a].comments - this.state.jsonData[b].comments);
                    break;
                case 'LIKES':
                case '-LIKES':
                    r = r.sort((a, b) => this.state.jsonData[a].likes - this.state.jsonData[b].likes);
                    break;
            }
            if (this.state.sortBy.value.indexOf('-') === 0) r = r.reverse();
            this.state.allKeys = [...r];
        }
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
    }

    @Mutation()
    commitAggs(x: { field: string, value: { count: number; item: string; }[] }) {
        Vue.set(this.state.aggs, x.field, Object.freeze(x.value));
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
    aggs: {},
    tempPath: ''
});

export const vuexStore = createVuexStore<Store>(instance, {
    strict: true
});

export default instance;