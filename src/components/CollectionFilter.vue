<template>
	<v-container align-center text-xs-center pa-3>
		<v-layout row wrap justify-center align-center>	
			<v-flex xs12 pa-0 ma-0
				v-for="coll in collections"
			>
				<v-checkbox 
					:label="coll.endsWith('vouchers')? (coll.slice(0, coll.length-'vouchers'.length)) : coll " 
					class="my-1 caption"
					hide-details
					disabled
					:input-value="visibleCollections[coll]"
					@change="setVisibleCollection({ collection: coll, visible: !visibleCollections[coll]})"
				></v-checkbox>
				<!-- <v-progress-linear
					v-model="collection_count[coll]"
					color="primary"
					height="25"
					reactive
				> -->
				<template v-slot="{ value }">
					<strong>{{ coll }}</strong>
				</template>
				</v-progress-linear>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

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
		...mapState(['collections', 'visibleCollections'])
	},
	methods: {
		...mapActions(['setVisibleCollection'])
	}
}
</script>