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
    const playersOpenid = playersData.map(i => i.openid).filter(i => i !== game._openid)
    const playersCountLimit = game.majority + game.minority + game.ghost
    
    console.log('playersData', playersData)
    console.log('playersOpenid', playersOpenid)
    console.log('game', game)

    if (!game) {
      throw Error('无法找到房间')
    }
    if (game.status !== 0) {
      throw Error('游戏已开始')
    }

    console.log('playersData.length', playersData.length)
    console.log('playersCountLimit', playersCountLimit)

    if (playersOpenid.length < playersCountLimit) {
      throw Error('房间人数不足，无法开始游戏')
    }

    var sortedOpenids = playersOpenid
    sortedOpenids.sort(_ => { return .5 - Math.random() })

    const majorityOpenids = sortedOpenids.slice(0, game.majority)
    const minorityOpenids = sortedOpenids.slice(game.majority, game.majority + game.minority)
    const ghostOpenids = sortedOpenids.slice(game.majority + game.minority, game.majority + game.minority + game.ghost)

    console.log('majorityOpenids', majorityOpenids)
    console.log('minorityOpenids', minorityOpenids)
    console.log('ghostOpenids', ghostOpenids)

    const u1 = db.collection('r_user_ghost').where({ gameid: game._id, openid: db.command.in(majorityOpenids) }).update({ data: { role: 1 } })
    const u2 = db.collection('r_user_ghost').where({ gameid: game._id, openid: db.command.in(minorityOpenids) }).update({ data: { role: 2 } })
    const u3 = db.collection('r_user_ghost').where({ gameid: game._id, openid: db.command.in(ghostOpenids) }).update({ data: { role: 3 } })
    const u4 = db.collection('ghost').doc(game._id).update({ data: { status: 1 } })

    return Promise.all([u1, u2, u3, u4])
  })
  .then(_ => { 
    return { openid: wxContext.OPENID, gameid: event.id }
  })
}