const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  return new Promise((res, rej) => {
    if (event.game) {
      const newData = {
        ...event.game,
        '_openid': openid,
        'shortcut': Math.random().toFixed(4).substr(2),
        'status': 0,
      };
      res(db.collection('ghost').add({data: newData}));
    } else {
      rej(new Error('数据为空'));
    }
  });
};
