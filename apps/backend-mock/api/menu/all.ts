export default eventHandler(async () => {
  // const userinfo = verifyAccessToken(event);
  // if (!userinfo) {
  //   return unAuthorizedResponse(event);
  // }

  const menus =
    MOCK_MENUS.find((item) => item.username === 'admin')?.menus ?? [];
  return useResponseSuccess(menus);
});
