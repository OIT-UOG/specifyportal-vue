<template>
  <div style="height: 200px; overflow: hidden">
    <router-link to="/map">
      <GmapMap
        :center="center"
        :zoom="Math.max(0,zoom - 2)"
        ref="map"
        :options="{
          streetViewControl: false,
          zoomControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          scaleControl: false,
          rotateControl: false,
          disableDefaultUI: true,
        }"
        style="width:100%; height:248px; margin-top:-24px;"
        fill-height
        @idle="initializeMap"
      >
        <GmapPolygon
          v-for="poly in filterPolyList"
          :key="poly.id"
          :paths="poly.path"
          :editable="false"
          :draggable="false"
          :options="{
            fillColor: poly.color,
            strokeColor: poly.color,
            strokeWeight: filterPolyIsHighlighted(poly) ? 3 : 2,
            strokeOpacity: (filterPolyIsHighlighted(poly) ? 1 : 0.8) * (poly.selected ? 1 : 0),
            fillOpacity: (poly.selected ? 0.35 : 0.15) + (filterPolyIsHighlighted(poly) ? 0.05 : 0),
          }"
          @click="toggleHighlight(poly)"
        ></GmapPolygon>
        <GmapPolyline
          v-for="poly in filterPolyList"
          :editable="false"
          :draggable="false"
          :key="'in' + poly.id"
          :path="[...poly.path, poly.path[0]]"
          :options="{
            icons: [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: poly.selected ? 0 : filterPolyIsHighlighted(poly) ? 1 : 0.5,
                  scale: filterPolyIsHighlighted(poly) ? 4 : 3,
                },
                offset: '0',
                repeat: '20px',
              },
            ],
            strokeColor: poly.color,
            strokeWeight: filterPolyIsHighlighted(poly) ? 3 : 2,
            strokeOpacity: 0,
          }"
        ></GmapPolyline>
      </GmapMap>
    </router-link>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { gmapApi } from 'vue2-google-maps';

export default {
  props: {
    isOpen: Boolean
  },
  data () {
    return {

    }
  },
  computed: {
    ...mapGetters(['filterPolyList', 'filterPolyIsHighlighted', 'filterPolyIsHighlighted']),
    ...mapState(['google']),
    ...mapState({
      zoom: 'mapZoom',
      center: 'mapCenter',
      bounds: 'mapBounds',
    })
  },
  methods: {
    initializeMap() {
      let retry = typeof this.$refs.map.$mapObject === 'undefined';
      if (!retry) {
        const bounds = this.$refs.map.$mapObject.getBounds();
        retry = typeof bounds === 'undefined';
      }
      if (retry) {
        setTimeout(() => {
          this.initializeMap();
        }, 50);
        return;
      }
      if (this.bounds === null) {
        const bounds = this.$refs.map.$mapObject.getBounds()
        const span = bounds.toSpan();
        if (Math.min(span.lat(), span.lng()) > 0) {
          this.setMapBounds(bounds);
        }
      }
      if (this.google === null) {
        this.setGoogle(gmapApi());
      }
    },
    toggleHighlight(poly) {
      if (this.filterPolyIsHighlighted(poly)) {
        this.setFilterPolyHighlighted(null)
      } else {
        this.setFilterPolyHighlighted(poly)
      }
    },
    ...mapActions([
      'setGoogle',
      'setMapBounds',
      'setFilterPolyHighlighted',
    ])
  },
  watch: {
    isOpen() {
      if (this.isOpen) {
        this.initializeMap()
      }
    }
  },
}
</script>

<style>

</style>
