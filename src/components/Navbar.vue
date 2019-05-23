<template>
  <nav>
    <v-toolbar flat dark app color="primary" clippedLeft>
      <v-toolbar-side-icon @click="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="text-uppercase">
        <span>GEC </span>
        <span class="font-weight-light">Biorepository</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn flat>home</v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <v-navigation-drawer v-model="drawer" app clipped>
      <SearchDrawer/>
    </v-navigation-drawer>
  </nav>
</template>

<script>
import SearchDrawer from '@/components/SearchDrawer'

export default {
  name: 'Navbar',
  components: {
    SearchDrawer
  },
  data () {
    return {
      drawer: true
    }
  }
}
</script>
