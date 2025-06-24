import type { UserInfo } from '@vben/types';

import { ref } from 'vue';

import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { useKeycloak } from '@josempgon/vue-keycloak';
import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  // const router = useRouter();
  const { keycloak, isAuthenticated, userId, username, roles, token } =
    useKeycloak();

  const loginLoading = ref(false);

  if (keycloak.value) {
    keycloak.value.onAuthSuccess = async () => {
      console.error('Keycloak authentication successful');
      let userInfo: null | UserInfo = null;
      try {
        loginLoading.value = true;

        // 登录成功后，获取 accessToken
        if (token.value) {
          console.error('token set successful');
          accessStore.setAccessToken(token.value);

          // 获取用户信息并存储到 accessStore 中
          const [fetchUserInfoResult, accessCodes] = await Promise.all([
            fetchUserInfo(),
            getAccessCodesApi(),
          ]);

          userInfo = fetchUserInfoResult;

          userStore.setUserInfo(userInfo);
          accessStore.setAccessCodes(accessCodes);

          if (accessStore.loginExpired) {
            accessStore.setLoginExpired(false);
          }

          if (userInfo?.realName) {
            notification.success({
              description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
              duration: 3,
              message: $t('authentication.loginSuccess'),
            });
          }
        }
      } finally {
        loginLoading.value = false;
      }
    };
    keycloak.value.onAuthLogout = () => {
      resetAllStores();
      accessStore.setLoginExpired(false);
    };
    keycloak.value.onAuthError = (error) => {
      console.error('Keycloak authentication error:', error);
      // notification.error({
      //   description: $t('authentication.loginError'),
      //   duration: 3,
      //   message: $t('authentication.loginFailed'),
      // });
    };
  } else {
    console.error('Keycloak instance is not initialized.');
  }

  async function initAuthStore() {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      // 登录成功后，获取 accessToken
      if (token.value && accessStore.accessToken !== token.value) {
        console.error('token set successful');
        accessStore.setAccessToken(token.value);

        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   * @param onSuccess 成功之后的回调函数
   */
  async function authLogin(
    redirectUri?: string,
    // params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    // const userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      // const { accessToken } = await loginApi(params);
      if (!keycloak.value) {
        throw new Error('Keycloak instance is not initialized.');
      }
      if (!isAuthenticated.value) {
        await keycloak.value?.login({
          redirectUri: redirectUri || preferences.app.defaultHomePath,
        });
        return null;
      }
      await onSuccess?.();
      return fetchUserInfo();

      //   // 如果成功获取到 accessToken
      //   if (token.value) {
      //     accessStore.setAccessToken(token.value);

      //     // 获取用户信息并存储到 accessStore 中
      //     const [fetchUserInfoResult, accessCodes] = await Promise.all([
      //       fetchUserInfo(),
      //       getAccessCodesApi(),
      //     ]);

      //     userInfo = fetchUserInfoResult;

      //     userStore.setUserInfo(userInfo);
      //     accessStore.setAccessCodes(accessCodes);

      //     if (accessStore.loginExpired) {
      //       accessStore.setLoginExpired(false);
      //     } else {
      //       onSuccess
      //         ? await onSuccess?.()
      //         : await router.push(
      //             userInfo?.homePath || preferences.app.defaultHomePath,
      //           );
      //     }

      //     if (userInfo?.realName) {
      //       notification.success({
      //         description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
      //         duration: 3,
      //         message: $t('authentication.loginSuccess'),
      //       });
      //     }
      //   }
    } finally {
      loginLoading.value = false;
    }

    return null;
  }

  async function logout(redirectUri: string) {
    // const logoutRedirectUri = redirect
    //   ? encodeURIComponent(router.currentRoute.value.fullPath)
    //   : preferences.app.defaultHomePath;
    try {
      await keycloak.value?.logout({
        redirectUri,
      });
    } catch {
      // 不做任何处理
    }

    // resetAllStores();
    // accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    // await router.replace({
    //   path: LOGIN_PATH,
    //   query: redirect
    //     ? {
    //         redirect: encodeURIComponent(router.currentRoute.value.fullPath),
    //       }
    //     : {},
    // });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    if (isAuthenticated) {
      userInfo = {
        realName: username.value || '',
        userId: userId.value || '',
        username: username.value || '',
        avatar: '',
        roles: roles.value || [],
        desc: '',
        homePath: preferences.app.defaultHomePath,
        token: token.value || '',
      };
    }
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    initAuthStore,
  };
});
