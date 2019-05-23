import Vue from 'vue';
import './plugins/vuetify'
import App from './App.vue';
import router from './router';
import store from './store';

import LazyLoadDirective from './directives/LazyLoadDirective';

Vue.config.productionTip = false;

Vue.directive('lazyload', LazyLoadDirective);

new Vue({
  router,
  store,
  render: h => h(App),
  async created() {
    await this.$store.dispatch('loadSettings');
  },
}).$mount('#app');
