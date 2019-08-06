<template>
  <!-- <template> -->
    <v-dialog
      v-if="xs"
      v-model="menu"
      scrollable 
      :max-width="width"
      :width="width"
      transition="dialog-transition"
      style="display: block"
    >
      <template v-slot:activator="{ on }">
        <slot :on="on"></slot>
      </template>
      
      <v-slide-x-transition>
      <v-btn v-show="showBtn" absolute fab right flat small :ripple="false"
        @click="menu = false"
        class="off-right"
      >
        <v-icon color="white" class="sharp-shadow">close</v-icon>
      </v-btn>
      </v-slide-x-transition>
      <EntryViewCard
        :entry="entry"
        :width="width"
      >
      </EntryViewCard>
    </v-dialog>
    <v-menu
      v-else
      v-model="menu"
      :close-on-content-click="xs"
      :nudge-width="200"
      offset-x
      absolute
      :max-width="width"
    >
      <template v-slot:activator="{ on }">
        <slot :on="on"></slot>
      </template>

      <v-btn absolute fab right flat small :ripple="false"
        @click="menu = false"
        class="all-the-way-right"
      >
        <v-icon color="white" class="sharp-shadow">close</v-icon>
      </v-btn>
      <EntryViewCard
        :entry="entry"
        :width="width"
      >
      </EntryViewCard>
    </v-menu>
  <!-- </template> -->
  
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
// import ImageItem from '@/components/ImageItem'
import EntryViewCard from '@/components/EntryViewCard'

export default {
  components: {
    // ImageItem,
    EntryViewCard
  },
  props: {
    entry: {
      type: Object,
      required: true
    }
    // collection: {
    //   type: String,
    //   required: true
    // },
    // spid: {
    //   type: String,
    //   required: true
    // }
  },
  data () {
    return {
      menu: false,
      width: 400,
      open: true,
      showBtn: false
    }
  },
  computed: {
    xs () {
      console.log(this.entry)
      return this.$vuetify.breakpoint.name=='xs'
    },
    ...mapGetters(['getSpecimenById', 'imageUrl']) 
  },
  watch: {
    menu () {
      this.setCardOpen(this.menu)
      if (this.menu) {
        setTimeout(() => {
          console.log('ok', this.showBtn)
          this.showBtn = true
        }, 300);
      } else {
        this.showBtn = false
      }
    }
  },
  methods: {
    ...mapActions(['setCardOpen'])
  }
}
</script>

<style>
.no-background .v-carousel__controls {
  background: rgba(0,0,0,0) !important;
}
.off-right {
  right: 24px;
}
.all-the-way-right {
  right: 0px;
}
.sharp-shadow {
  text-shadow: 0px 1px 1px #000000;
}
</style>
