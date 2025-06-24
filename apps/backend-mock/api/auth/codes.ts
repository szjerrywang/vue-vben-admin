export default eventHandler(() => {
  // const userinfo = verifyAccessToken(event);
  // if (!userinfo) {
  //   return unAuthorizedResponse(event);
  // }

  const codes =
    MOCK_CODES.find((item) => item.username === 'admin')?.codes ?? [];

  return useResponseSuccess(codes);
});
