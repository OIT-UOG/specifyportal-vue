<template>
  <div>
    <v-toolbar flat dark color="primary darken-1">
      <v-list>
        <v-list-tile>
          <v-list-tile-title class="title text-lg-center">
            Search
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-toolbar>

    <v-divider></v-divider>
      <SimpleSearch/>
    <v-divider></v-divider>

    <v-list>
    <AdvancedSearch/>
      <v-list-tile v-for="i in filters" :key="i">
        <v-list-tile-content>
          <v-list-tile-title>{{ i }}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script>
import SimpleSearch from '@/components/SimpleSearch'
import AdvancedSearch from '@/components/AdvancedSearch'

export default {
  name: 'SearchDrawer',
  components: {
    SimpleSearch,
    AdvancedSearch
  },
  data () {
    return {
      
    }
  }
}
</script>
