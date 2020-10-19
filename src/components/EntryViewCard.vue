<template>
    <v-card
      :width="width"
      :scrollable="false"
      class="pb-4"
    >
      <v-carousel
        v-if="showCarousel"
        :hide-actions="mapi==0"
        :hide-controls="mapi==0"
        :hide-delimiters="mapi==0"
        class="no-background no-shadow"
        :cycle="false"
        :max="width"
        v-model="caro_i"
        height="auto"
      >
        <v-carousel-item
          v-for="img in entry.img"
          :key="img.unique_id"
          :src="imageUrl(img.collection, img.filename, width)"
        >
        </v-carousel-item>
        <v-carousel-item
          v-if="showCoords"
          @click="toggleZoom"
        >
          <GmapMap
            :center="geo_coords"
            :zoom="10"
            style="width:100%; height:300px;"
            fill-height
            :options="mapOptions"
          >
          <!--           -->
            <GmapMarker
              :position="geo_coords"
              @dblclick="mapsSelector"
            ></GmapMarker>
          </GmapMap>
        </v-carousel-item>
      </v-carousel>
      <v-card-title primary-title class="headline">
        {{ entryTitle }}
        <v-btn flat icon absolute right v-if="geo_coords"
          @click="switchToMapOrDirections"
        >
          <v-icon>{{ (isMapPage) ? 'directions_car' : 'place' }}</v-icon>
        </v-btn>
      </v-card-title>
      <v-list
        :max-width="width"
      >
        <v-list-tile
          class="denser"
          v-for="field in relaventFields"
          :key="field.solrname"
        >
          <v-list-tile-title>{{ field.title }}</v-list-tile-title>
          <v-list-tile-sub-title class="text-right">
            {{ entry[field.solrname] }}
          </v-list-tile-sub-title>
        </v-list-tile>

      </v-list>
    </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
// import ImageItem from '@/components/ImageItem'

export default {
  components: {
    // ImageItem
  },
  props: {
    entry: {
      type: Object,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    showMap: {
      type: Boolean,
      required: false,
      default: true
    }
    // collection: {
    //   type: String,
    //   required: true
    // },
    // spid: {
    //   type: String,
    //   required: true
    // }
  },
  data () {
    return {
      mapOptions: {
        mapTypeControl: false,
        zoomControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
      },
      zooms: [15, 10, 8],
      zoomi: 1,
      caro_i: 0
    }
  },
  computed: {
    xs () {
      return this.$vuetify.breakpoint.name=='xs'
    },
    geo_coords () {
      if (this.entry.l1) {
        return {lat: this.entry.l1, lng: this.entry.l11}
      }
      return false
    },
    showCoords () {
      return this.showMap && Boolean(this.geo_coords)
    },
    showCarousel () {
      return this.entry.img || this.showCoords
    },
    zoom () {
      return this.zooms[this.zoomi]
    },
    entryTitle () {
      return [this.entry.ge, this.entry.sp].map(a => a && a.trim()).filter(Boolean).join(' ')
    },
    relaventFields () {
      return this.visibleColumns.filter((f) => {
        return !['ge', 'sp', 'l1', 'l11'].includes(f.solrname)
      })
    },
    mapi () {
      if (this.entry.img) {
        return this.entry.img.length
      } else {
        return 0
      }
    },
    isMapPage () {
      return this.caro_i == this.mapi
    },
    ...mapGetters(['getSpecimenById', 'imageUrl', 'visibleColumns'])
  },
  methods: {
    toggleZoom () {
      this.zoomi += 1
      this.zoomi %= this.zooms.length
    },
    switchToLastPage () {
      if (this.showCoords) {
        this.caro_i = this.mapi
      } else {
        this.caro_i = this.entry.img.length - 1
      }
    },
    switchToMapOrDirections () {
      if (this.isMapPage) {
        this.mapsSelector()
      } else {
        this.switchToLastPage()
      }
    },
    mapsSelector() {
      let q = "daddr=" + this.geo_coords.lat + "," + this.geo_coords.lng + "&amp;ll="
      // https://medium.com/@colinlord/opening-native-map-apps-from-the-mobile-browser-afd66fbbb8a4
      if /* if we're on iOS, open in Apple Maps */
        ((navigator.platform.indexOf("iPhone") != -1) ||
        (navigator.platform.indexOf("iPad") != -1) ||
        (navigator.platform.indexOf("iPod") != -1))
        window.open("maps://maps.google.com/maps?" + q);
      else /* else use Google */
        window.open("https://maps.google.com/maps?" + q);
    }
  }
}
</script>


<style>
.no-background .v-carousel__controls {
  background: rgba(0,0,0,0) !important;
}
.no-shadow {
  -webkit-box-shadow: none;
	-moz-box-shadow: none;
	box-shadow: none;
}
.denser  {
  height: 20px;
}
.geo-marker .v-carousel__controls button:last-child i {
  content: "place";
}
</style>
