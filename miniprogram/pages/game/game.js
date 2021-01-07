Page({
  data: {
    noteInfo: {},
    userInfo: {},
    playerInfo: {},
    targetOpenid: '',
  },

  onGameChange: function(snapshot) {
    if (snapshot.docs[0]) { this.setData({ game: snapshot.docs[0] }) }
  },

  onPlayersChange: function(snapshot) {
    const db = wx.cloud.database()
    var info = this.data.userInfo
  
    var players = {}
    snapshot.docs.forEach(player => { players[player.openid] = player })
    this.setData({ players: players })

    snapshot.docs.forEach(player => {
      if (!info[player.openid]) {
        db.collection('user').doc(player.openid).get().then(res => {
          info[player.openid] = res.data.userInfo
          this.setData({ userInfo: info })
        })
      }
    })
  },

  onGameError: error => {
    console.error(error)
  },

  onLoad: function (options) {
    const db = wx.cloud.database()

    wx.cloud.callFunction({ name: 'joinRoomV2', data: { id: options.id } })
      .then(res => res.result)
      .then(result => { if (result.error) { throw Error(result.error) } return result })
      .then(result => { this.setData({ openid: result.openid, gameid: result.gameid }); return result.gameid })
      .then(gameid => { 
        db.collection('ghost').doc(gameid).watch({
          onChange: this.onGameChange,
          onError: this.onGameError
        })
        db.collection('r_user_ghost').where({ gameid: gameid }).watch({
          onChange: this.onPlayersChange, onError: this.onGameError
        })
      })
      .catch(err => { 
        wx.showModal({ title: '加入房间失败', content: err.message, showCancel: false, success: res => { wx.redirectTo({ url: '../home/home' }) } })
      })
  },

  onStartGame: function() {
    wx.cloud.callFunction({ name: 'startGameV2', data: { id: this.data.gameid } })
      .then(res => res.result)
      .then(result => { if (result.error) { throw Error(result.error) } return result })
      .catch(err => { wx.showModal({ title: '开始游戏失败', content: err.message, showCancel: false}) })
  },

  onEndGame: function() {
    const itemList = ['人类获胜', '鬼获胜']
    wx.showActionSheet({
      itemList: itemList,
      success: res => {
        wx.cloud.callFunction({ name: 'endGame', data: { id: this.data.gameid, winner: res.tapIndex } })
          .catch(err => { wx.showModal({ title: '结束游戏出错', content: err.message, showCancel: false}) })
      }
    })
  },

  onAddNote: function(p) {
    if (this.data.targetOpenid) {
      this.setData({ targetOpenid: '', noteInfo: noteInfo })
    }
    else {
      const openid = p.currentTarget.dataset.openid
      if (openid) {
        this.setData({ targetOpenid: openid })
      }
    }
  },

  onInputBlur: function(e) {
    var noteInfo = this.data.noteInfo
    noteInfo[this.data.targetOpenid] = e.detail.value
    this.setData({ targetOpenid: '', noteInfo: noteInfo })
  }
})