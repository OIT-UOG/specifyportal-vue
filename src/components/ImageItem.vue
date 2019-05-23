// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

// v-lazyload

<template>
  <v-card flat tile class="image__wrapper d-flex">
    <v-img
      class="image__item"
      :src="source"
      :lazy-src="source"
      :data-url="source"
      :style="style"
      alt="alt"
    >
      <template v-slot:placeholder>
        <v-layout
          fill-height
          align-center
          justify-center
          ma-0
        >
          <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
        </v-layout>
      </template>
    </v-img>
  </v-card>
</template>

<script>
export default {
  name: "ImageItem",
  props: {
    source: {
      type: String,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    alt: {
      type: String,
      required: false
    }
  },
  computed: {
    style () {
      return `height: ${ this.height }`
    }
  }
}
</script>
