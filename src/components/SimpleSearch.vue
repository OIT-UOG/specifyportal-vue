<template>
  <v-text-field
    v-model="searchQuery"
    :hint="hint"
    label="Search all fields"
    solo
    @keydown.enter="search_and_close"
    flat>
    <template v-slot:append>
      <v-fade-transition leave-absolute>
        <v-progress-circular
          v-if="searching"
          color="info"
          size="24"
          width="3"
          indeterminate
        ></v-progress-circular>
          <!-- v-on="on" -->
        <v-icon v-else @click="search">search</v-icon>
      </v-fade-transition>

    </template>
  </v-text-field>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'SimpleSearch',
  data () {
    return {
      searching: false,
      hint: '',
      hinting: false,
      hints: [
        'try using wildcards *',
        // 'specify fields with field:search', // need to translate field from title to solrname first
      ],

      searchQuery: '',
      isTyping: false,
      isLoading: false,
      fromRoute: false,
    }
  },
  computed: {
    searchIndicator () {
      if (this.isLoading) {
        return 'loading'
      } else if (this.isTyping) {
        return 'search'
      }
      return 'search'
    },
    routeQuery() {
      const q = this.$route.query;
      if (q.q) {
        return JSON.parse(q.q)[1];
      }
      return null;
    },
    ...mapState(['loaded'])
    // ...mapGetters(['moreToQuery'])
  },
  watch: {
    async searchQuery () {
      this.isTyping = true;
      if (this.fromRoute) {
        this.fromRoute = false;
        return;
      }
      await this.search()
    },
    routeQuery() {
      if (this.routeQuery === null) {
        return;
      }
      if (!this.$route.params.silent) {
        this.fromRoute = true;
        this.searchQuery = this.routeQuery;
      }
    },
  },
  methods: {
    async search_and_close() {
      if (this.$vuetify.breakpoint.name=='xs') {
        this.setDrawer(false)
        await this.search()
      }
    },
    async search () {
      this.searching = true
      let query = this.searchQuery
      if (!query.endsWith('*')) {
        query += '*'
      }
      await this.doSearch(query)
      this.searching = false
    },
    doSearch: _.debounce(async function(search) {
      this.isLoading = true
      let query = search || this.searchQuery
      await this.setSearchTerms([query])
      this.isTyping = false
      this.isLoading = false
    }, 100),
    ...mapActions(['setSearchTerms', 'setDrawer'])
  },
  async mounted () {
    this.fromRoute = true;
    this.searchQuery = this.routeQuery;

    this.hint_index = this.hints.length - 1
    setInterval(() => {
      if (this.hinting) {
        this.hint = ""
        this.hinting = false
      } else {
        this.hint_index = (this.hint_index + 1) % this.hints.length
        this.hint = `hint: ${ this.hints[this.hint_index] }`
        this.hinting = true
      }
    }, 10000);
  },

}
</script>
