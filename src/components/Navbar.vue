<template>
  <nav>
    <v-toolbar flat dark app color="primary" clippedLeft>
      <v-toolbar-side-icon @click="draw = !draw"></v-toolbar-side-icon>
      <v-toolbar-title class="text-uppercase">
        <span>GEC </span>
        <span class="font-weight-light">Biorepository</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
      <FeedbackForm v-if="!xs" v-slot="{ on }">
        <v-btn flat v-on="on" style="height: 100%">
          <span>feedback</span>
        </v-btn>
      </FeedbackForm>
        <v-btn flat href="/">home</v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <v-navigation-drawer v-model="draw" app clipped>
      <SearchDrawer/>
    </v-navigation-drawer>
  </nav>
</template>

<script>
import SearchDrawer from '@/components/SearchDrawer'
import FeedbackForm from '@/components/FeedbackForm'

import { mapState, mapActions } from 'vuex'


export default {
  name: 'Navbar',
  components: {
    SearchDrawer,
    FeedbackForm
  },
  data () {
    return {
      
    }
  },
  computed: {
    draw: {
      set(val) {
        this.setDrawer(val)
      },
      get() {
        return this.drawer
      }
    },
    xs () {
      return this.$vuetify.breakpoint.name=='xs'
    },
    ...mapState(['drawer'])
  },
  methods: {
    ...mapActions(['setDrawer'])
  }
}
</script>
