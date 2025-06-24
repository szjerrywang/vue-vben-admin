import { MOCK_MENU_LIST } from '~/utils/mock-data';
import { useResponseSuccess } from '~/utils/response';

export default eventHandler(async () => {
  // const userinfo = verifyAccessToken(event);
  // if (!userinfo) {
  //   return unAuthorizedResponse(event);
  // }

  return useResponseSuccess(MOCK_MENU_LIST);
});
