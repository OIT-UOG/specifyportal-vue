// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

<template>
  <v-layout>
    <v-flex xs12>
      <v-container fluid pa-1 class="white-bg">
        <v-layout row wrap>
          <v-flex
            v-for="img in images"
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
    </v-flex>
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

    }
  },
  computed: {
    ...mapGetters(['imageUrl', 'images', 'getSpecimenById'])
  },
  methods: {
    imgTitle(img) {
      let spec = this.getSpecimenById(img.collection, img.spid)
      // console.log(spec)
      return spec.fn
    },
  }
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
