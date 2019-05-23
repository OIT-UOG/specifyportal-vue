<template>
  <nav>
    <v-tabs>
      <v-tab v-for="route in routes" :to="route.path">
        {{ route.name }}
      </v-tab>
    </v-tabs>
  </nav>
</template>

<script>
export default {
  data () {
    return {
      routes: this.$router.options.routes
    }
  }
}
</script>
