// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 云函数入口函数
exports.main = async (event, context) => {
  const openid = event.openid;
  const db = cloud.database();
  const _ = db.command;
  const $ = _.aggregate;

  return db.collection('r_user_ghost')
      .aggregate()
      .match({openid: openid})
      .lookup({
        from: 'ghost',
        localField: 'gameid',
        foreignField: '_id',
        as: 'game',
      })
      .lookup({
        from: 'review',
        localField: 'gameid',
        foreignField: 'gameid',
        as: 'review',
      })
      .match({game: _.size(1)})
      .match({'game.status': 2})
      .project({
        role: '$role',
        game: $.arrayElemAt(['$game', 0]),
        review: '$review',
      })
      .project({
        role: '$role',
        game: '$game',
        review: $.filter({
          input: '$review',
          as: 'item',
          cond: $.eq(['$$item.targetOpenid', openid])}),
      })
      .project({
        role: '$role',
        game: '$game',
        isHost: $.eq(['$role', 0]),
        isGhost: $.eq(['$role', 3]),
        isPlayer: $.or([$.eq(['$role', 1]), $.eq(['$role', 2])]),
        isWinner: $.or([
          $.and([$.eq(['$role', 1]), $.eq(['$game.winner', 0])]),
          $.and([$.eq(['$role', 2]), $.eq(['$game.winner', 0])]),
          $.and([$.eq(['$role', 3]), $.eq(['$game.winner', 1])]),
        ]),
        thumbUpCount: $.size($.filter({
          input: '$review', as: 'item', cond: $.eq(['$$item.review', 0]),
        })),
        thumbDownCount: $.size($.filter({
          input: '$review', as: 'item', cond: $.eq(['$$item.review', 1]),
        })),
      })
      .group({
        _id: null,
        totalCount: $.push('$role'),
        playAsHostCount: $.push($.cond({
          if: $.eq(['$isHost', true]), then: 1, else: 0,
        })),
        playAsGhostCount: $.push($.cond({
          if: $.eq(['$isGhost', true]), then: 1, else: 0,
        })),
        playAsPlayerCount: $.push($.cond({
          if: $.eq(['$isPlayer', true]), then: 1, else: 0,
        })),
        winAsGhostCount: $.push($.cond({
          if: $.and([
            $.eq(['$isGhost', true]),
            $.eq(['$isWinner', true]),
          ]), then: 1, else: 0,
        })),
        winAsPlayerCount: $.push($.cond({
          if: $.and([
            $.eq(['$isGhost', false]),
            $.eq(['$isWinner', true]),
          ]), then: 1, else: 0,
        })),
        loseAsGhostCount: $.push($.cond({
          if: $.and([
            $.eq(['$isGhost', true]),
            $.eq(['$isWinner', false]),
          ]), then: 1, else: 0,
        })),
        loseAsPlayerCount: $.push($.cond({
          if: $.and([
            $.eq(['$isGhost', false]),
            $.eq(['$isWinner', false]),
          ]), then: 1, else: 0,
        })),
        thumbUpCountArray: $.push('$thumbUpCount'),
        thumbDownCountArray: $.push('$thumbDownCount'),
      })
      .project({
        _id: 0,
        openid: openid,
        data: {
          totalCount: $.size('$totalCount'),
          thumbUpCount: $.sum('$thumbUpCountArray'),
          thumbDownCount: $.sum('$thumbDownCountArray'),
          playAsHostCount: $.sum('$playAsHostCount'),
          playAsGhostCount: $.sum('$playAsGhostCount'),
          playAsPlayerCount: $.sum('$playAsPlayerCount'),
          winAsGhostCount: $.sum('$winAsGhostCount'),
          winAsPlayerCount: $.sum('$winAsPlayerCount'),
          loseAsGhostCount: $.sum('$loseAsGhostCount'),
          loseAsPlayerCount: $.sum('$loseAsPlayerCount'),
        },
      })
      .lookup({
        from: 'user',
        localField: 'openid',
        foreignField: '_id',
        as: 'user',
      })
      .project({data: '$data', userInfo: $.arrayElemAt(['$user', 0])})
      .project({data: '$data', userInfo: '$userInfo.userInfo'})
      .end();
};
