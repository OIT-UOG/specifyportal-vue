<template>
  <div>
    <v-toolbar flat dark color="primary darken-1">
      <v-list>
        <v-list-tile>
          <v-list-tile-title class="title text-lg-center">
            Search
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-toolbar>

    <v-divider></v-divider>
    <v-text-field
      :hint="hint"
      label="Search all fields"
      solo
      flat>
      <template v-slot:append>
        <v-fade-transition leave-absolute>
          <v-progress-circular
            v-if="searching"
            color="info"
            size="24"
            width="3"
            indeterminate
          ></v-progress-circular>
          <v-icon v-else v-on="on" @click="search">search</v-icon>
        </v-fade-transition>

      </template>
    </v-text-field>
    <v-divider></v-divider>

    <v-list>
      <v-list-tile v-for="i in [1,2,3]">
        <v-list-tile-content>
          <v-list-tile-title>filter {{ i }}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script>
export default {
  data () {
    return {
      searching: false,
      hint: "",
      hinting: false,
      hints: [
        "try using wildcards *",
        "specify fields with field:search",
      ]
    }
  },
  methods: {
    search () {
      this.searching = true
      setTimeout(() => {
        this.searching = false
      }, 1000);
    }
  },
  created () {
    this.hint_index = this.hints.length - 1
    setInterval(() => {
      if (this.hinting) {
        this.hint = ""
        this.hinting = false
      } else {
        this.hint_index = (this.hint_index + 1) % this.hints.length
        this.hint = `hint: ${ this.hints[this.hint_index] }`
        this.hinting = true
      }
    }, 10000);
  }
}
</script>
