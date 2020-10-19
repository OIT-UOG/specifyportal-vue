<template>
	<v-container align-center text-xs-center px-3 pb-3 pt-0>
		<v-layout row wrap justify-center align-center>
			<v-flex xs12 pa-0 ma-0
				v-for="coll in collections"
			>
				<v-checkbox
					:label="coll"
					class="my-1 caption"
					hide-details
					:input-value="visibleCollections[coll]"
					@change="setCollFilter(coll, !visibleCollections[coll])"
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
      and: false,
		}
	},
	computed: {
		collection_count() {
			let i = 10
			return this.collections.reduce((acc, coll) => {
				acc[coll] = i
				i += 10
				return acc
			}, {})
    },
    visibleCollections() {
      let vColls = this.collections.reduce((acc, coll) => {
        acc[coll] = false;
        return acc;
      }, {});
      this.getQueryTerm('coll').list.forEach((coll) => {
        vColls[coll] = true;
      });
      return vColls;
    },
		...mapGetters(['collections', 'getQueryTerm']),
	},
	methods: {
    ...mapActions(['setQueryField']),
    setCollFilter(coll, selected) {
      let list = this.collections.filter((c) => {
        if (c === coll) {
          return selected;
        } else {
          return this.visibleCollections[c];
        }
      })
      this.setQueryField({ field: 'coll', and: this.and, list })
    },
	}
}
</script>
