// miniprogram/pages/home.js

Page({

  data: {
    game: {},
    isPresentingJoinCard: false,
    isPresentingCreatingCard: false,
  },

  onLoad: function (options) {},
  onReady: function () {},
  onShow: function () {},
  onHide: function () {},
  onUnload: function () {},
  onPullDownRefresh: function () {},
  onReachBottom: function () {},
  onShareAppMessage: function () {},

  onCreateTap: function() { 
    this.setData({ 
      "isPresentingCreatingCard": true,
      "game.majorityWord": "",
      "game.minorityWord": "",
      "game.majority": 0,
      "game.minority": 0,
      "game.ghost": 0,
    }) 
  },

  onCancelTap: function() { this.setData({ 
    isPresentingJoinCard: false,
    isPresentingCreatingCard: false, 
  }) },

  onMajorityWordConfirm: function(event) { this.setData({ "game.majorityWord": event.detail.value }) },
  onMinorityWordConfirm: function(event) { this.setData({ "game.minorityWord": event.detail.value }) },

  onAddGhostTap: function() { this.setData({ "game.ghost": this.data.game.ghost + 1 }) },
  onSubGhostTap: function() { this.setData({ "game.ghost": Math.max(0, this.data.game.ghost - 1) }) },

  onAddMajorityTap: function() { this.setData({ "game.majority": this.data.game.majority + 1 }) },
  onSubMinorityTap: function() { this.setData({ "game.minority": Math.max(0, this.data.game.minority - 1) }) },

  onAddMinorityTap: function() { this.setData({ "game.minority": this.data.game.minority + 1 }) },
  onSubMajorityTap: function() { this.setData({ "game.majority": Math.max(0, this.data.game.majority - 1) }) },
  
  onJoinTap: function() {
    const db = wx.cloud.database()

    wx.getSetting()
      .then(res => {  if (res.authSetting['scope.userInfo']) { return wx.getUserInfo() } throw Error('获取用户信息失败') })
      .then(res => wx.cloud.callFunction({ name: 'updateInfo', data: { userInfo: res.userInfo } }))
      .then(_ => { this.onJoinGame() })
      .catch(err => { wx.showModal({ title: '出错了', content: err.message, showCancel: false }) })
  },

  onJoinGame: function() {
    this.setData({ isPresentingJoinCard: true })
  },

  onTargetRoomUpdated: function(e) {
    this.setData({ targetRoomid: e.detail.value })
  },

  onJoinFinish: function() {
    this.setData({ isPresentingJoinCard: false })

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('ghost').where(_.or([{ status: 0 }, { status: 1 }]).and({ shortcut: this.data.targetRoomid })).limit(1).get()
      .then(res => { if (res.data[0] && res.data[0]._id) { return res.data[0]._id } throw Error('找不到房间') })
      .then(gameid => { wx.navigateTo({ url: '../game/game?id=' + gameid }) })
      .catch(err => { wx.showModal({ title: '出错了', content: err.message, showCancel: false }) })
      .finally(res => { this.setData({ targetRoomid: undefined }) })
  },

  onCreateFinish: function () {
    wx.getSetting()
      .then(res => {  if (res.authSetting['scope.userInfo']) { return wx.getUserInfo() } throw Error('获取用户信息失败') })
      .then(res => wx.cloud.callFunction({ name: 'updateInfo', data: { userInfo: res.userInfo } }))
      .then(res => { return wx.cloud.callFunction({ name: 'createRoom', data: { game: this.data.game } }) })
      .then(res => { console.log(res); return res; })
      .then(res => { wx.navigateTo({ url: '../game/game?id=' + res.result._id }) })
      .catch(err => {  wx.showModal({ title: '出错啦', content: err.message, showCancel: false }) })
      .finally(res => { this.onCancelTap() })
  }
})