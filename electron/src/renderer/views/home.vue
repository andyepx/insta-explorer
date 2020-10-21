<template>
    <div class="home">
        <template v-if="!uploading">
            <h1>Welcome!</h1>
            <p>
                To get started, select a dataset zip file. The zip file you select should include the Instamancer JSON
                output as well as any images you downloaded when you scraped the data.
            </p>
            <button @click="openDataset">
                <font-awesome-icon :icon="['fas', 'arrow-up']"></font-awesome-icon>
                Select dataset
            </button>
        </template>
        <template v-else>
            <h1>{{uploadMessage}}</h1>
        </template>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import store from "../core/store";
    import lunr from "lunr";
    import Electron from "electron";

    @Component
    export default class Home extends Vue {
        uploadMessage = "";
        uploading = false;

        mounted() {
            Electron.ipcRenderer.on('web-server-config', (x, y) => {
                console.log(y);
                store.commitSetPort(JSON.parse(y).port);
            });
        }

        openDataset() {
            store.dispatchClearAllData();

            if (store.state.port === 0) {
                Electron.ipcRenderer.send('new-port');
            }

            Electron.remote.dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{extensions: ['zip'], name: '*'}]
            })
                .then(x => {
                    if (x.filePaths && x.filePaths.length > 0) {
                        this.uploading = true;
                        this.uploadMessage = 'Loading file...';

                        x.filePaths.forEach(k => {
                            this.uploadMessage = 'Unzipping...';

                            const unzip = require('electron').remote.require('./unzip');
                            unzip(k).then((path: string) => {
                                this.uploadMessage = 'Processing data...';

                                Electron.ipcRenderer.send('temp-path', path);

                                store.commitTempPath(path);
                                const process = require('electron').remote.require('./process');
                                process(path).then((e: {
                                    index: lunr.Index,
                                    data: any,
                                    aggs: any,
                                    ranges: any
                                }) => {
                                    (window as any).lunrIndex = e.index;

                                    store.commitJsonData({...e.data});
                                    store.commitHashtags(e.aggs.hashtags);
                                    store.commitUsers(e.aggs.users);

                                    Object.keys(e.ranges).forEach(field => {
                                        store.commitRangeMin({field: field, data: e.ranges[field].min});
                                        store.commitRangeMax({field: field, data: e.ranges[field].max});
                                        store.commitRangeSelection({
                                            field: field,
                                            data: [e.ranges[field].min, e.ranges[field].max]
                                        });
                                    });

                                    const display: string[] = e.index
                                        .search('hasImage:true')
                                        .map(r => r.ref);
                                    store.commitKeys([...display]);
                                    store.commitDisplay([...display]);

                                    this.$router.push({name: 'explore'});
                                });
                            })
                        })
                    }
                })
        }
    }
</script>

<style lang="scss" scoped>
    .home {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        flex-direction: column;
        padding: 4rem;
        box-sizing: border-box;
        color: #8e3a69;

        h1 {
            font-weight: 200;
            font-size: 2.5rem;
            margin: 1rem;
        }

        p {
            text-align: center;
            line-height: 1.5;
            font-size: 1.1rem;
        }

        button {
            margin: 3rem;
            border: 1px solid #C13584;
            color: #C13584;
            background: white;
            font-size: 1.1rem;
            border-radius: 5px;
            padding: 1rem 2rem;
            cursor: pointer;

            &:hover {
                background: #C13584;
                color: white;
            }
        }
    }
</style>