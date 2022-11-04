const moveUserActions = [
  "🔼移到顶部",
  "⬆️上移一位",
  "⬇️下移一位",
  "🔽移到底部",
];

const markUserActions = [
  "👫标记为多数派",
  "🐶标记为少数派",
  "👻标记为鬼",
  "🚫取消标记",
];

const likeUserActions = ["👍你太强了！", "👎你好菜啊！", "🚫取消评价"];

const hostOperations = [
  "查看或隐藏投票结果",
  "开启一轮投票",
  "结束当前投票",
  "结束游戏",
];

const gameDetailResults = [
  "人获胜-只有人猜出",
  "人躺赢-鬼跳鬼失败",
  "鬼获胜-双方都猜出",
  "鬼躺赢-双方未猜出",
  "鬼大胜-只有鬼猜出",
  "鬼大胜-剩鬼过半数",
];

new Page({
  watchers: [],

  data: {
    isShowingHiddenCard: false,
    noteInfo: {},
    markInfo: {},
    roleInfo: {},
    userInfo: {},
    reviewInfo: {},
    targetOpenid: "",
    avatarInfo: {},
  },

  onAuthReady: function () {
    Promise.resolve()
      .then((_) => {
        wx.showLoading({ title: "加载房间中" });
      })
      .then((_) =>
        wx.cloud.callFunction({
          name: "joinRoomV2",
          data: { id: this.data.gameid },
        })
      )
      .then((res) => res.result)
      .then((r) => {
        if (r.error) {
          throw Error(r.error);
        }
        return r;
      })
      .then((r) => {
        this.setData({ openid: r.openid, gameid: r.gameid });
        return r.gameid;
      })
      .then((gameid) => {
        wx.hideLoading();
        return gameid;
      })
      .then((gameid) => {
        this.initWatcher(gameid);
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showModal({
          title: "加入房间失败",
          content: err.message,
          showCancel: false,
          success: (_) => {
            wx.reLaunch({ url: "../home/home" });
          },
        });
      });
  },

  initWatcher: function (gameid) {
    wx.showLoading({ title: "连接数据库中" });
    const openid = this.data.openid;
    const db = wx.cloud.database();

    const onStatusChange = (snapshot) => {
      const game = snapshot.docs[0];
      if (game) {
        this.setData({ game: game });
      }
    };

    const onPlayerChange = (snapshot) => {
      const openids = snapshot.docs.map((player) => player.openid);
      this.setData({ players: openids });

      if (!openids.includes(this.data.openid)) {
        wx.showModal({
          title: "你已被踢出房间",
          content: "点击确定返回主页",
          showCancel: false,
          success: (_) => {
            wx.reLaunch({ url: "../home/home" });
          },
        });
        return;
      }

      const roleInfo = {};
      snapshot.docs.forEach((player) => {
        roleInfo[player.openid] = player.role;
      });
      this.setData({ roleInfo: roleInfo });

      snapshot.docs.forEach((player) => {
        if (!this.data.userInfo[player.openid]) {
          db.collection("user")
            .doc(player.openid)
            .get()
            .then((res) => {
              const nickName = res.data.userInfo.nickName ?? "👻";
              const avatar = String.fromCodePoint(nickName.codePointAt(0));
              this.setData({
                ["userInfo." + player.openid]: res.data.userInfo,
              });
              this.setData({ ["avatarInfo." + player.openid]: avatar });
            });
        }
      });
    };

    const onReviewChange = (snapshot) => {
      const thumbUp = {};
      const thumbDown = {};
      snapshot.docs.forEach((r) => {
        const tid = r.targetOpenid;
        if (r.review === 0) {
          thumbUp[tid] = thumbUp[tid] ? thumbUp[tid] + 1 : 1;
        }
        if (r.review === 1) {
          thumbDown[tid] = thumbDown[tid] ? thumbDown[tid] + 1 : 1;
        }
      });
      this.setData({ thumbUp: thumbUp, thumbDown: thumbDown });
    };

    const onNoteChange = (snapshot) => {
      if (snapshot.docs[0]) {
        const noteInfo = snapshot.docs[0].noteInfo;
        const markInfo = snapshot.docs[0].markInfo;
        this.setData({ noteInfo: noteInfo, markInfo: markInfo });
      }
    };

    const onWatcherError = (err) => {
      console.error("onWatcherError", err);
      wx.hideLoading();
      if (this.watchers.length) {
        this.watchers.forEach((w) => {
          w.close();
        });
        this.watchers = [];
        wx.showModal({
          title: "监听数据库失败",
          content: "点击确定重新连接",
          showCancel: false,
          success: (_) => {
            this.initWatcher(gameid);
          },
        });
      }
    };

    const tasks = [
      {
        data: db.collection("ghost").doc(gameid),
        watcher: onStatusChange,
      },
      {
        data: db.collection("review").where({ gameid: gameid }),
        watcher: onReviewChange,
      },
      {
        data: db.collection("r_user_ghost").where({ gameid: gameid }),
        watcher: onPlayerChange,
      },
      {
        data: db.collection("note").where({ gameid: gameid, _openid: openid }),
        watcher: onNoteChange,
      },
    ];

    this.watchers = [];
    const convert = (task) => {
      return new Promise((resolve, _) => {
        this.watchers.push(
          task.data.watch({
            onChange: (snapshot) => {
              task.watcher(snapshot);
              resolve();
            },
            onError: onWatcherError,
          })
        );
      });
    };

    const ps = tasks.map((task) => convert(task));
    const pa = Promise.all(ps);
    const pt = new Promise((_, reject) => {
      setTimeout(() => {
        reject(Error());
      }, 10000);
    });

    Promise.race([pa, pt])
      .then((_) => {
        wx.showToast({ title: "加载完成" });
      })
      .catch((e) => {
        onWatcherError(e);
      });
  },

  onLoad: function (options) {
    this.setData({ gameid: options.id });
  },

  onUnload: function () {
    this.watchers.forEach((i) => i.close());
  },

  onStartGame: function () {
    const startGame = () => {
      wx.cloud.callFunction({ name: "startGameV3", data: { id: this.data.gameid } })
        .then((res) => res.result)
        .then((r) => { if (r.error) { throw Error(r.error); } return r; })
        .catch((e) => { wx.showModal({ title: "开始游戏失败", content: e.message, showCancel: false }) })
    };

    const count = this.data.players.length;

    if (count < 4) {
      wx.showModal({ title: "开始游戏失败", content: "人数过少，总人数最少四人", showCancel: false });
      return;
    }

    if (count < 8) {
      wx.showModal({ title: '游戏人数较少', content: '游戏总人数最好是八人以及以上，确定开始游戏吗？',
        complete: (res) => {
          if (res.cancel) { return; }
          if (res.confirm) { startGame() }
        }
      })
      return;
    }

    startGame();
  },

  onHostOperation: function () {
    wx.showActionSheet({
      itemList: hostOperations,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.onReviewVote();
            break;
          case 1:
            this.onStartVote();
            break;
          case 2:
            this.onEndVote();
            break;
          case 3:
            this.onEndGame();
            break;
          default:
            break;
        }
      },
    });
  },

  onReviewVote: function () {
    this.setData({ isReviewingVote: !this.data.isReviewingVote });
  },

  onStartVote: function () {
    const db = wx.cloud.database().collection("ghost");
    const gid = this.data.game._id;
    const doc = db.doc(gid);
    doc.update({ data: { currentVote: new Map() } }).catch((e) => {
      wx.showModal({
        title: "开始投票出错",
        content: e.message,
        showCancel: false,
      });
    });
  },

  onEndVote: function () {
    if (!this.data.game.currentVote) {
      return;
    }

    const currentVote = this.data.game.currentVote;
    const voteResult = {};

    Object.keys(currentVote).forEach((openid) => {
      const targetId = currentVote[openid];
      const record = voteResult[targetId] ?? {
        targetId: targetId,
        count: 0,
        source: [],
      };
      record.count = record.count + 1;
      record.source = [...record.source, openid];
      voteResult[targetId] = record;
    });

    const voteResultArray = Object.keys(voteResult)
      .map((key) => voteResult[key])
      .sort((record) => -record.count);

    const db = wx.cloud.database().collection("ghost");
    const gid = this.data.game._id;
    const doc = db.doc(gid);
    const votes = [voteResultArray, ...(this.data.game.votes ?? [])];
    doc.update({ data: { currentVote: null, votes: votes } }).catch((e) => {
      wx.showModal({
        title: "结束投票出错",
        content: e.message,
        showCancel: false,
      });
    });
  },

  onEndGame: function () {
    wx.showActionSheet({
      itemList: gameDetailResults,
      success: (res) => {
        const data = {
          id: this.data.gameid,
          winner: res.tapIndex < 2 ? 0 : 1,
          winnerDetails: res.tapIndex,
        };

        wx.cloud.callFunction({ name: "endGame", data: data }).catch((e) => {
          wx.showModal({
            title: "结束游戏出错",
            content: e.message,
            showCancel: false,
          });
        });
      },
    });
  },

  onAvatarTap: function (p) {
    const tid = p.currentTarget.dataset.openid;
    wx.navigateTo({ url: "../user/user?openid=" + tid });
  },

  onUserTap: function (p) {
    const tid = p.currentTarget.dataset.openid;
    const fid = this.data.openid;
    const cid = this.data.game._openid;

    const name = this.data.userInfo[tid].nickName;
    const gs = this.data.game.status;

    const shouldHandleEditNote = gs === 1;
    const shouldHandleMarkUser = gs === 1 && tid !== cid && fid !== cid;
    const shouldHandleMoveUser = gs === 1;
    const shouldHandleKickUser = gs === 0 && tid !== cid && fid === cid;
    const shouldHandleLikeUser = gs !== 0 && tid !== fid;
    const shouldHandleVoteUser =
      gs === 1 && tid !== cid && fid !== cid && this.data.game.currentVote;

    const handleEmoji = (emoji) => {
      const handleEditNote = (_) => {
        this.setData({ targetOpenid: tid });
      };

      const handleMarkUser = (_) => {
        wx.showActionSheet({
          itemList: markUserActions,
          success: (tap) => {
            if (tap.tapIndex === markUserActions.length - 1) {
              this.updateMark(tid, undefined);
            } else {
              this.updateMark(tid, tap.tapIndex + 1);
            }
          },
        });
      };

      const handleMoveUser = (_) => {
        wx.showActionSheet({
          itemList: moveUserActions,
          success: (tap) => {
            const p = this.data.players;
            const i = this.data.players.indexOf(tid);
            switch (moveUserActions[tap.tapIndex].substr(0, 2)) {
              case "🔼":
                {
                  const t = p.splice(i, 1);
                  p.unshift(t[0]);
                }
                break;
              case "⬆️":
                if (i !== 0) {
                  {
                    const t = p[i - 1];
                    p[i - 1] = p[i];
                    p[i] = t;
                  }
                }
                break;
              case "⬇️":
                if (i !== p.length - 1) {
                  const t = p[i + 1];
                  p[i + 1] = p[i];
                  p[i] = t;
                }
                break;
              case "🔽":
                {
                  const t = p.splice(i, 1);
                  p.push(t[0]);
                }
                break;
            }
            this.setData({ players: p });
          },
        });
      };

      const handleKickUser = (_) => {
        const openid = tid;
        const gameid = this.data.game._id;
        const rid = openid + "_" + gameid;
        wx.cloud
          .database()
          .collection("r_user_ghost")
          .doc(rid)
          .remove()
          .catch((e) => console.error(e));
      };

      const handleLikeUser = (_) => {
        wx.showActionSheet({
          itemList: likeUserActions,
          success: (tap) => {
            const db = wx.cloud.database().collection("review");
            const gid = this.data.game._id;
            const rid = [gid, fid, tid].join("_");
            const doc = db.doc(rid);
            switch (likeUserActions[tap.tapIndex].substr(0, 2)) {
              case "👍":
                doc.set({
                  data: { gameid: gid, targetOpenid: tid, review: 0 },
                });
                break;
              case "👎":
                doc.set({
                  data: { gameid: gid, targetOpenid: tid, review: 1 },
                });
                break;
              case "🚫":
                doc.remove();
                break;
            }
          },
        });
      };

      const handleVoteUser = (_) => {
        const currentVote = this.data.game.currentVote;
        currentVote[fid] = tid;
        const db = wx.cloud.database().collection("ghost");
        const gid = this.data.game._id;
        const doc = db.doc(gid);
        doc.update({ data: { currentVote: currentVote } }).catch((e) => {
          wx.showModal({
            title: "投票出错",
            content: e.message,
            showCancel: false,
          });
        });
      };

      Promise.resolve().then((_) => {
        switch (emoji) {
          case "⚽️":
            return handleKickUser();
          case "📝":
            return handleEditNote();
          case "📍":
            return handleMarkUser();
          case "🫵":
            return handleVoteUser();
          case "🔀":
            return handleMoveUser();
          case "💬":
            return handleLikeUser();
          default:
            break;
        }
      });
    };

    Promise.resolve([])
      .then((r) => {
        if (shouldHandleEditNote) {
          r.push("📝添加备注");
        }
        return r;
      })
      .then((r) => {
        if (shouldHandleMarkUser) {
          r.push("📍标记玩家");
        }
        return r;
      })
      .then((r) => {
        if (shouldHandleVoteUser) {
          r.push("🫵票出玩家");
        }
        return r;
      })
      .then((r) => {
        if (shouldHandleMoveUser) {
          r.push("🔀移动玩家");
        }
        return r;
      })
      .then((r) => {
        if (shouldHandleKickUser) {
          r.push("⚽️踢出" + name);
        }
        return r;
      })
      .then((r) => {
        if (shouldHandleLikeUser) {
          r.push("💬评价" + name);
        }
        return r;
      })
      .then((r) => {
        if (r.length > 0) {
          wx.showActionSheet({
            itemList: r,
            success: (tap) => {
              handleEmoji(r[tap.tapIndex].substr(0, 2));
            },
          });
        }
      });
  },

  onInputBlur: function (e) {
    this.updateNote(this.data.targetOpenid, e.detail.value);
    this.setData({ targetOpenid: "" });
  },

  onCardTap: function () {
    this.setData({ isShowingHiddenCard: !this.data.isShowingHiddenCard });
  },

  updateCloudNote: function () {
    const db = wx.cloud.database();
    const rid = this.data.openid + "_" + this.data.game._id;

    const data = {
      gameid: this.data.game._id,
      noteInfo: this.data.noteInfo,
      markInfo: this.data.markInfo,
    };

    db.collection("note")
      .doc(rid)
      .set({ data: data })
      .catch((err) => {
        console.error(err);
      });
  },

  updateNote: function (openid, note) {
    console.log("updateNote", openid, note);
    const noteInfo = this.data.noteInfo;
    noteInfo[openid] = note;
    this.setData({ noteInfo: noteInfo });
    this.updateCloudNote();
  },

  updateMark: function (openid, mark) {
    console.log("updateMark", openid, mark);
    const markInfo = this.data.markInfo;
    markInfo[openid] = mark;
    this.setData({ markInfo: markInfo });
    this.updateCloudNote();
  },

  onShareAppMessage: function () {},
});
