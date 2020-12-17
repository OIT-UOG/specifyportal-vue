<template>
  <v-container fill-height fluid pa-0>
    <v-layout row fill-height>
      <v-flex fill-height>
        <GmapMap
          :center="center"
          :zoom="zoom"
          ref="map"
          :options="{
            streetViewControl: false,
            zoomControl: false,
            fullscreenControl: false,
          }"
          style="width:100%; height:100%;"
          fill-height
          @click="togglePoly"
          @zoom_changed="updateMapZoom($event)"
          @center_changed="centeringOn = {
            lat: $event.lat(),
            lng: $event.lng()
          }"
          @idle="updateMapCenter(centeringOn)"
        >
          <GmapMarker
            v-for="(marker, i) in globalGeoFacetsNotVisibleGeoFacets"
            :position="marker.position"
            :options="{
              icon: {
                url: DOT_IMG,
                anchor: {x: 9.5, y: 10},
              }
            }"
            @click="toggleInfo(marker,'in' + i,$event)"
          ></GmapMarker>
          <GmapMarker
            v-for="(marker, i) in visibleGeoFacets"
            :position="marker.position"
            @click="toggleInfo(marker,i,$event)"
          ></GmapMarker>
          <GmapPolygon
            v-for="poly in filterPolyList"
            :key="poly.id"
            :paths="poly.path"
            :editable="true"
            :draggable="true"
            @paths_changed="updateEdited($event, poly)"
            :options="{
              fillColor: poly.color,
              strokeColor: poly.color,
              strokeWeight: filterPolyIsHighlighted(poly) ? 3 : 2,
              strokeOpacity: (filterPolyIsHighlighted(poly) ? 1 : 0.8) * (poly.selected ? 1 : 0),
              fillOpacity: (poly.selected ? 0.35 : 0.15) + (filterPolyIsHighlighted(poly) ? 0.05 : 0),
            }"
            @click="togglePolyMenu($event, poly)"
          ></GmapPolygon>
          <GmapPolyline
            v-for="poly in filterPolyList"
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
          <GmapInfoWindow
            :options="infoOptions"
            :position="infoPosition"
            :opened="infoOpen"
            @closeclick="infoOpen=false"
          ></GmapInfoWindow>
          <GmapInfoWindow
            :position="polyPosition"
            :opened="polyOpen"
            @closeclick="polyOpen=false"
          >
            <v-btn class="ma-0" icon tile large @click="newPoly(polyPosition, zoom)">
              <v-icon>crop</v-icon>+
            </v-btn>
          </GmapInfoWindow>
          <GmapInfoWindow
            v-if="highlightedPoly !== null"
            :position="polyMenuPosition"
            :opened="polyMenuOpen"
            @closeclick="togglePolyMenu($event, highlightedPoly)"
          >
            <v-btn class="ma-0" icon tile large @click="togglePolySelected(highlightedPoly)">
              <v-icon v-if="highlightedPoly.selected">remove_circle_outline</v-icon>
              <v-icon v-else>add_circle</v-icon>
            </v-btn>
            <v-btn class="ma-0" icon tile large @click="deletePoly(highlightedPoly)">
              <v-icon>delete</v-icon>
            </v-btn>
          </GmapInfoWindow>
        </GmapMap>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import _ from 'lodash'

import { gmapApi } from 'vue2-google-maps';
import colors from 'vuetify/lib/util/colors'

const DOT_IMG = require('../assets/dot.svg')

