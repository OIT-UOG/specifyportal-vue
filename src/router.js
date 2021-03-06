import Vue from 'vue';
import Router from 'vue-router';
import Results from './views/Results.vue';
import store from './store';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'table',
      component: Results,
    },
    {
      path: '/gallery',
      name: 'gallery',
      // route level code-splitting
      // this generates a separate chunk (gallery.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "gallery" */ './views/Gallery.vue'),
    },
    {
      path: '/map',
      name: 'map',
      component: () => import(/* webpackChunkName: "map" */ './views/Map.vue'),
    }
  ],
});

router.afterEach((to, from) => {
  if (!_.isEmpty(to.query)) {
    if ('silent' in to.params) {
      return;
    }
    store.dispatch('queueParamLoad', to.query);
  }
});

export default router;
