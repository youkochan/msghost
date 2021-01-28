new Component({
  data: {
    authorized: true,
  },

  methods: {
    onGetUserInfo: function(e) {
      const info = e.detail.userInfo;
      if (!info) {
        return;
      }
      Promise.resolve(info)
          .then((res) => wx.cloud.callFunction({
            name: 'updateInfo',
            data: {userInfo: res},
          }))
          .then((_) => {
            this.triggerEvent('AuthReady', {}, {});
            this.setData({authorized: true});
          })
          .catch((_) => {
            wx.showModal({title: '授权失败，请重试', showCancel: false});
          });
    },
  },

  lifetimes: {
    attached: function() {
      console.log('[component-auth] attached');
      wx.getSetting()
          .then((res) => {
            if (res.authSetting['scope.userInfo']) {
              this.triggerEvent('AuthReady', {}, {});
              return wx.getUserInfo().then((res) => wx.cloud.callFunction({
                name: 'updateInfo',
                data: {userInfo: res.userInfo},
              }));
            } else {
              this.setData({authorized: false});
            }
          });
    },

    detached: function() {
      console.log('[component-auth] detached');
    },
  },
});
