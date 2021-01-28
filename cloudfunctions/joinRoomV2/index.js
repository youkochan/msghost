// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

exports.main = async (event, _) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const p1 = db.collection('ghost').where({_id: event.id}).limit(1).get();
  const p2 = db.collection('r_user_ghost').where({gameid: event.id}).get();

  return Promise.all([p1, p2]).then((res) => {
    const game = res[0].data[0];
    const openids = res[1].data.map((i) => i.openid);
    const rid = openid + '_' + game._id;

    if (openids.includes(openid)) {
      return;
    }

    if (!game) {
      throw Error('无法找到房间');
    }
    if (game.status !== 0) {
      throw Error('游戏已开始，无法加入');
    }

    if (openid === game._openid) {
      return db
          .collection('r_user_ghost')
          .doc(rid)
          .set({data: {gameid: game._id, openid: openid, role: 0}});
    } else {
      return db
          .collection('r_user_ghost')
          .doc(rid)
          .set({data: {gameid: game._id, openid: openid}});
    }
  })
      .then((_) => {
        return {openid: wxContext.OPENID, gameid: event.id};
      })
      .catch((err) => {
        return {error: err.message};
      });
};
