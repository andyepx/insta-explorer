import Vue from 'vue';

import App from './App.vue';
import {vuexStore} from './core/store';
import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {faHeart} from "@fortawesome/free-regular-svg-icons/faHeart";
import {faComment} from "@fortawesome/free-regular-svg-icons/faComment";
import {faTh} from "@fortawesome/free-solid-svg-icons/faTh";
import {faThList} from "@fortawesome/free-solid-svg-icons/faThList";

Vue.use(require('vue-electron'));

Vue.config.productionTip = true;

library.add(faHeart, faComment, faTh, faThList);

new Vue({
    store: vuexStore,
    render: (h) => h(App),
}).$mount('#app');