// TODO: make zoom, center, paths, url params
// TODO: search: list of colored selection checkboxes.
//      ACTIONS:
//        Selection:
//        >  checkbox -> select/unselect
//        >  delete -> delete
//        >  dropdown/drawer thing -> load/reveal minimap with single selectioon drawn
//        Add:
//        >  switch to map view with poly menu open on center... or adds a selection at center
export default {
  name: 'MapView',
  data () {
    return {
      centeringOn: null,
      menu: false,
      infoOptions: {
        content: '',
        //optional: offset infowindow so it visually sits nicely on top of our marker
        pixelOffset: {
          width: 0,
          height: -35
        }
      },
      infoPosition: null,
      infoOpen: false,
      infoId: null,
      polyPosition: null,
      polyOpen: false,
      colorIndex: 0,
      polyId: 0,
      polyMenuOpen: false,
      polyMenuPosition: null,
      // polyMenuPoly: null,
      // polyHighlighted: null,
      containsCoords: [],
      DOT_IMG: require('../assets/dot.svg')
    }
  },
  computed: {
    googleRaw: {
      get() {
        if (this.google === null) {
          this.setGoogle(gmapApi());
        }
        return this.google;
      }
    },
    ...mapGetters([
      'visibleGeoFacets',
      'invisibleGeoFacets',
      'globalGeoFacetsNotVisibleGeoFacets',
      'invisibleGlobalGeoFacets',
      'filterPolyList',
      'filterPolyIsHighlighted'
    ]),
    ...mapState(['geoFacets', 'google', 'globalGeoFacets']),
    ...mapState({
      zoom: 'mapZoom',
      center: 'mapCenter',
      bounds: 'mapBounds',
      highlightedPoly: 'filterPolyHighlighted',
    })
  },
  watch: {
    geoFacets() {
      this.infoPosition = null;
      this.infoOptions.content = '';
      this.infoOpen = false;
    },
  },
  methods: {
    updateMapZoom(zoom) {
      this.setMapZoom(zoom);
      this.updateMapBounds()
    },
    updateMapCenter(center) {
      this.setMapCenter(center);
      this.updateMapBounds()
    },
    updateMapBounds() {
      const bounds = this.$refs.map.$mapObject.getBounds()
      this.setMapBounds(bounds);
    },
    updateEdited(e, poly) {
      let path = []
      let mvcArray = e.getAt(0)
      for (let i=0; i<mvcArray.getLength(); i++) {
        let pt = mvcArray.getAt(i);
        path.push({
          lat: pt.lat(),
          lng: pt.lng()
        })
      }
      this.setFilterPolyPath({ poly, path })
    },
    togglePoly(e) {
      this.polyOpen = !this.polyOpen;
      this.polyPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
      if (this.polyMenuOpen) {
        this.setFilterPolyHighlighted(null)
      }
      this.infoOpen = false
    },
    togglePolyMenu(e, path) {
      if (this.filterPolyIsHighlighted(path)) {
        this.polyMenuOpen = !this.polyMenuOpen;
      } else {
        if (this.highlightedPoly) {
          this.setFilterPolyHighlighted(null)
        }
        this.polyMenuOpen = true
        this.setFilterPolyHighlighted(path)
      }
      if (this.polyMenuOpen) {
        this.polyOpen = false
        this.infoOpen = false
      } else {
        this.setFilterPolyHighlighted(null)
      }
      this.polyMenuPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
    },
    newPoly(position, zoom) {
      this.createFilterPoly({ tl: position })
      this.polyOpen = false;
    },
    deletePoly(poly) {
      this.polyMenuPosition = null
      this.setFilterPolyHighlighted(null)
      this.polyMenuOpen = false
      this.deleteFilterPoly(poly)
    },
    togglePolySelected(poly) {
      this.setFilterPolySelected({ poly, selected: !poly.selected });
    },
    toggleInfo(m, i, e) {
      this.infoPosition = m.position;
      this.infoOptions.content = '<strong>' + m.amount + '</strong> specimen';

      if (this.infoId == i) {
        this.infoOpen = !this.infoOpen;
      } else {
        this.infoOpen = true;
        this.infoId = i;
      }
      if (this.infoId.startsWith && this.infoId.startsWith('in')) {
        this.infoOptions.pixelOffset.height = -9;
      } else {
        this.infoOptions.pixelOffset.height = -35;
      }
      if (this.polyMenuOpen) {
        this.togglePolyMenu(e, this.highlightedPoly)
      }
      this.polyOpen = false
    },
    ...mapActions([
        'runNewQuery',
        'setQueryField',
        'setGoogle',
        'createFilterPoly',
        'deleteFilterPoly',
        'setFilterPolyPath',
        'setFilterPolySelected',
        'setFilterPolyHighlighted',
        'setMapZoom',
        'setMapCenter',
        'setMapBounds',
    ])
  },
  async mounted () {
    this.centeringOn = this.center;
    this.setGoogle(this.googleRaw);
  },
}
</script>
