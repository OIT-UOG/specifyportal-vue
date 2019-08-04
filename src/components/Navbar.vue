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
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Navbar',
  components: {
    SearchDrawer
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
    ...mapState(['drawer'])
  },
  methods: {
    ...mapActions(['setDrawer'])
  }
}
</script>
