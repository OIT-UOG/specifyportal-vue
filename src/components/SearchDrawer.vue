<template>
  <div>
    <v-toolbar flat dark color="primary darken-1">
      <v-list>
        <v-list-tile>
          <v-list-tile-title class="title text-lg-center">
            Search
          </v-list-tile-title>
          <FeedbackForm v-if="xs" v-slot="{ on }">
            <v-btn icon v-on="on">
              <v-icon>feedback</v-icon>
            </v-btn>
          </FeedbackForm>
        </v-list-tile>
      </v-list>
    </v-toolbar>

    <v-divider></v-divider>
      <SimpleSearch/>
    <v-divider></v-divider>


    <AdvancedSearch/>
    <!-- <v-list>
      <v-list-tile v-for="i in filters" :key="i">
        <v-list-tile-content>
          <v-list-tile-title>{{ i }}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list> -->
  </div>
</template>

<script>
import SimpleSearch from '@/components/SimpleSearch'
import AdvancedSearch from '@/components/AdvancedSearch'
import FeedbackForm from '@/components/FeedbackForm'


export default {
  name: 'SearchDrawer',
  components: {
    SimpleSearch,
    AdvancedSearch,
    FeedbackForm
  },
  data () {
    return {

    }
  },
  computed: {
    xs () {
      return this.$vuetify.breakpoint.name=='xs'
    },
  }
}
</script>
