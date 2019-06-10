// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

// v-lazyload

<template>
  <v-card flat tile class="d-flex img_default_height">
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
        class="tv-thumb-summary"
      >
        {{ this.title }}
      </div>
    </v-flex>
  </v-card>
</template>

<script>
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
    }
  },
  props: {
    source: {
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
      default: "",
      required: false
    },
    alt: {
      type: String,
      required: false
    }
  },
  computed: {
    style () {
      let style = `background-image: url(${this.source}); `
      style += `width: ${this.sizeChart[this.size]}px;`
      return style
  },
    width () {
      return this.pxSize(this.size)
    },
  methods: {
    pxSize(size) {
      return this.sizeChart[size]
    },
    setDataWidthAndSummary(self){
      // console.log('self', self)
      // console.log('this', this)
      this.setParentDataWidth(self)
      this.setSummary(self)
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
        this.title = newdesc || desc.substr(0, gi).trim()
      }
      // self.insertAdjacentHTML('afterend', "<div class=\"tv-thumb-summary\">" + desc + "</div>");
    }
  },
  mounted() {
    let img = new Image()
    img.onload = () => {
      // console.log('img', this)
      this.setDataWidthAndSummary(img)
      this.loaded = true
    }
    img.src = this.source
  }
}
</script>

<style>
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
