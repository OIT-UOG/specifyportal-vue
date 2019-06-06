<template>
  <v-app>
    <Navbar/>
    <v-content>
      <ViewNav/>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
// import ImageGallery from './components/ImageGallery'
// import ResultTable from './components/ResultTable'
import Navbar from '@/components/Navbar'
import ViewNav from '@/components/ViewNav'

export default {
  name: 'App',
  components: {
    Navbar,
    ViewNav
  },
  data () {
    return {
      //
    }
  }
}
</script>
