<template>
  <v-data-table
    :headers="headers"
    :items="entries"
    :rows-per-page-items="rowsPerPage"
  >
    <!-- hide-actions -->
    <template v-slot:items="props">
      <td
        v-for="f of visibleCols"
        :key=f.solrname
        class="text-xs-right"
      >{{ props.item[f.solrname] }}</td>
    </template>
  </v-data-table>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Results',
  data () {
    return {
      rowsPerPage: [20,50,100]
    }
  },
  computed: {
    headers () {
      return this.visibleCols.map((h) => {
        return {
          text: h.colname,
          value: h.solrname
        }
      })
    },
    ...mapGetters(['numFound', 'colAttrs', 'visibleCols',
    // 'moreToQuery'
    ]),
    ...mapState({entries: 'viewEntries'})
  }
}
</script>

<style>
  tr:nth-of-type(even) {
    background-color: #e8edf1;
  }
</style>

