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
				@input="submit"
				style="margin-top: 4px"
			></v-range-slider>
				<!-- thumb-label="always"
				:thumb-size="ts" -->
			<v-slider
				v-else
				v-model="stuff"
				class="align-center point-slider"
				:min="min"
				:max="max"
				@input="submit"
				track-color="failure"
				thumb-label="always"
				:thumb-size="ts"
			></v-slider>
		</v-flex>
		<v-flex xs6>
			<!-- <v-switch class="xs6" 
				label="between" 
				v-model="m_between"
				hide-details
			></v-switch> -->
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
				@click="submit"
			>add</v-btn>
		</v-flex>
	</v-layout>
</v-container>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
	props: {
		title: String,
		colkey: String,
		min: Number,
		max: Number,
		between: Boolean,
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
			ts: 30
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
	...mapState(['collections'])
  },
	methods: {
		submit() {
			let search = this.stuff
			let to = undefined
			if (this.m_between) {
				[ search, to ] = this.between_vals
			}
			this.addSearchTerm({ field: this.colkey, search, to })
			this.runNewQuery()
		},
		...mapActions(['addSearchTerm', 'runNewQuery'])
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
	}
}
</script>

<style>
.point-slider .v-slider__track-fill {
	height: 0px;
}
</style>