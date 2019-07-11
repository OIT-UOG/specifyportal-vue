// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

<template>
  <v-layout fill-height>
    <v-infinite-scroll
      :loading="loading"
      @bottom="loadMore"
      :offset='imgHeight * 2'
      class="layout row wrap"
      :style="style"
    >
      <v-container
        fluid
        pa-1
        class="white-bg"
        ref="galleryContainer"
        style="height: 100%;"
        v-resize="onResize"
      >
        <v-layout
          row
          wrap
        >
            <v-flex
              v-for="img in loadedImages"
              :key="img.filename"
              d-flex
            >
              <a href="#">
                <ImageItem
                  v-bind:source="imageUrl(img.collection, img.filename)"
                  v-bind:height="180"
                  v-bind:id="img.unique_id"
                  v-bind:title="imgTitle(img)"
                />
              </a>
            </v-flex>
            <div class="flex-more"></div>
        </v-layout>
      </v-container>
    </v-infinite-scroll>
  </v-layout>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ImageItem from '@/components/ImageItem'

export default {
  name: 'Gallery',
  components: {
    ImageItem
  },
  data () {
    return {
      index: 0,
      loading: false,
      querying: false,
      windowSizes: {
        w: window.innerWidth,
        h: window.innerHeight,
      }
    }
  },
  computed: {
    style () {
      return `overflow-y: scroll; max-height: 90vh;`
    },
    imgHeight () {
      return this.imageSizes.regular
    },
    imageSizes () {
      return this.$options.components.ImageItem.data().sizeChart
    },
    smallestImageSize () {
      return Math.min(...Object.values(this.imageSizes))
    },
    maxImagesPerPage() {
      let minW = this.smallestImageSize
      let minH = this.imgHeight
      let h = this.windowSizes.h
      let w = this.windowSizes.w

      let imgs = Math.floor(w / minW) * Math.ceil(h / minH)
      console.log('max imgs', imgs)
      return imgs
    },
    loadedImages () {
      return this.images.slice(0, this.index + 1)
    },
    ...mapGetters(['imageUrl', 'getSpecimenById']),
    ...mapGetters({images: 'viewImages'})
  },
  methods: {
    onResize () {
      try {
        this.windowSizes.h = this.$refs.galleryContainer.clientHeight
        this.windowSizes.w = this.$refs.galleryContainer.offsetWidth
      } catch(error) {
        this.windowSizes.h = window.innerHeight
        this.windowSizes.w = window.innerWidth
      }
      console.log('resized',this.maxImagesPerPage * 1.5,this.index)
      if ((this.maxImagesPerPage * 1.5) >= this.index) {
        this.loadMore()
      }
    },
    async loadMore() {
      let numToLoad = this.maxImagesPerPage
      let newIndex = this.index + numToLoad
      let nextIndex = newIndex + numToLoad
      let moreToQuery = true
      console.log('loading more', this.index, newIndex, this.images.length)
      if (newIndex > this.images.length && !this.querying) {
        this.loading = true
        this.querying = true
        console.log('more more')
        moreToQuery = await this.more()
        this.querying = false
        this.loading = false
      }
      this.index = Math.min(newIndex, this.images.length)
      if (nextIndex > this.images.length && !this.querying) {
        this.querying = true
        moreToQuery = await this.more()
        this.querying = false
      }
      console.log(this.index)
    },
    imgTitle(img) {
      let spec = this.getSpecimenById(img.collection, img.spid)
      // console.log(spec)
      return spec.fn
    },
    ...mapActions(['more'])
  },
  watch: {
    async images (newVal, oldVal) {
      // WIP
      console.log('emit')
      this.$emit('new-images')
      await this.loadMore()
    }
  },
  async mounted () {
    window.vuegal = this
    // await this.loadMore()
  },
}
</script>

<style>
  .flex-more {
    flex: 100 1 auto
  }
  .white-bg {
    background-color: #fff !important
  }
</style>
