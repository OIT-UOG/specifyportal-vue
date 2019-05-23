// https://css-tricks.com/lazy-loading-images-with-vue-js-directives-and-intersection-observer/

<template>
  <v-layout>
    <v-flex xs12>
      <v-container grid-list-sm fluid>
        <v-layout row wrap>
          <v-flex
            v-for="img in images"
            :key="img.filename"
            xs6 sm3 md2
            d-flex
          >
            <a href="#">
              <ImageItem
                v-bind:source="imageUrl(img.collection, img.filename)"
                v-bind:height="200"
              />
            </a>
          </v-flex>
        </v-layout>
      </v-container>
    </v-flex xs12>
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
    ...mapGetters(['imageUrl', 'images'])
  }
}
</script>
