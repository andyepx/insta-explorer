<template>
    <div class="content" :class="thumbMode ? 'thumb' : ''">
        <div class="img-container"
             :style="{backgroundImage: `url('${dataset.files}/${post.shortcode}.jpg')`}"></div>
        <div class="post-data" v-if="!thumbMode">
            <p>
                <a href="#"
                   @click.stop.prevent="addUserToFilters(post.owner.username)">
                    @{{post.owner.username}}
                </a>
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
            <div class="tags">
                <a class="tag"
                   href="#"
                   v-for="tag in hashtags"
                   @click.stop.prevent="addTagToFilters(tag)">
                    {{tag}}
                </a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import {Component, Prop, Vue} from 'vue-property-decorator';
    import store from '../core/store';

    @Component
    export default class Item extends Vue {
        @Prop({required: true}) data!: any;
        @Prop({required: true}) dataset!: any;
        @Prop({default: () => true}) thumbMode!: boolean;

        get post() {
            return this.data.shortcode_media;
        }

        get multiselectSelect() {
            return store.state.multiselectSelect;
        }

        get allData() {
            return store.state.allData;
        }

        get hashtags() {
            return this.allData.find(x => x.id === this.data.id)?.hashtags
        }

        addUserToFilters(user: string) {
            if (this.multiselectSelect['users'].indexOf(user) === -1) {
                // store.commitMultiselectSelect({field: 'users', value: user});
            }
        }

        addTagToFilters(tag: string) {
            if (this.multiselectSelect['hashtags'].indexOf(tag) === -1) {
                // store.commitMultiselectSelect({field: 'hashtags', value: tag});
            }
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

        &.thumb {
            width: 250px;
        }

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
            flex-direction: column;
            overflow-y: auto;
            overflow-x: hidden;
            margin: 1rem;
            width: 100%;

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