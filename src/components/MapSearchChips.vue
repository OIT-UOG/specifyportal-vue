<template>
  <div>
    <v-chip
      v-for="poly in filterPolyList"
      :key="poly.id"
      close
      :outline="!poly.selected"
      close-icon="mdi-close-outline"
      :color="poly.color"
      label
      small
      :class="[filterPolyIsHighlighted(poly) ? 'chip-active' : '', 'poly-chip']"
      flat
      @input="handleClose(poly)"
      @click="handleSelect($event, poly)"
    ></v-chip>
    <v-chip
      v-if="isOpen && this.bounds !== null"
      close-icon="mdi-close-outline"
      outline
      label
      small
      flat
      @click="handleNew($event)"
    >
      <v-icon>crop</v-icon>+
    </v-chip>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { gmapApi } from 'vue2-google-maps';

export default {
  props: {
    isOpen: Boolean,
  },
  data() {
    return {

    }
  },
  computed: {
    ...mapGetters(['filterPolyList', 'filterPolyIsHighlighted']),
    ...mapState({
      center: 'mapCenter',
      bounds: 'mapBounds',
    })
  },
  methods: {
    handleClose(poly) {
      // this should be handled in the store
      if (this.filterPolyIsHighlighted(poly)) {
        this.setFilterPolyHighlighted(null)
      }
      this.deleteFilterPoly(poly)
      if (this.filterPolyList.length < 1) {
        this.$emit('input', false);
      }
    },
    handleSelect(event, poly) {
      event.stopPropagation();
      this.setFilterPolyHighlighted(poly)
      this.setFilterPolySelected({ poly, selected: !poly.selected });
    },
    handleNew(event) {
      event.stopPropagation();
      this.createFilterPoly({ tl: this.center, centered: true })
      this.$router.push('/map');
    },
    ...mapActions([
        'setGoogle',
        'setMapBounds',
        'createFilterPoly',
        'deleteFilterPoly',
        'setFilterPolySelected',
        'setFilterPolyHighlighted',
    ])
  }
}
</script>

<style scoped>
.poly-chip.v-chip--outline {
  border: 2px dashed currentColor;
}
.chip-active {
  -webkit-box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12);
  box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12);
}
.v-chip.chip-active:not(.v-chip--disabled):after, .v-chip--active:after, .v-chip--selected:after {
  background: currentColor;
  border-radius: inherit;
  content: '';
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  -webkit-transition: inherit;
  transition: inherit;
  width: 100%;
  pointer-events: none;
  opacity: 0.13;
}
</style>
