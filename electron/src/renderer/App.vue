<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    @Component
    export default class App extends Vue {

    }
</script>

<style lang="scss">
    @import url('https://fonts.googleapis.com/css?family=Barlow:100,200,300,400,500,600,700,800&display=swap');
    @import '~vue-multiselect/dist/vue-multiselect.min.css';

    body {
        margin: 0;
        padding: 0;
    }

    #app {
        font-family: 'Barlow', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #fafafa;
    }
</style>
