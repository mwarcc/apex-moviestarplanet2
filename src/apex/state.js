  // ─── State ────────────────────────────────────────────────────────────────

  const state = {
    accessToken: null,
    profileId:   null,
    profileName: null,
    ops: {
      gender:        { loading: false },
      mood:          { loading: false },
      status:        { loading: false },
      restore:       { loading: false },
      quests:        { loading: false, progress: 0 },
      crystals:      { loading: false, collected: 0, total: 40 },
      acceptFriends:      { loading: false },
      rejectFriends:      { loading: false },
      deleteFriendsLevel: { loading: false },
      deleteFriendsVip:   { loading: false },
      readMessages:       { loading: false },
      avatar:             { loading: false },
      homes:              { loading: false },
    },
    quizBot: {
      enabled: false,
      stats: { totalAnswered: 0, correct: 0, wrong: 0, startTime: null },
    },
    chatroomUsers: new Map(),
    sessionIdToProfileId: new Map(),
    chatroomRoomId: null,
    chatroomSocket: null,
    // Raw join-packet payload per profileId — captured the first time we
    // see them via 2000 (initial roster) or 20000 (late joiner). Used to
    // replay synthetic 20000 events when the user toggles Show Players.
    chatroomRawJoins: new Map(),
    chatroomFeed: [],         // [{ type, ts, ... }] — last N events for UI
    chatroomFeedMax: 80,
    appliedMood: null,        // last mood applied by user; used to rewrite outgoing WS 7001
    misc: {
      chatFilterBypass: _prefsGet(_PK.chat) === '1',
      autoLiker:        _prefsGet(_PK.autoLiker) === '1',
      cleanConsole:     _prefsGet(_PK.cleanConsole) === '1',
      invisibleJoin:    _prefsGet(_PK.invisJoin) === '1',
    },
    speeds: {
      crystals:      _loadSpeed('crystals'),
      messages:      _loadSpeed('messages'),
      acceptFriends: _loadSpeed('acceptFriends'),
      rejectFriends: _loadSpeed('rejectFriends'),
      deleteFriendsLevel: _loadSpeed('deleteFriendsLevel'),
      deleteFriendsVip:   _loadSpeed('deleteFriendsVip'),
      autoLiker:     _loadSpeed('autoLiker'),
    },
    autoLikerSent: new Set(),
    pkgs: {
      offers:   [],
      loading:  false,
      fetched:  false,
      errorMsg: null,
    },
    autographer: {
      targetProfile: null,   // { id, name, created }
      targetFaceUrl: null,
      panelOpen:     false,
      running:       false,
      timer:         null,
      sentCount:     0,
      maxCount:      1,      // 0 = unlimited
      isVip:         false,
      vipChecked:    false,
      nextInSec:     0,      // countdown
      countdownTimer: null,
      instantMode:        false,
      greetingAllRunning: false,
      greetingAllProgress: 0,
      greetingAllTotal:   0,
      greetingAllType:    null,
      greetingAllAbort:   false,
      searchQuery:        '',
      searchResults:      [],   // [{ id, name, faceUrl }]
      searching:          false,
      faceCache:          new Map(),   // profileId -> face URL
    },
  };

  let capturedMessagingBase = null;
  const traceLogs = []; // endpoints that returned a traceId (detected)

