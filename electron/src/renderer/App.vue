<template>
    <div id="app">
        <system-information/>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import Multiselect from 'vue-multiselect';
    import SystemInformation from "./components/SystemInformation.vue";

    @Component({
        components: {
            SystemInformation,
            Multiselect,
        },
    })
    export default class App extends Vue {
        mounted() {
            console.log("hello!");
            const e: number[] | undefined = [-1000];
            console.log(e?.length)
        }
    }
</script>

<style lang="scss">

</style>
