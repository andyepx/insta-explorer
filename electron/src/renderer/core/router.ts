import Vue from 'vue';
import VueRouter, {RouteConfig} from "vue-router";
import Home from "../views/home.vue";
import Explore from '../views/explore.vue';

Vue.use(VueRouter);

const routes: RouteConfig [] = [{
    name: 'home',
    path: '/',
    component: Home
}, {
    name: 'explore',
    path: '/explore',
    component: Explore
}];

const router = new VueRouter({
    routes,
    mode: 'hash'
});

export default router;
