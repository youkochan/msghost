// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const p1 = db.collection('ghost').where({ _id: event.id }).limit(1).get()
  const p2 = db.collection('r_user_ghost').where({ gameid: event.id }).get()

  return Promise.all([p1, p2]).then(res => {
    const game = res[0].data[0]
    const playersData = res[1].data
    const openids = playersData.map(i => i.openid)

    const playersCountLimit = game.majority + game.minority + game.ghost + 1
    const openid = wxContext.OPENID
    const rid = openid + '_' + game._id

    if (openids.includes(openid)) {
      return { openid: wxContext.OPENID, gameid: event.id }
    }

    if (!game) {
      throw Error('无法找到房间')
    }
    if (game.status !== 0) {
      throw Error('游戏已开始，无法加入')
    }
    if (game.status === 0 && playersData.length >= playersCountLimit) {
      throw Error('房间已满，无法加入')
    }

    if (openid === game._openid) {
      return db.collection('r_user_ghost').doc(rid).set({ data: { gameid: game._id, openid: openid, role: 0 }})
    }
    else {
      return db.collection('r_user_ghost').doc(rid).set({ data: { gameid: game._id, openid: openid }})
    }
  })
  .then(_ => { 
    return { openid: wxContext.OPENID, gameid: event.id }
  })
}