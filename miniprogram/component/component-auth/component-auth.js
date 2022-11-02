new Component({
  data: {
    authorized: true,
  },

  methods: {
    onInput: function (e) {
      this.setData({ nickName: e.detail.value });
    },

    onInputConfirm: function (e) {
      this.setData({ nickName: e.detail.value });
    },

    onInputBlur: function (e) {
      this.setData({ nickName: e.detail.value });
    },

    onFinish: function () {
      if (!this.data.nickName) {
        wx.showModal({
          title: "昵称非法",
          content: "点击确定重新编辑昵称",
          showCancel: false,
        });
        return;
      }

      this.onUploadUserInfo();
    },

    onUploadUserInfo: function () {
      const userInfo = { nickName: this.data.nickName };
      wx.setStorage({ key: "CACHED_USER_INFO", data: JSON.stringify(userInfo) })
        .then((_) =>
          wx.cloud.callFunction({
            name: "updateInfo",
            data: { userInfo: userInfo },
          })
        )
        .then((_) => this.triggerEvent("AuthReady", {}, {}))
        .then((_) => this.setData({ authorized: true }))
        .catch((_) =>
          wx.showModal({ title: "授权失败，请重试", showCancel: false })
        );
    },
  },

  lifetimes: {
    attached: function () {
      console.log("[component-auth] attached");
      wx.getStorage({ key: "CACHED_USER_INFO" })
        .then((_) => this.triggerEvent("AuthReady", {}, {}))
        .then((_) => this.setData({ authorized: true }))
        .catch((err) => {
          this.setData({ authorized: false });
          console.error(err);
        });
    },

    detached: function () {
      console.log("[component-auth] detached");
    },
  },
});
