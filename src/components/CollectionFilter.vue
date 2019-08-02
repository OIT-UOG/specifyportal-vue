<template>
	<v-container align-center text-xs-center pa-3>
		<v-layout row wrap justify-center align-center>	
			<v-flex xs12 pa-0 ma-0
				v-for="coll in collections"
			>
				<v-progress-linear
					v-model="collection_count[coll]"
					color="primary"
					height="25"
					reactive
				>
				</v-progress-linear>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import { mapMutations, mapGetters, mapState } from 'vuex'

export default {
	data () {
		return {

		}
	},
	computed: {
		collection_count() {
			let i = 10
			return this.collections.reduce((acc, coll) => {
				console.log('entries', this.entries)
				acc[coll] = i
				i += 10
				return acc
			}, {})
		},
		...mapGetters(['entries']),
		...mapState(['collections'])
	}
}
</script>