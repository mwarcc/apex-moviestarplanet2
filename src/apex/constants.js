
  // ─── Constants ────────────────────────────────────────────────────────────

  // Populated from questions.json by the isolated bootstrap (see message
  // listener below). Kept as a mutable container so manual KB uploads via the
  // Settings panel can also extend it with Object.assign.
  const QUESTIONS_DB = {};

  const CRYSTALS = {
    spring_26_plaza_crystal:            10,
    spring_26_crystal_minigame_plaza:    3,
    spring_26_forest_crystal:            2,
    spring_26_crystal_minigame_forest:   3,
    spring_26_forest2_crystal:           5,
    spring_26_crystal_minigame_forest2:  3,
    spring_26_beach_crystal:             8,
    spring_26_crystal_minigame_beach:    3,
    spring_26_diamond_shop_crystal:      3,
  };

  const MOODS = [
    'noshoes_skating',
    'swim_new',
    '2023_spidercrawl_lsz',
    'bad_2022_teenwalk_dg',
    'xmas_2022_frosty_dg',
    'xmas_2022_freezing_lsz',
  ];

