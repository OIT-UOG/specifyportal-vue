<template>
	<div>
		<v-text-field
      ref="field"
			label=" Search"
			v-model="stuff"
			@keydown.enter="submit"
			single-line
			hide-details
			full-width
		></v-text-field>
	</div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
	props: {
		title: String,
    colkey: String,
    isOpen: Boolean,
	},
	data () {
		return {
      stuff: "",
		}
    },
  computed: {
    ...mapGetters(['getQueryTerm']),
  },
  watch: {
    isOpen() {
      if (this.isOpen) {
        this.$refs.field.focus();
      }
    },
  },
	methods: {
		submit(e) {
      if (!this.stuff) {
        return;
      }
      let qt = this.getQueryTerm(this.colkey);
      qt.list.push(this.stuff)
      this.setQueryField({ field: this.colkey, and: qt.and, list: qt.list })
			this.stuff = ""
		},
		...mapActions(['setQueryField'])
  },
}
</script>
