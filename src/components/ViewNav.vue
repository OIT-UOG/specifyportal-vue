<template>
  <nav>
    <v-tabs>
      <v-tab
        v-for="route in routes"
        :to="{
          name: route.name,
          params: { silent: true },
          query
        }"
      >
        {{ route.name }}
      </v-tab>
      <v-spacer></v-spacer>
      <downloader>
        <template v-slot:activator="{ on }">
          <v-btn icon flat
            v-on="on"
          >
            <v-icon class="light-icon" v-on="on">save_alt</v-icon>
          </v-btn>
        </template>
      </downloader>
      <v-btn icon flat>
        <v-icon style="" class="light-icon" @click="copy">content_copy</v-icon>
      </v-btn>

      <v-snackbar
        v-model="notice"
        :timeout="timeout[good]"
        absolute
        top
      >
        {{ msg[good] }}

        <v-btn
          color="blue"
          flat
          @click="notice = false"
        >Close</v-btn>
      </v-snackbar>

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
      notice: false,
      good: 'good',
      msg: {
        good: 'Shareable url copied',
        bad: 'Warning: Sharable url may be too long for some browsers',
      },
      timeout: {
        good: 5000,
        bad: 10000,
      },
    }
  },
  computed: {
    query() {
      return this.$route.query;
    },
  },
  methods: {
    copy() {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      this.good = url.length > 2000 ? 'bad' : 'good';
      this.notice = true;
    },
  },
}
</script>

<style scoped>
.v-btn .v-icon.light-icon {
  color: rgba(0,0,0,0.6);
}
.v-btn .v-icon.light-icon:hover {
  color: rgba(0,0,0,0.84);
}
</style>
