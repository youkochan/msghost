import type { HomePageData, HomePageGameData, HomePageUserOperation } from "./home.d";

Page<HomePageData, HomePageUserOperation>({
  data: {
    game: {},
    ui: {
      isPresentingJoinCard: false,
      isPresentingCreatingCard: false,
      isPresentingRewardCard: false,
    },
  },

  onClearCacheTap: function () {
    wx.clearStorage({ success: (_) => {} });
  },

  onRewardTap: function () {
    this.setData({
      "ui.isPresentingRewardCard": true,
      "ui.isPresentingJoinCard": false,
      "ui.isPresentingCreatingCard": false,
    });
  },

  onCreateTap: function () {
    this.setData({
      "ui.isPresentingCreatingCard": true,
      "game.majorityWord": "",
      "game.minorityWord": "",
    });
  },

  onCancelTap: function () {
    this.setData({
      "ui.isPresentingJoinCard": false,
      "ui.isPresentingCreatingCard": false,
      "ui.isPresentingRewardCard": false,
    });
  },

  onMajorityWordConfirm: function (event) {
    this.setData({ "game.majorityWord": event.detail.value });
  },

  onMinorityWordConfirm: function (event: { detail: { value: any } }) {
    this.setData({ "game.minorityWord": event.detail.value });
  },

  onJoinTap: function () {
    this.setData({ "game.targetRoomid": "", "ui.isPresentingJoinCard": true });
  },

  onTargetRoomUpdated: function (event: { detail: { value: any } }) {
    this.setData({ "game.targetRoomid": event.detail.value });
  },

  onJoinFinish: function () {
    const checkTargetRoomid = (roomid: string | undefined): string => {
      if (roomid) {
        return roomid;
      } else {
        throw Error("房间号为空");
      }
    };

    const checkTargetRoom = function (roomid: string) {
      const db = wx.cloud.database();
      const cmd = db.command;
      const orCmd = cmd.or([{ status: 0 }, { status: 1 }]);
      const andCmd = cmd.and([orCmd, { shortcut: roomid }]);

      return db.collection("ghost").where(andCmd).limit(1).get();
    };

    const checkTargetRoomResponse = function (response: DB.IQueryResult) {
      if (response.data[0] && response.data[0]._id) {
        return response.data[0]._id;
      } else {
        throw Error("找不到房间");
      }
    };

    const goToGame = function (gameid: DB.DocumentId) {
      if (gameid) {
        wx.navigateTo({ url: "../game/game?id=" + gameid });
      } else {
        throw Error("找不到房间");
      }
    };

    const handleJoinRoomError = function (e: Error) {
      wx.showModal({
        title: "加入房间出错",
        content: e.message,
        showCancel: false,
      });
    };

    this.onCancelTap();

    Promise.resolve(this.data.game.targetRoomid)
      .then((s) => checkTargetRoomid(s))
      .then((s) => checkTargetRoom(s))
      .then((r) => checkTargetRoomResponse(r))
      .then((s) => goToGame(s))
      .then((_) => this.setData({ "game.targetRoomid": "" }))
      .catch((e) => handleJoinRoomError(e));
  },

  onCreateFinish: function () {
    const checkGameData = function (game: HomePageGameData) {
      if (game) {
        return game;
      } else {
        throw Error("游戏数据为空");
      }
    };

    const checkMajorityWord = function (game: HomePageGameData) {
      if (game.majorityWord && typeof game.majorityWord === "string") {
        return game;
      } else {
        throw Error("多数派词语非法");
      }
    };

    const checkMinorityWord = function (game: HomePageGameData) {
      if (game.minorityWord && typeof game.minorityWord === "string") {
        return game;
      } else {
        throw Error("少数派词语非法");
      }
    };

    const checkWordLength = (game: HomePageGameData) => {
      if (game.majorityWord?.length !== game.minorityWord?.length) {
        throw Error("多数派与少数派字数不相等");
      }
    };

    const createRoom = () => {
      return wx.cloud.callFunction({
        name: "createRoom",
        data: { game: this.data.game },
      });
    };

    const getRoomId = (result: ICloud.CallFunctionResult): string => {
      return (result.result as AnyObject)._id;
    };

    const goToGame = (gameid: string) => {
      if (gameid) {
        wx.navigateTo({ url: "../game/game?id=" + gameid });
      } else {
        throw Error("找不到房间");
      }
    };

    const handleCreateRoomError = (e: Error) => {
      wx.showModal({
        title: "创建游戏出错",
        content: e.message,
        showCancel: false,
      });
    };

    Promise.resolve(this.data.game)
      .then((g) => checkGameData(g))
      .then((g) => checkMajorityWord(g))
      .then((g) => checkMinorityWord(g))
      .then((g) => checkWordLength(g))
      .then((_) => this.onCancelTap())
      .then((_) => createRoom())
      .then((r) => getRoomId(r))
      .then((s) => goToGame(s))
      .catch((e) => handleCreateRoomError(e));
  },
});
