<template>
  <v-data-table
    :headers="visHeaders"
    :items="pageEntries"
    :rows-per-page-items="rowsPerPage"
    :total-items="total"
    :loading="loading"
    :pagination.sync="pagination"
  >
    <template v-slot:headers="props">
      <tr>
        <th class="tiny-column">
          <v-dialog
            scrollable
            width="350px"
          >
            <template v-slot:activator="{ on }">
              <!-- <v-btn
                icon
                v-on="on"
              > -->
                <v-icon
                  size="1.8em"
                  v-on="on"
                >more_vert</v-icon>
              <!-- </v-btn> -->
            </template>

            <ResultColumnVisibility/>
          </v-dialog>
        </th>
        <th
          v-for="header in props.headers"
          :key="header.text"
          :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '']"
          @click="changeSort(header.value)"
        >
          <v-icon small>arrow_downward</v-icon>
          {{ header.text }}
        </th>
      </tr>
    </template>
    <template v-slot:items="props">
      <EntryViewTooltip
        v-slot="{ on }"
        :entry="props.item">
          <!-- v-on:dblclick="on.click" -->
        <tr
          v-on="xs ? on : ( cardOpen ? {click: ()=>{}} : on)"
        >
        <!-- {click: ()=>{}} -->
          <td class="tiny-column"></td>
          <td
            v-for="f of visibleColumns"
            :key=f.solrname
            class="text-xs-right"
          >
          <span>
            {{ props.item[f.solrname] }}
          </span>
          </td>
        </tr>
      </EntryViewTooltip>
    </template>
  </v-data-table>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import ResultColumnVisibility from '@/components/ResultColumnVisibility'
import EntryViewTooltip from '@/components/EntryViewTooltip'

export default {
  name: 'Results',
  components: {
    ResultColumnVisibility,
    EntryViewTooltip
  },
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
    visHeaders () {
      return this.visibleColumns.map((h) => {
        return {
          text: h.title,
          value: h.solrname
        }
      })
    },
    xs () {
      return this.$vuetify.breakpoint.name=='xs'
    },
    ...mapGetters(['visibleColumns',]),
    ...mapState({entries: 'entries', loading: 'queryLoading', cardOpen: 'cardOpen', total: 'total'})
  },
  methods: {
    async changeSort (column) {
      if (this.pagination.sortBy === column) {
        if (this.pagination.descending) {
          this.pagination.sortBy = null
          return this.unsort()
        }
        else {
          this.pagination.descending = true
        }
      } else {
        this.pagination.sortBy = column
        this.pagination.descending = false
      }

      this.sort({
        field: this.pagination.sortBy,
        asc: this.pagination.descending
      })
    },
    ...mapActions(['more', 'sort', 'unsort'])
  }
}
</script>

<style>
  tr:nth-of-type(even) {
    background-color: #e8edf1;
  }
  .tiny-column {
    max-width: 1em;
    padding-left: 10px !important;
    padding-right: 0px !important;
  }
</style>

