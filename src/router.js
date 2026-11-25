import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'loading', component: () => import('./views/LoadingView.vue'), meta: { bare: true } },
  { path: '/accueil', name: 'home', component: () => import('./views/HomeView.vue'), meta: { title: 'Accueil' } },
  { path: '/jeu/:id', name: 'game', component: () => import('./views/GameView.vue'), meta: { title: 'Jeu' } },
  { path: '/genre/:label', name: 'genre', component: () => import('./views/GenreView.vue'), meta: { title: 'Genre' } },
  { path: '/magasin', name: 'store', component: () => import('./views/StoreView.vue'), meta: { title: 'Magasin' } },
  { path: '/catalogue', name: 'catalog', component: () => import('./views/CatalogView.vue'), meta: { title: 'Catalogue' } },
  { path: '/bibliotheque', name: 'library', component: () => import('./views/LibraryView.vue'), meta: { title: 'Bibliothèque' } },
  { path: '/telechargements', name: 'downloads', component: () => import('./views/DownloadsView.vue'), meta: { title: 'Téléchargements' } },
  { path: '/telecharger', name: 'download', component: () => import('./views/DownloadView.vue'), meta: { title: 'Télécharger' } },
  { path: '/parametres', name: 'settings', component: () => import('./views/SettingsView.vue'), meta: { title: 'Paramètres' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.afterEach((to) => {
  document.title = to.meta.title ? `G.A — ${to.meta.title}` : 'G.A — Launcher'
})

export default router
