// 四年級第八課《四季的歌聲》寫作草稿與批改平台設定
window.SEASONS_CONFIG = {
  SUPABASE_URL: "https://ppdgubracsneozahujxl.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_4_8Lj3idSkZ0z74V4AIpRA_qqyEicMd",
  FUNCTION_NAME: "seasons-essay",
  SEAT_COUNT: 29,
  STORAGE_PREFIX: "seasons_essay_v1_draft_",
  LITERARY_TWO_CHAR_SOUNDS: ["蕭蕭", "颯颯", "淙淙", "潺潺", "濺濺", "瀝瀝"],
  FORMULA_CHIPS: {
    line5: [
      { label: "句型 A：⋯過⋯，⋯過⋯", template: "（動詞）過（地點一），（動詞）過（地點二），" },
      { label: "句型 B：從⋯出發，到⋯", template: "從（起點）出發，一路（動詞）到（終點），" }
    ],
    line6: [
      { label: "句型 A：帶著⋯", template: "帶著（數量＋物品），" },
      { label: "句型 B：像誰在⋯", template: "像（誰）在（做什麼），" },
      { label: "句型 C：變成⋯", template: "變成（數量＋物品），" }
    ],
    line7: [
      { label: "① 說話型", template: "大聲對（誰）說：「（一句話）。」" },
      { label: "② 反應型（嚇到）", template: "嚇得（誰）（做出什麼動作）。" },
      { label: "② 反應型（逗樂）", template: "逗得（誰）（做出什麼動作）。" },
      { label: "③ 送禮型", template: "把（快樂／清涼／希望）送進（哪裡）。" }
    ]
  },
  SEASONS: {
    p1: {
      key: "p1",
      tabLabel: "🌸 第一段：春天",
      name: "春天",
      wind: "東風",
      otherWinds: ["南風", "西風", "北風"],
      mood: "開心、熱鬧",
      color: "#ec4899",
      bgSoft: "#fdf2f8",
      sounds: [
        { word: "沙沙沙", zhuyin: "ㄕㄚ ㄕㄚ ㄕㄚ", desc: "花瓣或春風輕輕碰到的聲音" },
        { word: "啾啾啾", zhuyin: "ㄐㄧㄡ ㄐㄧㄡ ㄐㄧㄡ", desc: "小鳥在樹上輕輕叫" },
        { word: "吱吱喳喳", zhuyin: "ㄓ ㄓ ㄓㄚ ㄓㄚ", desc: "鳥兒聚在一起開心聊天" },
        { word: "滴滴答答", zhuyin: "ㄉㄧ ㄉㄧ ㄉㄚ ㄉㄚ", desc: "春雨一滴一滴落下來" },
        { word: "叮咚叮咚", zhuyin: "ㄉㄧㄥ ㄉㄨㄥ ㄉㄧㄥ ㄉㄨㄥ", desc: "雨滴進水窪，像門鈴響" },
        { word: "淙淙", zhuyin: "ㄘㄨㄥˊ ㄘㄨㄥˊ", desc: "小溪清脆流過石頭" },
        { word: "潺潺", zhuyin: "ㄔㄢˊ ㄔㄢˊ", desc: "溪水慢慢流動的聲音" }
      ],
      heroIdeas: ["小鳥開早會", "春雨叫醒小青草", "小溪去散步", "蜜蜂採蜜"],
      exampleLines: [
        "春天的歌聲從哪裡來？",
        "歌聲乘著（東風）而來，",
        "（沙沙沙）——",
        "春天的歌聲是（櫻花在枝頭開派對），",
        "（開滿花園，開進山林，）",
        "（飄著一朵一朵粉紅色的雪花，）",
        "（開心向我們宣布：「春天來了！」）"
      ],
      exampleTip: "把花瓣想像成粉紅雪花，最後用「說話」熱鬧迎接春天。"
    },
    p2: {
      key: "p2",
      tabLabel: "☀️ 第二段：夏天",
      name: "夏天",
      wind: "南風",
      otherWinds: ["東風", "西風", "北風"],
      mood: "嚇一跳、超有活力",
      color: "#f59e0b",
      bgSoft: "#fffbeb",
      sounds: [
        { word: "轟隆隆", zhuyin: "ㄏㄨㄥ ㄌㄨㄥˊ ㄌㄨㄥˊ", desc: "打雷低低響亮的聲音" },
        { word: "嘩啦嘩啦", zhuyin: "ㄏㄨㄚ ㄌㄚ ㄏㄨㄚ ㄌㄚ", desc: "西北雨大雨倒下來" },
        { word: "劈里啪啦", zhuyin: "ㄆㄧ ㄌㄧˇ ㄆㄚ ㄌㄚ", desc: "大雨用力打在屋頂和窗戶上" },
        { word: "濺濺", zhuyin: "ㄐㄧㄢˋ ㄐㄧㄢˋ", desc: "下雨或踩水時，水花四處噴起來" },
        { word: "撲通撲通", zhuyin: "ㄆㄨ ㄊㄨㄥ ㄆㄨ ㄊㄨㄥ", desc: "青蛙跳進池塘裡" },
        { word: "瀝瀝", zhuyin: "ㄌㄧˋ ㄌㄧˋ", desc: "細雨落下來的聲音" }
      ],
      heroIdeas: ["西北雨跳踢踏舞", "雷公用力打大鼓", "青蛙開演唱會", "小河去旅行"],
      exampleLines: [
        "夏天的歌聲從哪裡來？",
        "歌聲乘著（南風）而來，",
        "（轟隆隆）——",
        "夏天的歌聲是（雷公用力打大鼓），",
        "（閃過天際，衝破烏雲，）",
        "（舉起一根根發光的閃電鼓棒，）",
        "（把小朋友都嚇得直發抖。）"
      ],
      exampleTip: "主角用「雷公打大鼓」，再用大家「直發抖」的反應寫出夏天的震撼！"
    },
    p3: {
      key: "p3",
      tabLabel: "🍂 第三段：秋天",
      name: "秋天",
      wind: "西風",
      otherWinds: ["東風", "南風", "北風"],
      mood: "涼涼的、藏著希望",
      color: "#ea580c",
      bgSoft: "#fff7ed",
      sounds: [
        { word: "刷刷刷", zhuyin: "ㄕㄨㄚ ㄕㄨㄚ ㄕㄨㄚ", desc: "一大片落葉掃過地面" },
        { word: "颯颯", zhuyin: "ㄙㄚˋ ㄙㄚˋ", desc: "秋風快速吹過芒草和樹葉" },
        { word: "蕭蕭", zhuyin: "ㄒㄧㄠ ㄒㄧㄠ", desc: "涼涼的風吹過草木" },
        { word: "唧唧唧", zhuyin: "ㄐㄧ ㄐㄧ ㄐㄧ", desc: "蟋蟀在草叢裡唱歌" },
        { word: "咻！咻！咻！", zhuyin: "ㄒㄧㄡ ㄒㄧㄡ ㄒㄧㄡ", desc: "課文裡芒草乘風搖晃的聲音" }
      ],
      heroIdeas: ["芒草在山坡比高", "枯葉離開了大樹", "蟋蟀在草叢拉小提琴"],
      exampleLines: [
        "秋天的歌聲從哪裡來？",
        "歌聲乘著（西風）而來，",
        "（刷刷刷）——",
        "秋天的歌聲是（枯葉離開了大樹），",
        "（乘著微風，飛過操場，）",
        "（化成一顆顆希望的種子，）",
        "（悄悄飛送到人們心中。）"
      ],
      exampleTip: "不寫悲傷的秋天，把落葉想成「希望的種子」，溫柔送到人們心中。"
    },
    p4: {
      key: "p4",
      tabLabel: "❄️ 第四段：冬天",
      name: "冬天",
      wind: "北風",
      otherWinds: ["東風", "南風", "西風"],
      mood: "冷冰冰、超威風！",
      color: "#0284c7",
      bgSoft: "#f0f9ff",
      sounds: [
        { word: "呼呼呼", zhuyin: "ㄏㄨ ㄏㄨ ㄏㄨ", desc: "冷風大力吹過門窗的聲音" },
        { word: "蕭蕭", zhuyin: "ㄒㄧㄠ ㄒㄧㄠ", desc: "寒風吹過光禿禿的樹枝" },
        { word: "劈里啪啦", zhuyin: "ㄆㄧ ㄌㄧˇ ㄆㄚ ㄌㄚ", desc: "過年放鞭炮或烤火劈啪響" },
        { word: "咕咕咕", zhuyin: "ㄍㄨ ㄍㄨ ㄍㄨ", desc: "天氣好冷，肚子餓得叫起來" },
        { word: "咕嚕咕嚕", zhuyin: "ㄍㄨ ㄌㄨ ㄍㄨ ㄌㄨ", desc: "熱呼呼的火鍋滾起來" }
      ],
      heroIdeas: ["滑雪板衝下白雪山頭", "鞭炮在巷口跳起舞", "大樹在山頭抖身體", "熱湯在鍋裡滾起來"],
      warningNote: "⚠️ 第 2 句已經寫過「北風」，第 4 句要換別的主角，不要再寫北風喔！",
      exampleLines: [
        "冬天的歌聲從哪裡來？",
        "歌聲乘著（北風）而來，",
        "（呼呼呼）——",
        "冬天的歌聲是（滑雪板衝下白雪山頭），",
        "（滑過森林，飛過大地，）",
        "（幫山頂梳出一條條銀色長辮子，）",
        "（迫不及待向人們大顯威風。）"
      ],
      exampleTip: "結合課文滑雪板「梳長辮子」，避開重複北風，寫出冬天的速度與威風！"
    }
  }
};
