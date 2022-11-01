new Page({
  data: {},

  onAuthReady: function() {
    const openid = this.data.openid;
    wx.cloud.callFunction({name: 'getUserInfo', data: {openid: openid}})
        .then((res) => {
          wx.showToast({title: '加载完成'});
          const data = res.result.list[0].data;
          const value = (number, total) => {
            return number ? (number / total * 100).toFixed(0) + '%' : '0%';
          };

          const playCount = data.playAsGhostCount + data.playAsPlayerCount;
          const playWinCount = data.winAsGhostCount + data.winAsPlayerCount;

          const p1 = value(data.winAsGhostCount, data.playAsGhostCount);
          const p2 = value(data.winAsPlayerCount, data.playAsPlayerCount);

          const nickName = res.result.list[0].userInfo.nickName ?? '👻';
          const avatar = String.fromCodePoint(nickName.codePointAt(0));

          this.setData({
            data: [
              [
                {text: '总游戏次数', number: data.totalCount},
                {text: '胜利次数', number: playWinCount},
                {text: '裁判次数', number: data.playAsHostCount},
              ],
              [
                {text: '人类次数', number: data.playAsPlayerCount},
                {text: '鬼次数', number: data.playAsGhostCount},
                {text: '当鬼率', number: value(data.playAsGhostCount, playCount)},
              ],
              [
                {text: '总胜率', number: value(playWinCount, playCount)},
                {text: '人类胜率', number: p2},
                {text: '鬼胜率', number: p1},
              ],
              [
                {text: '收到的赞', number: data.thumbUpCount},
                {text: '收到的踩', number: data.thumbDownCount},
              ],
            ],
            userInfo: res.result.list[0].userInfo,
            avatar: avatar,
          });
        })
        .catch((err) => {
          console.error(err);
          wx.showToast({title: '加载失败'});
        });
  },

  onLoad: function(options) {
    this.setData({openid: options.openid});
  },

  onShareAppMessage: function() {},
});
