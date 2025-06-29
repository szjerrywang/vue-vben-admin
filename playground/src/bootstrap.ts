import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { initStores, resetAllStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antd';

import { useKeycloak, vueKeycloak } from '@josempgon/vue-keycloak';
import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';
import { router } from '#/router';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';

function checkLogin() {
  const url = `${window.location.origin}`;

  const { keycloak, isAuthenticated } = useKeycloak();

  if (isAuthenticated.value) {
    // console.log('User is authenticated');
  } else {
    // console.log('User is not authenticated');
    keycloak.value?.login({ redirectUri: url });
  }
}

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  // 设置弹窗的默认配置
  // setDefaultModalProps({
  //   fullscreenButton: false,
  // });
  // 设置抽屉的默认配置
  // setDefaultDrawerProps({
  //   zIndex: 1020,
  // });

  const app = createApp(App);

  await vueKeycloak.install(app, () => {
    const silentCheckSsoRedirectUri = `${window.location.origin}/silent-check-sso.html`;

    return {
      config: {
        url: 'https://lhapp.dev/auth',
        realm: 'external',
        clientId: 'external-client-2',
      },

      initOptions: {
        onLoad: 'login-required',
        silentCheckSsoRedirectUri,
      },
    };
  });

  checkLogin();

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称，也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });
  await resetAllStores();

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置@tanstack/vue-query
  const { VueQueryPlugin } = await import('@tanstack/vue-query');
  app.use(VueQueryPlugin);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
