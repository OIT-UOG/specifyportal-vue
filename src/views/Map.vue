<template>
  <v-container fill-height fluid pa-0>
    <v-layout row fill-height>
      <v-flex fill-height>
        <GmapMap
          :center="center"
          :zoom="zoom"
          style="width:100%; height:100%;"
          fill-height
        >
          <GmapMarker
            :key="i"
            v-for="(marker, i) in geoFacets"
            :position="marker.position"
            @click="center=marker.position"
          ></GmapMarker>
        </GmapMap>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  data () {
    return {
      zoom: 11,
      center: { lat: 13.477342, lng: 144.791369 }
    }
  },
  computed: {
    ...mapState(['geoFacetsOn']),
    ...mapGetters(['geoFacets']),
  },
  watch: {
    geoFacetsOn(newVal, oldVal) {
      if (!newVal) {
        this.setGeoFacets(true)
      }
    }
  },
  methods: {
    ...mapActions(['setGeoFacets', 'runNewQuery'])
  },
  async mounted () {
    this.setGeoFacets(true)
    await this.runNewQuery()
  },
  destroyed () {
    this.setGeoFacets(false)
  },
}
</script>
