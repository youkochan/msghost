// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

exports.main = async (event, _) => {
  const wxContext = cloud.getWXContext();

  const p1 = db.collection('ghost').where({_id: event.id}).limit(1).get();
  const p2 = db.collection('r_user_ghost').where({gameid: event.id}).get();

  return Promise.all([p1, p2]).then((res) => {
    const game = res[0].data[0];
    const playersData = res[1].data;
    const openids = playersData
        .map((i) => i.openid)
        .filter((i) => i !== game._openid);

    if (!game) {
      throw Error('无法找到房间');
    }
    if (game.status !== 0) {
      throw Error('游戏已开始');
    }
    if (openids.length < 7) {
      throw Error('房间人数不足，无法开始游戏');
    }

    const sortedOpenids = openids;
    let t;

    for (let i = sortedOpenids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      t = sortedOpenids[i];
      sortedOpenids[i] = sortedOpenids[j];
      sortedOpenids[j] = t;
    }

    const l0 = openids.length;
    const l1 = Math.floor(l0 / 2);
    const l2 = Math.floor((l0 - l1) / 2);
    const l3 = l0 - l1 - l2;

    const d1 = sortedOpenids.slice(0, l1);
    const d2 = sortedOpenids.slice(l1, l1 + l2);
    const d3 = sortedOpenids.slice(l1 + l2, l1 + l2 + l3);

    const c1 = db.collection('r_user_ghost');
    const c2 = db.collection('ghost');

    const u1 = c1
        .where({gameid: game._id, openid: db.command.in(d1)})
        .update({data: {role: 1}});
    const u2 = c1
        .where({gameid: game._id, openid: db.command.in(d2)})
        .update({data: {role: 2}});
    const u3 = c1
        .where({gameid: game._id, openid: db.command.in(d3)})
        .update({data: {role: 3}});
    const u4 = c2
        .doc(game._id)
        .update({data: {status: 1, majority: l1, minority: l2, ghost: l3}});

    return Promise.all([u1, u2, u3, u4]);
  })
      .then((_) => {
        return {openid: wxContext.OPENID, gameid: event.id};
      })
      .catch((err) => {
        return {error: err.message};
      });
};
