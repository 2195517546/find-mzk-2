import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/Index.vue')
    },
    {
      path: '/eliminate-mzk',
      name: 'eliminate-mzk',
      component: () => import('@/pages/MiniGame.vue')
    },
    {
      path: '/mzk-test',
      name: 'mzk-test',
      component: () => import('@/pages/MzkTest.vue')
    },
    {
      path: '/minesweeper',
      name: 'minesweeper',
      component: () => import('@/pages/MineSweeper.vue')
    },
    {
      path: '/level/:id',
      name: 'level',
      component: () => import('@/pages/levels/LevelWrapper.vue'),
      props: route => ({ levelId: Number(route.params.id) })
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
