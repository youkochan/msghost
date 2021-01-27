// miniprogram/pages/home.js

Page({

  data: {
    game: {},
    isPresentingJoinCard: false,
    isPresentingCreatingCard: false,
  },

  onCreateTap: function() { 
    this.setData({ 
      "isPresentingCreatingCard": true,
      "game.majorityWord": "",
      "game.minorityWord": ""
    }) 
  },

  onCancelTap: function() {
    this.setData({ 
      isPresentingJoinCard: false,
      isPresentingCreatingCard: false, 
    })
  },

  onMajorityWordConfirm: function(event) { this.setData({ "game.majorityWord": event.detail.value }) },
  onMinorityWordConfirm: function(event) { this.setData({ "game.minorityWord": event.detail.value }) },  

  onJoinTap: function(e) { this.setData({ targetRoomid: '', isPresentingJoinCard: true }) },

  onTargetRoomUpdated: function(e) { this.setData({ targetRoomid: e.detail.value }) },

  onJoinFinish: function() {
    this.setData({ isPresentingJoinCard: false })
    
    const db = wx.cloud.database()
    const cmd = db.command
    const targetRoomid = this.data.targetRoomid
    
    new Promise((resolve, reject) => { if (targetRoomid) { resolve(targetRoomid) } reject(Error('房间号为空')) })
      .then(_ => db.collection('ghost').where(cmd.or([{ status: 0 }, { status: 1 }]).and({ shortcut: targetRoomid })).limit(1).get())
      .then(res => { if (res.data[0] && res.data[0]._id) { return res.data[0]._id } throw Error('找不到房间') })
      .then(gameid => { wx.navigateTo({ url: '../game/game?id=' + gameid }) })
      .then(_ => { this.setData({ targetRoomid: undefined }) })
      .catch(err => { wx.showModal({ title: '加入房间出错', content: err.message, showCancel: false }) })
  },

  onCreateFinish: function () {
    new Promise((resolve, reject) => { if (this.data.game) { resolve(this.data.game) } reject(Error('游戏数据为空')) })
      .then(game => { if (game.majorityWord && typeof(game.majorityWord) === 'string') { return game } throw Error('多数派词语非法') })
      .then(game => { if (game.minorityWord && typeof(game.minorityWord) === 'string') { return game } throw Error('少数派词语非法') })
      .then(game => { if (game.majorityWord.length === game.minorityWord.length) { return game } throw Error('多数派与少数派字数不相等') })
      .then(_ => { this.onCancelTap() })
      .then(_ => wx.cloud.callFunction({ name: 'createRoom', data: { game: this.data.game } }))
      .then(res => res.result._id)
      .then(gameid => { if (gameid) { return gameid } throw Error('找不到房间') })
      .then(gameid => { wx.navigateTo({ url: '../game/game?id=' + gameid }) })
      .catch(err => {  wx.showModal({ title: '创建游戏出错', content: err.message, showCancel: false }) })
  }
})