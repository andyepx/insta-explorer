import Vue from 'vue';

import App from './App.vue';
import {vuexStore} from './core/store';
import router from "./core/router";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {library} from '@fortawesome/fontawesome-svg-core';
import {faHeart} from "@fortawesome/free-regular-svg-icons/faHeart";
import {faCalendar} from "@fortawesome/free-regular-svg-icons/faCalendar";
import {faComment} from "@fortawesome/free-regular-svg-icons/faComment";
import {faMap} from "@fortawesome/free-regular-svg-icons/faMap";
import {faTh} from "@fortawesome/free-solid-svg-icons/faTh";
import {faThList} from "@fortawesome/free-solid-svg-icons/faThList";
import {faArrowUp} from "@fortawesome/free-solid-svg-icons/faArrowUp";

Vue.use(require('vue-electron'));

Vue.config.productionTip = true;

library.add(
    faHeart,
    faCalendar,
    faComment,
    faMap,
    faTh,
    faThList,
    faArrowUp
);
Vue.component('font-awesome-icon', FontAwesomeIcon);

new Vue({
    router: router,
    store: vuexStore,
    render: (h) => h(App),
}).$mount('#app');
