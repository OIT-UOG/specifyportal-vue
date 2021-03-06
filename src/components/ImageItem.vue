// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

// v-lazyload

<template>
  <v-card flat tile class="d-flex img_default_height clickable" @click="fullScreen = !fullScreen">
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
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: "ImageItem",
  data () {
    return {
      loaded: false,
      summary: "",
      size: "regular",
      sizeChart: {
        'thinner': 108,
        'thin': 135,
        'regular': 180,
        'wide': 270,
        'wider': 324,
        'widest': 360,
      },
      fullScreen: false,
    }
  },
  props: {
    coll: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: "\xa0",
      required: false
    },
    alt: {
      type: String,
      required: false
    },
    use_summary: {
      default: true,
      type: Boolean,
      required: false
    }
  },
  computed: {
    style () {
      let style = `background-image: url(${this.loadedSource}); `
      style += `width: ${this.sizeChart[this.size]}px;`
      return style
    },
    items () {
      return [ { collection: this.coll, filename: this.filename, loaded: false } ]
    },
    width () {
      return this.pxSize(this.size)
    },
    source () {
      return this.imageUrl(this.coll, this.filename);
    },
    loadedSource () {
      return this.loaded? this.source : ""
    },
    ...mapGetters(['getImageSize', 'imageUrl'])
  },
  methods: {
    pxSize(size) {
      return this.sizeChart[size]
    },
    setDataWidthAndSummary(self){
      this.setParentDataWidth(self)
      if (this.use_summary) {
        this.setSummary(self)
      }
    },
    setParentDataWidth(self){
      // determine data value based on ratio
      var elem=self.parentNode;
      var ratio = self.naturalWidth / self.naturalHeight;
      var adjusted_width =
        ratio > 2 ? "widest" :
        ratio > 1.8 ? "wider" :
        ratio > 1.4 ? "wide" :
        ratio < .6 ? "thinner" :
        ratio < .8 ? "thin" : "regular";
      this.size = adjusted_width
      // elem.setAttribute('data-width', adjusted_width);
    },
    setSummary(self) {
      let desc = this.title
      let gi = desc.search('Genus');
      if (gi >= 0) {
        let newdesc = desc.substr(gi);
        newdesc = newdesc.substr(newdesc.search(':')+1).trim();
        this.title = newdesc || desc.substr(0, gi).trim() || this.title
      }
      // self.insertAdjacentHTML('afterend', "<div class=\"tv-thumb-summary\">" + desc + "</div>");
  },
    ...mapActions(['setImageSize'])
  },
  mounted() {
    let size = this.getImageSize(this.id)
    this.size = size || this.size

    let img = new Image()
    img.onload = () => {
      this.setDataWidthAndSummary(img)
      if (!size) {
        this.setImageSize({
          unique_id: this.id,
          size: this.size,
          width: this.width
        })
      }
      this.loaded = true
    }
    img.src = this.source;
  }
}
</script>

<style>
.clickable {
  cursor: pointer;
}

.img_default_height {
  height: 180px;
}

.tv-thumb-summary {
    background: rgba(0,0,0,.3);
    color: #fff;
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 5px;
    font-size: 12px;
}

.tv-thumb-wrap {
  background: center no-repeat #eee;
  background-size: cover;
  overflow: hidden;
  position: relative;
}

.tv-thumb-wrap:hover {
  box-shadow: 0 0 1px 1px rgb(192, 192, 192);
}
</style>
