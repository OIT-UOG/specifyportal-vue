<template>
	<div>
		<v-text-field
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
		colkey: String
	},
	data () {
		return {
			stuff: ""
		}
  	},
	methods: {
		submit(e) {
			this.addSearchTerm({ field: this.colkey, search: this.stuff })
			this.stuff = ""
			this.runNewQuery()
		},
		...mapActions(['addSearchTerm', 'runNewQuery'])
	}
}
</script>