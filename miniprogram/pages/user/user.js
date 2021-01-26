Page({
  data: {

  },

  onLoad: function (options) {
    const openid = options.openid
    
    wx.cloud.callFunction({ name: 'getUserInfo', data: { openid: openid } })
      .then(res => {
        wx.showToast({ title: '加载完成' })
        const data = res.result.list[0].data
        const totalCount = data.playAsGhostCount + data.playAsPlayerCount
        const totalWinCount = data.winAsGhostCount + data.winAsPlayerCount
        
        this.setData({
          data: [
            [
              { text: '总游戏次数', number: data.totalCount },
              { text: '胜利次数', number: data.winAsGhostCount + data.winAsPlayerCount },
              { text: '失败次数', number: data.loseAsGhostCount + data.loseAsPlayerCount },
            ],
            [
              { text: '裁判次数', number: data.playAsHostCount },
              { text: '人类次数', number: data.playAsPlayerCount },
              { text: '鬼次数', number: data.playAsGhostCount },
            ],
            [
              { text: '总胜率', number: (totalWinCount / totalCount).toFixed(2) },
              { text: '人类胜率', number: (data.winAsPlayerCount / data.playAsPlayerCount).toFixed(2) },
              { text: '鬼胜率', number: (data.winAsGhostCount / data.playAsGhostCount).toFixed(2) },
            ],
            [
              { text: '收到的赞', number: data.thumbUpCount },
              { text: '收到的踩', number: data.thumbDownCount },
            ],
          ],
          userInfo: res.result.list[0].userInfo
        })
      })
      .catch(err => {
        console.error(err)
        wx.showToast({ title: '加载失败' })
      })
  },

  onShareAppMessage: function () {

  }
})