new Page({
  data: {
    game: {},
    isPresentingJoinCard: false,
    isPresentingCreatingCard: false,
  },

  onCreateTap: function() {
    this.setData({
      'isPresentingCreatingCard': true,
      'game.majorityWord': '',
      'game.minorityWord': '',
    });
  },

  onCancelTap: function() {
    this.setData({
      isPresentingJoinCard: false,
      isPresentingCreatingCard: false,
    });
  },

  onMajorityWordConfirm: function(event) {
    this.setData({'game.majorityWord': event.detail.value});
  },

  onMinorityWordConfirm: function(event) {
    this.setData({'game.minorityWord': event.detail.value});
  },

  onJoinTap: function() {
    this.setData({targetRoomid: '', isPresentingJoinCard: true});
  },

  onTargetRoomUpdated: function(e) {
    this.setData({targetRoomid: e.detail.value});
  },

  onJoinFinish: function() {
    this.setData({isPresentingJoinCard: false});
    Promise.resolve(this.data.targetRoomid)
        .then((r) => this.checkTargetRoomid(r))
        .then((r) => this.checkTargetRoom(r))
        .then((r) => this.checkTargetRoomResponse(r))
        .then((g) => this.goToGame(g))
        .then((_) => this.setData({targetRoomid: undefined}))
        .catch((e) => this.handleJoinRoomError(e));
  },

  onCreateFinish: function() {
    Promise.resolve(this.data.game)
        .then((g) => this.checkGameData(g))
        .then((g) => this.checkMajorityWord(g))
        .then((g) => this.checkMinorityWord(g))
        .then((g) => this.checkWordLength(g))
        .then((_) => this.onCancelTap())
        .then((_) => this.createRoom())
        .then((r) => r.result._id)
        .then((g) => this.goToGame(g))
        .catch((e) => this.handleCreateRoomError(e));
  },

  // Join check
  checkTargetRoomid: function(roomid) {
    if (roomid) {
      return roomid;
    } else {
      reject(Error('房间号为空'));
    }
  },

  checkTargetRoom: function(roomid) {
    const db = wx.cloud.database();
    const cmd = db.command;
    return db.collection('ghost')
        .where(cmd.or([{status: 0}, {status: 1}]).and({shortcut: roomid}))
        .limit(1)
        .get();
  },

  checkTargetRoomResponse: function(response) {
    if (response.data[0] && response.data[0]._id) {
      return response.data[0]._id;
    } else {
      throw Error('找不到房间');
    }
  },

  // Create check
  checkGameData: function(game) {
    if (game) {
      return game;
    } else {
      reject(Error('游戏数据为空'));
    }
  },

  checkMajorityWord: function(game) {
    if (game.majorityWord && typeof(game.majorityWord) === 'string') {
      return game;
    } else {
      throw Error('多数派词语非法');
    }
  },

  checkMinorityWord: function(game) {
    if (game.minorityWord && typeof(game.minorityWord) === 'string') {
      return game;
    } else {
      throw Error('少数派词语非法');
    }
  },

  checkWordLength: function(game) {
    if (game.majorityWord.length === game.minorityWord.length) {
      return game;
    } else {
      throw Error('多数派与少数派字数不相等');
    }
  },

  goToGame: function(gameid) {
    if (gameid) {
      wx.navigateTo({url: '../game/game?id=' + gameid});
    } else {
      throw Error('找不到房间');
    }
  },

  createRoom: function() {
    return wx.cloud.callFunction({
      name: 'createRoom',
      data: {game: this.data.game},
    });
  },

  handleCreateRoomError: function(e) {
    wx.showModal({
      title: '创建游戏出错',
      content: e.message,
      showCancel: false,
    });
  },

  handleJoinRoomError: function(e) {
    wx.showModal({
      title: '加入房间出错',
      content: e.message,
      showCancel: false,
    });
  },
});
