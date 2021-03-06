import Vue from 'vue';
import './plugins/vuetify';
import * as VueGoogleMaps from 'vue2-google-maps';
import InfiniteScroll from 'v-infinite-scroll';
import 'v-infinite-scroll/dist/v-infinite-scroll.css';
import AsyncComputed from 'vue-async-computed';
import App from './App.vue';
import router from './router';
import store from './store';

import LazyLoadDirective from './directives/LazyLoadDirective';

Vue.config.productionTip = false;

Vue.directive('lazyload', LazyLoadDirective);

Vue.use(InfiniteScroll);

Vue.use(AsyncComputed);

Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.MAPS_API_KEY,
    libraries: 'places',
  },
});

let { API_URL } = process.env;

if (!API_URL.startsWith('http')) {
  const s = process.env.NODE_ENV === 'development' ? '' : 's';
  API_URL = `http${s}://${API_URL}`;
}

store.API_URL = API_URL;

new Vue({
  router,
  store,
  render: h => h(App),
  async created() {
    await this.$store.dispatch('loadSettings', { apiUrl: API_URL });
  },
}).$mount('#app');
