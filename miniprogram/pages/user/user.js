Page({
  data: {

  },

  onLoad: function (options) {
    const openid = options.openid
    
    wx.cloud.callFunction({ name: 'getUserInfo', data: { openid: openid } })
      .then(res => {
        wx.showToast({ title: '加载完成' })
        const data = res.result.list[0].data
        let getPercentString = (number, total) => {
          return number ? (number / total * 100).toFixed(0) + '%' : '0%'
        }

        this.setData({
          data: [
            [
              { text: '总游戏次数', number: data.totalCount },
              { text: '胜利次数', number: data.winAsGhostCount + data.winAsPlayerCount },
              { text: '裁判次数', number: data.playAsHostCount },
            ],
            [
              { text: '人类次数', number: data.playAsPlayerCount },
              { text: '鬼次数', number: data.playAsGhostCount },
              { text: '当鬼率', number: getPercentString(data.playAsGhostCount, data.playAsGhostCount + data.playAsPlayerCount) },
            ],
            [
              { text: '总胜率', number: getPercentString(data.winAsGhostCount + data.winAsPlayerCount, data.playAsGhostCount + data.playAsPlayerCount) },
              { text: '人类胜率', number: getPercentString(data.winAsPlayerCount, data.playAsPlayerCount) },
              { text: '鬼胜率', number: getPercentString(data.winAsGhostCount, data.playAsGhostCount) },
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