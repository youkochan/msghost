// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

exports.main = async (event, _) => {
  const gameid = event.id;
  const winner = event.winner;
  const winnerDetails = event.winnerDetails;

  return db
      .collection('ghost')
      .doc(gameid)
      .update({
        data: {status: 2, winner: winner, winnerDetails: winnerDetails},
      });
};
