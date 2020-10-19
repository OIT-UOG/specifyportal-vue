<template>
  <v-card dense>
    <v-toolbar
      flat
      dark
      color="primary"

    >
    <!-- class="headline text-uppercase" -->
      <v-toolbar-title
        class="subheading text-uppercase"
      >
        Select Table Columns
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-list
        dense
      >
        <v-list-tile
          v-for="header in headers"
          :key="header.value"
        >
          <v-checkbox
            :input-value="header.visible"
            :label="header.text"
            @change="toggleColumnVisibility(header)"
          >

          </v-checkbox>
        </v-list-tile>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'Results',
  data () {
    return {

    }
  },
  computed: {
    headers () {
      return this.allColumns.filter((h) => {
        return h.solrname !== "img";
      }).map((h) => {
        return {
          text: h.title,
          value: h.solrname,
          visible: h.visibleInResults
        }
      })
    },
    ...mapGetters(['allColumns'])
  },
  methods: {
    toggleColumnVisibility(header) {
      this.setVisible({
        solrname: header.value,
        visibleInResults: !header.visible
      })
    },
    ...mapMutations({setVisible: 'setFieldResultVisibility'})
  }
}
</script>
