<template>
    <div class="content">
        <div class="img-container"
             :style="{backgroundImage: `url('${postImage}')`}"></div>
        <div class="post-data">
            <div class="meta">
                <p>
                    <a href="#"
                       @click.stop.prevent="addUserToFilters(post.owner.username)">
                        @{{post.owner.username}}
                    </a>
                </p>
                <p style="margin-top: .5rem;">
                    <font-awesome-icon :icon="['far', 'calendar']"></font-awesome-icon>
                    {{postDate}}
                </p>
                <p v-if="post.location"
                   style="margin: .5rem 0;">
                    <font-awesome-icon :icon="['far', 'map']"></font-awesome-icon>
                    {{post.location.name}}
                </p>
                <p style="margin-top: .5rem;">
                    <font-awesome-icon :icon="['far', 'heart']"></font-awesome-icon>
                    {{post.edge_media_preview_like.count}}
                    likes
                </p>
                <p style="margin: .5rem 0;">
                    <font-awesome-icon :icon="['far', 'comment']"></font-awesome-icon>
                    {{post.edge_media_to_parent_comment.count}}
                    comments
                </p>
            </div>
            <div class="comments">
                <p v-for="c in post.edge_media_to_parent_comment.edges">
                    <a href="#"
                       @click.stop.prevent="addUserToFilters(post.owner.username)">
                        @{{c.node.owner.username}}
                    </a>
                    <br>
                    <span v-html="parseComment(c.node.text)"
                          class="comment"></span>
                </p>
            </div>
            <!--            <div class="tags">-->
            <!--                <a class="tag"-->
            <!--                   href="#"-->
            <!--                   v-for="tag in data.hashtags"-->
            <!--                   @click.stop.prevent="addTagToFilters(tag)">-->
            <!--                    {{tag}}-->
            <!--                </a>-->
            <!--            </div>-->
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import fromUnixTime from 'date-fns/fromUnixTime'
    import format from 'date-fns/format'
    import VueLazyload from "vue-lazyload";
    import store from '../core/store';

    Vue.use(VueLazyload);

    @Component
    export default class Item extends Vue {
        @Prop({required: true}) data!: any;
        private postImage: string = '';

        mounted() {
            if (this.hasImage) {
                // this.postImage = `http://localhost:${store.state.port}/${this.post.shortcode}.jpg`;
                const image = require('electron').remote.require('./image');
                image(store.state.tempPath, this.post.shortcode).then((base64: string) => {
                    this.postImage = base64;
                });
            }
        }

        get post() {
            return this.data.postData.shortcode_media;
        }

        get hasImage() {
            return this.data.hasImage;
        }

        get postDate() {
            return format(fromUnixTime(this.post.taken_at_timestamp), 'd LLL yyyy HH:mm')
        }

        addUserToFilters(user: string) {
            // if (this.multiselectSelect['users'].indexOf(user) === -1) {
            //     store.commitMultiselectSelect({field: 'users', value: user});
            // }
        }

        addTagToFilters(tag: string) {
            // if (this.multiselectSelect['hashtags'].indexOf(tag) === -1) {
            // store.commitMultiselectSelect({field: 'hashtags', value: tag});
            // }
        }

        parseComment(comment: string) {
            return comment.replace(/(#[a-zA-Z0-9]*)/g, '<a href="#">$1</a>');
        }
    }
</script>

<style lang="scss" scoped>
    .content {
        padding: 0;
        height: 250px;
        display: flex;
        box-sizing: border-box;
        border: 1px solid #eaeaea;
        margin: 0.5rem;
        border-radius: 5px;
        background: white;
        overflow: hidden;

        .img-container {
            width: 250px;
            height: 250px;
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            flex: 0 0 250px;
        }

        .post-data {
            display: flex;
            overflow-y: auto;
            overflow-x: hidden;
            margin: 1rem;
            width: 100%;

            .meta {
                flex: 0 0 250px;
            }

            p {
                text-align: left;
                margin: 0 0 0.2rem;
            }

            ::v-deep a {
                text-decoration: none;
                color: #405de6;

                &:hover {
                    color: #5851db;
                }
            }

            .tags {
                .tag {
                    display: inline-block;
                    padding: .2rem;
                }
            }

            .comments {
                flex: 1;

                p {
                    background: #f7f7f7;
                    padding: 0.3rem;
                    border-radius: 5px;

                    .comment {
                        display: inline-block;
                        padding-left: 1rem;
                    }
                }
            }
        }

    }
</style>