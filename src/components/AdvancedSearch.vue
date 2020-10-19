<template>
	<v-expansion-panel
		expand
	>

		<v-expansion-panel-content
			v-for="f in visibleFilters"
			:key="f.colkey"
			class="smaller-panel"
		>
			<template v-slot:header class="pa-0">
				<v-layout row wrap>
					<v-flex xs12>
						<div class="caption font-weight-bold">{{ f.title }}</div>
					</v-flex>
          <div v-if="!f.hide_checkboxes">
            <v-flex xs12 v-for="(li, i) in f.list" :key="`${li.from}|${li.to}`">
              <v-checkbox
                class="small-checkbox my-1 caption"
                hide-details
                :label="li.from + (li.to !== null ? (' to ' + li.to) : '')"
                :input-value="true"
                @click="handleChange($event, f, i)"
              ></v-checkbox>
            </v-flex>
          </div>
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
      },
      resolveFilters: {

      },
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
            // custom.max = new Date().getFullYear()
            // custom.min = 1000
            // custom.default = custom.max
            // custom.breakpoints = {[custom.min + 80]:1800}
            if (!this.resolveFilters[h.solrname]) {
              const today = new Date().getFullYear();
              this.$set(this.resolveFilters, h.solrname, {
                max: today,
                min: 1800,
                default: today,
              })
              let resolveFilters = this.resolveFilters
              let getEdgeValue = this.getEdgeValue
              custom.prop_factory = (self) => {
                getEdgeValue({ field: h.solrname, min: false }).then((val) => {
                  this.resolveFilters[h.solrname].max = val;
                  self.stuff = val;
                  self.stuffs[1] = val;
                })
                getEdgeValue({ field: h.solrname, min: true }).then((val) => {
                  this.resolveFilters[h.solrname].min = val;
                  self.stuffs[0] = val;
                })
              }

            }
            custom.max = this.resolveFilters[h.solrname].max
            custom.min = this.resolveFilters[h.solrname].min
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
        let { and, list } = this.getQueryTerm(h.solrname)


        return {
          title: h.title,
          colkey: h.solrname,
          and,
          list: list.map((li) => {
            if (Array.isArray(li)) {
              return { from: li[0], to: li[1] };
            }
            return { from: li, to: null };
          }),
          ...custom
        }
      })
    },
    visibleFilters () {
      return this.filters.filter(f => f.visible)
    },
    ...mapGetters(['advancedSearchColumns', 'getQueryTerm'])
  },
	methods: {
    handleChange(event, filter, i) {
      if (filter.list.length > 1) {
        event.stopPropagation();
      }
      this.removeTerm(filter.colkey, i);
    },
		removeTerm(field, i) {
      let qt = this.getQueryTerm(field);
      qt.list.splice(i, 1);
      this.setQueryField({ field, and: qt.and, list: qt.list });
		},
		...mapActions(['setQueryField', 'getEdgeValue'])
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
