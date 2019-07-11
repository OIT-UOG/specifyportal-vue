<template>
  <v-text-field
    v-model="searchQuery"
    :hint="hint"
    label="Search all fields"
    solo
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
import { mapGetters, mapActions } from 'vuex'
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
        'specify fields with field:search',
      ],

      searchQuery: '',
      isTyping: false,
      isLoading: false,
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
    // ...mapGetters(['moreToQuery'])
  },
  watch: {
    searchQuery () {
      this.isTyping = true
      let query = this.searchQuery || '*'
      this.doSearch(query)
    }
  },
  methods: {
    async search () {
      this.searching = true
      await this.doSearch()
      this.searching = false
    },
    doSearch: _.debounce(async function(search) {
      this.isLoading = true
      let query = search || this.searchQuery
      this.newSearchTerm(query)
      await this.runNewQuery()
      this.isTyping = false
      this.isLoading = false
    }, 100),
    ...mapActions(['newSearchTerm', 'runNewQuery'])
  },
  async mounted () {
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
    await this.doSearch('*')
  },

}
</script>
