export type InputConfirm = WechatMiniprogram.InputConfirm<{}, {}>;

/**
 * Home page user operations, used in wxml
 */
export type HomePageUserOperation = {
  onClearCacheTap: () => void;
  onRewardTap: () => void;
  onCreateTap: () => void;
  onCancelTap: () => void;
  onMajorityWordConfirm: (event: InputConfirm) => void;
  onMinorityWordConfirm: (event: InputConfirm) => void;
  onTargetRoomUpdated: (event: InputConfirm) => void;
  onJoinTap: () => void;
  onJoinFinish: () => void;
  onCreateFinish: () => void;
};

/**
 * Home page game data
 */
export type HomePageGameData = {
  majorityWord?: string;
  minorityWord?: string;
  targetRoomid?: string;
};

/**
 * Home page UI data
 */
export type HomePageUIData = {
  isPresentingJoinCard: boolean;
  isPresentingCreatingCard: boolean;
  isPresentingRewardCard: boolean;
};

/**
 * Home page data
 */
export type HomePageData = {
  game: HomePageGameData;
  ui: HomePageUIData;
};
