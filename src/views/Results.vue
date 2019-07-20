<template>
  <v-data-table
    :items="pageEntries"
    :rows-per-page-items="rowsPerPage"
    :total-items="numFound"
    :loading="loading"
    :pagination.sync="pagination"
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
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'Results',
  data () {
    return {
      rowsPerPage: [20,50,100],
      pagination: {}
    }
  },
  asyncComputed: {
    pageEntries: {
      async get() {
        const { sortBy, descending, page, rowsPerPage } = this.pagination

        const cutIndex = page * rowsPerPage

        if (cutIndex > this.entries.length) {
          // only need to do this once since values bubble in each get() of this value
          await this.more()
        }

        return this.entries.slice((page - 1) * rowsPerPage, cutIndex)
      },
      default: []
    }
  },
  computed: {
    headers () {
      return this.visibleCols.map((h) => {
        return {
          text: h.title,
          value: h.solrname
        }
      })
    },
    ...mapGetters(['numFound', 'colAttrs', 'visibleCols',
    // 'moreToQuery'
    ]),
    ...mapState({entries: 'viewEntries', loading: 'queryLoading'})
  },
  methods: {
    ...mapActions(['more'])
  },
}
</script>

<style>
  tr:nth-of-type(even) {
    background-color: #e8edf1;
  }
</style>

