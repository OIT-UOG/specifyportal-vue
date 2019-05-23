<template>
  <v-app>
    <Navbar/>
    <SearchDrawer/>
    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
// import ImageGallery from './components/ImageGallery'
// import ResultTable from './components/ResultTable'
import Navbar from '@/components/Navbar'

export default {
  name: 'App',
  components: {
    Navbar
  },
  data () {
    return {
      //
    }
  }
}
</script>
