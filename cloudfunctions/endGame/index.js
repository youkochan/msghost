// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const gameid = event.id
  const winner = event.winner

  return db.collection('ghost').doc(gameid).update({ data: { status: 2, winner: winner } })
}
