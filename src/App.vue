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
import { mapActions, mapState } from 'vuex';

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
  },
  watch: {
    routerParams() {
      this.$router.push({
        name: this.$route.name,
        params: { silent: true },
        query: this.routerParams,
      });
    },
    loaded() {
      if (this.paramLoad !== null) {
        this.loadFromParams();
      }
    },
  },
  computed: {
    ...mapState(['routerParams', 'loaded', 'paramLoad']),
  },
  methods: {
    ...mapActions(['loadFromParams']),
  },
}
</script>
