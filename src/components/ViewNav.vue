<template>
  <nav>
    <v-tabs>
      <v-tab v-for="route in routes" :to="route.path">
        {{ route.name }}
      </v-tab>
      <v-spacer></v-spacer>
      <Downloader/>
    </v-tabs>
  </nav>
</template>

<script>
import Downloader from '@/components/Downloader';

export default {
  components: {
    Downloader,
  },
  data () {
    return {
      routes: this.$router.options.routes,
    }
  },
}
</script>
