// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 云函数入口函数
exports.main = async (event, _) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  console.log(event);
  console.log(openid);

  return db
      .collection('user')
      .doc(openid)
      .set({data: {userInfo: event.userInfo}});
};
