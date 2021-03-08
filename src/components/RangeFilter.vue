<template>
<v-container align-center text-xs-center
	:class="m_between? 'pb-3 px-3 pt-2' : 'pa-3'"
>
	<v-layout row wrap justify-center align-center>
		<v-flex xs6 text-xs-left pa-0 ma-0
				v-if="m_between"
				subtitle-2
		>
			{{ between_vals[0] }}
		</v-flex>
		<v-flex xs6 text-xs-right pa-0 ma-0
				v-if="m_between"
				subtitle-2
		>
			{{ between_vals[1] }}
		</v-flex>
		<v-flex xs12>
			<v-range-slider
				v-if="m_between"
				v-model="stuffs"
				class="align-center"
				:min="min"
				:max="max"
				@input="submit(false)"
				style="margin-top: 4px"
        :color="isDuplicateAndNotLastItem ? 'grey' : null"
			></v-range-slider>
				<!-- thumb-label="always"
				:thumb-size="ts" -->
			<v-slider
				v-else
				v-model="stuff"
				class="align-center point-slider"
				:min="min"
				:max="max"
				@input="submit(false)"
				track-color="failure"
				thumb-label="always"
        :thumb-color="isDuplicateAndNotLastItem ? 'grey' : null"
				:thumb-size="ts"
			></v-slider>
		</v-flex>
		<v-flex xs6>
			<v-btn class="xs6" color="primary"
				small
				:depressed="m_between"
				:outline="m_between"
				@click="m_between = !m_between"
			>between</v-btn>
		</v-flex>
		<v-flex xs6>
			<v-btn class="xs6" color="primary"
				small
				outline
        :disabled="isDuplicateAndNotLastItem"
				@click="submit(true)"
			>add</v-btn>
		</v-flex>
	</v-layout>
</v-container>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import _ from 'lodash'

export default {
	props: {
		title: String,
		colkey: String,
		min: Number,
		max: Number,
    between: Boolean,
    isOpen: {
      type: Boolean,
      required: false,
      default: false,
    },
    prop_factory: {
      type: Function,
      required: false,
      default: (self) => {}
    },
		default: [Number, Array],
		breakpoints: {
			type: Object,
			required: false,
			default: function() {return {}}
		}
	},
	data () {
		return {
			stuff: 0,
			stuffs: [0,100],
			m_between: false,
      ts: 30,
      isNew: true,
		}
  },
  computed: {
	between_vals() {
		let bps = Object.keys(this.breakpoints).map(Number).sort().reduce((acc, curr) => {
			acc.push([curr, this.breakpoints[curr]])
			return acc
		},[])
		bps = [[this.min, this.min], ...bps, [this.max, this.max]]
		return this.stuffs.map((pin) => {
			let prevbp = false
			let nextbp = false

			for (let bp of bps) {
				if (bp[0] <= pin) {
					prevbp = bp
				}
				if (bp[0] >= pin) {
					nextbp = bp
					break
				}
			}

			if (pin == prevbp[0]) {
				return prevbp[1]
			}
			if (pin == nextbp[0]) {
				return nextbp[1]
			}
			// [0, 60, 70, 100]
			//       62
			// [0, 100,200,1000]
			let off = (pin - prevbp[0])
			let orange = nextbp[0] - prevbp[0]
			let delta = off/orange
			let nrange = nextbp[1] - prevbp[1]
			let noff = delta * nrange
			return Math.round(noff + prevbp[1])
		})
  },
  isDuplicate() {
    let item = this.stuff;
    if (this.m_between) {
      item = this.stuffs;
    }
    return this._inFieldList({ field: this.colkey, item });
  },
  isDuplicateAndNotLastItem() {
    return this.isDuplicate && !this.sameAsLastItem
  },
  sameAsLastItem() {
    let list = this.getQueryTerm(this.colkey).list;
    if (list.length === 0) {
      return false;
    }
    let lastItem = list[list.length-1];
    if (this.m_between) {
      return JSON.stringify(lastItem).toLowerCase() === JSON.stringify(this.item).toLowerCase()
    }
    return lastItem === this.item
  },
  item() {
    if (this.m_between) {
      return [...this.stuffs]
    }
    return this.stuff;
  },
	...mapGetters(['collections', 'getQueryTerm', '_inFieldList'])
  },
	methods: {
		submit: _.debounce(async function(add) {
      if (!this.isOpen) {
        return;
      }
      if (add) {
        this.isNew = true
      }

			let newTerm = this.item

      let qt = this.getQueryTerm(this.colkey);
      let list = qt.list;
      let lastItem = list.length > 0 ? list[list.length-1] : null;
      if (Array.isArray(newTerm)) {
        if (JSON.stringify(lastItem).toLowerCase() === JSON.stringify(newTerm).toLowerCase()) {
          return
        }
      } else {
        if (newTerm === lastItem) {
          return
        }
      }
      if (this.isDuplicate) {
        if (add) this.isNew = false
        return
      }
      if (list.length > 0) {
        if (this.isNew) {
          list.push(newTerm)
        } else {
          list[list.length-1] = newTerm;
        }
      } else {
        list = [newTerm];
      }

      if (add && !this.isNew) {
        list.push(newTerm);
        this.isNew = true;
      } else {
        this.isNew = false;
      }

			this.setQueryField({ field: this.colkey, and: qt.and, list })
    }, 150),
		...mapActions(['setQueryField'])
  },
	created () {
		this.m_between = this.between
		if (this.between) {
			this.stuffs = this.default
			this.stuff = this.default[0]
		} else {
			this.stuff = this.default
			this.stuffs = [this.min, this.stuff]
    }
    this.prop_factory(this)
	}
}
</script>

<style>
.point-slider .v-slider__track-fill {
	height: 0px;
}
</style>
