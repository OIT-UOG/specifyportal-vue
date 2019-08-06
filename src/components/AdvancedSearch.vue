<template>
	<v-expansion-panel
		expand
	>

		<v-expansion-panel-content
			v-for="f in filters"
			v-if="f.visible"
			:key="f.colkey"
			class="smaller-panel"
		>
			<template v-slot:header class="pa-0">
				<v-layout row wrap>
					<v-flex xs12>
						<div class="caption font-weight-bold">{{ f.title }}</div>
					</v-flex>
					<v-flex xs12 v-if="f.search && !f.hide_checkboxes">
						<v-checkbox 
							class="small-checkbox my-1 caption"
							hide-details
							:label="f.search + (f.to ? (' to ' + f.to) : '')" 
							:input-value="true"
							@change="removeTerm(f.colkey)"
						></v-checkbox>
					</v-flex>
				</v-layout>
			</template>
			
			<v-container px-3 py-0 ma-0>
				<v-layout row pa-0 ma-0>
					<v-flex xs12 pa-0 ma-0>
						<component
							:is="f.component"
							v-bind="f"
						></component>
					</v-flex>
				</v-layout>
			</v-container>

		</v-expansion-panel-content>
	</v-expansion-panel>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import CollectionFilter from '@/components/CollectionFilter'
import StringFilter from '@/components/StringFilter'
import RangeFilter from '@/components/RangeFilter'


export default {
	components: {
		CollectionFilter,
		StringFilter
	},
	data () {
    return {
		customFilters: {
			coll: {
				visible: true,
				component: CollectionFilter,
				hide_checkboxes: true
			}
		},
		defaultFilter: {
			visible: true,
			component: StringFilter
		},
		rangeFilter: {
			visible: true,
			component: RangeFilter,
			min: 0,
			max: 100,
			default: 50,
			between: false
		}
    }
  },
  computed: {
    filters () {
      return this.advancedSearchColumns.map((h) => {
        
		let custom = this.defaultFilter
		if (h.solrname in this.customFilters) {
			custom = this.customFilters[h.solrname]
		} else if ((h.solrtype === 'int' && !h.type.endsWith('String')) || h.solrtype === 'tdouble') {
			custom = {...this.rangeFilter}
			if (h.type.endsWith('Calendar')) {
				custom.max = new Date().getFullYear()
				custom.min = 1000
				custom.default = custom.max
				custom.breakpoints = {[custom.min + 80]:1800}
			} else if (h.title && h.title.startsWith("latitude")) {
				custom.max = 90
				custom.between = true
				custom.default = [40,50]

			} else if (h.title && h.title.startsWith("longitude")) {
				custom.max = 180
				custom.between = true
				custom.default = [70,110]
			}
		}
		let { search, to } = this.query.getTerm(h.solrname)

        return {
          title: h.title,
          colkey: h.solrname,
					search,
					to,
					...custom
        }
      })
    },
		...mapState(['query']),
    ...mapGetters(['advancedSearchColumns'])
  },
	methods: {
		removeTerm(field) {
			this.removeSearchTerm(field)
			this.runNewQuery()
		},
		...mapActions(['removeSearchTerm', 'runNewQuery'])
	}
}
</script>

<style>
.smaller-panel>div:first-child {
	padding-top: 8px;
	padding-bottom: 8px;
	min-height: 0px;
}
.small-checkbox .v-icon {
	font-size: 18px;
}
.small-checkbox .v-label {
	font-size: 14px;
}
.small-checkbox .v-input--selection-controls__input {
	margin-right: 4px;
}
</style>
