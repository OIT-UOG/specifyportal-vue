import Vue from 'vue';
import './plugins/vuetify';
import * as VueGoogleMaps from 'vue2-google-maps';
import App from './App.vue';
import router from './router';
import store from './store';

import LazyLoadDirective from './directives/LazyLoadDirective';

Vue.config.productionTip = false;

Vue.directive('lazyload', LazyLoadDirective);

Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.MAPS_API_KEY,
    libraries: 'places',
  },
});

new Vue({
  router,
  store,
  render: h => h(App),
  async created() {
    await this.$store.dispatch('loadSettings');
  },
}).$mount('#app');
