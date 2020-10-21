// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

// v-lazyload

<template>
  <v-dialog
    v-model="opened"
    scrollable fullscreen
    persistent :overlay="false"
    transition="dialog-transition"
  >

    <v-card v-if="everOpened || opened">
      <v-img 
        v-if="items.length === 1" 
        :src="image(items[0]).src"
        height="100%" 
        max-width="100%"
        contain 
        class="grey lighten-5"
        style="height: 100vh"
      >
        <template v-slot:placeholder>
          <div
            class="fill-height d-flex justify-center align-center"
          >
            <v-progress-circular
              style="margin: 0 auto;"
              indeterminate
              color="green lighten-3"
              size="100"
              width="10"
            ></v-progress-circular>
          </div>
        </template>
      </v-img>

      <v-carousel class="full-screen-carousel" hide-delimiters height="100%" 
        :cycle="false"
        v-model="selectedImg"
      >
        <v-carousel-item
          v-for="i in items"
          :key="uniqueImgId(i)"
          light
        >
          <v-img 
            :src="image(i).src"
            height="100%" 
            max-width="100%"
            contain 
            class="grey lighten-5"
            style="height: 100vh"
          >
            <template v-slot:placeholder>
              <div
                class="fill-height d-flex justify-center align-center"
              >
                <v-progress-circular
                  style="margin: 0 auto;"
                  indeterminate
                  color="green lighten-3"
                  size="100"
                  width="10"
                ></v-progress-circular>
              </div>
            </template>
          </v-img>
        </v-carousel-item>
      </v-carousel>
      <v-btn
        style="position: absolute;"
        icon
        dark
        color="grey darken-2"
        @click="opened = false"
      >
        <v-icon>close</v-icon>
      </v-btn>
    </v-card>
  </v-dialog>
  <!-- <v-card flat tile class="d-flex img_default_height">
    <v-flex
      class="tv-thumb-wrap ma-1"
      :id="id"
      :data-width="size"
      :title="title"
      :style="style"
    >
      <v-layout
        v-if="!loaded"
        fill-height
        justify-center
        align-center
      >
        <v-progress-circular
          indeterminate
          color="green lighten-3"
        ></v-progress-circular>
      </v-layout>
      <div
        v-if="use_summary"
        class="tv-thumb-summary"
      >
        {{ this.title || "\xa0" }}
      </div>
    </v-flex>
  </v-card> -->
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: "FullScreenImageItem",
  data () {
    return {
      loaded: false,
      cycle: false,
      summary: "",
      images: {},
      everOpened: false,
      selectedImage: 0,
    }
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    selected: {
      type: Number,
      required: false,
      default: 0,
    },
    use_summary: {
      default: false,
      type: Boolean,
      required: false
    }
  },
  watch: {
    opened() {
      console.log(this.items)
      this.items.forEach(i => {
        this.image(i)
      });
      this.everOpened = true;
    },
    selected() {
      this.selectedImage = Math.min(this.selected, this.items.length-1);
    }
  },
  computed: {
    opened: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    },
    selectedImg: {
      get() {
        return Math.min(this.selected, this.items.length-1);
      },
      set(val) {
        this.$emit('update:selected', val);
      } 
    },
    style () {
      let style = `background-image: url(${this.loadedSource}); `
      // style += `width: ${this.sizeChart[this.size]}px;`
      return style
    },
    ...mapGetters(['getImageSize', 'imageUrl'])
  },
  methods: {
    imgLoaded (img) {
      return ('loaded' in img) && img.loaded;
    },
    uniqueImgId({ collection, filename }) {
      return `${collection}|${filename}`;
    },
    image(img) {
      const id = this.uniqueImgId(img);
      if (id in this.images) {
        return this.images[id]
      }
      let mg = { collection: img.collection, filename: img.filename, spid: img.spid, loaded: false, src: undefined };
      this.$set(this.images, id, mg);
      const url = this.imageUrl(img.collection, img.filename, null);
      
      // let imgo = new Image();
      // imgo.onload = () => {
      //   mg.src = url;
      //   mg.loaded = true;
      // }
      mg.src = url
      // imgo.src = url;
      return mg;
    },
    ...mapActions(['setImageSize'])
  },
  mounted() {
    this.selectedImage = this.selected;
  }
}
</script>

<style scoped>
.full-screen-carousel >>> .v-carousel__prev button,
.full-screen-carousel >>> .v-carousel__next button {
  background: rgba(0,0,0,.2);
}

/* 
fix for non-reproducable style="height 0px" issue when loading both carousels, 
closing this one, switching card image, then reopening this carousel 
*/
.full-screen-carousel >>> .v-window__container, 
.full-screen-carousel >>> .v-window__container .v-carousel__item {
  height: 100% !important;
}
</style>
