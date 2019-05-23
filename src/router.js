import Vue from 'vue';
import Router from 'vue-router';
import Results from './views/Results.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'results',
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
