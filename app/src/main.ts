import Vue from 'vue';
import App from './App.vue';
import {vuexStore} from './core/store';

Vue.config.productionTip = false;

navigator.serviceWorker.register('/service-worker.js')
    .then((registration) =>
        console.log(`Service Worker registration complete, scope: '${registration.scope}'`))
    .catch((error) =>
        console.log(`Service Worker registration failed with error: '${error}'`));

new Vue({
    store: vuexStore,
    render: (h) => h(App),
}).$mount('#app');
