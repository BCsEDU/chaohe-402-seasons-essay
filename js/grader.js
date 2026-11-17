// 《四季的歌聲》7 句結構規則批改引擎（與 Edge Function 同步規則，供即時離線檢查與保底建議使用）
window.SeasonsGrader = (function () {
  function stripOuterParens(text) {
    return String(text || "").replace(/^[（(]+/, "").replace(/[）)]+$/, "").trim();
  }

  function splitPoemLines(raw) {
    const byNewline = String(raw || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (byNewline.length >= 5) return byNewline;

    const byPunctuation = String(raw || "")
      .replace(/([？?！!。]|——)/g, "$1\n")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return byPunctuation.length > byNewline.length ? byPunctuation : byNewline;
  }

  function isPlaceholder(val) {
    const cleaned = String(val || "").replace(/[（()）　\s，。？！—\-]/g, "");
    return cleaned.length === 0 || /^(狀聲詞|誰|動詞|地點|物品|一句話|寫在這裡)$/.test(cleaned);
  }

  function grade(seasonKey, rawText) {
    const meta = window.SEASONS_CONFIG.SEASONS[seasonKey];
    const literaryTwoChar = new Set(window.SEASONS_CONFIG.LITERARY_TWO_CHAR_SOUNDS);
    const text = String(rawText || "").trim();

    if (!text) {
      return {
        score: 0,
        total: 7,
        summary: `還沒寫${meta.name}喔！點一下「填入 7 句草稿骨架」就能開始。`,
        checks: [{ id: "empty", label: "尚未填寫內容", passed: false, tip: `請先寫出${meta.name}的 7 句童詩草稿。` }]
      };
    }

    const lines = splitPoemLines(text);
    const line1 = lines[0] || "";
    const line2 = lines[1] || "";
    const line3 = lines[2] || "";
    const line4Idx = lines.findIndex((l) => l.includes("的歌聲是"));
    const line4 = line4Idx >= 0 ? lines[line4Idx] : (lines[3] || "");
    const tailLines = line4Idx >= 0 ? lines.slice(line4Idx + 1) : lines.slice(4);

    // 1. 第 1 句：季節問句
    const hasSeasonQ =
      line1.includes(meta.name) &&
      line1.includes("歌聲") &&
      (line1.includes("哪裡") || line1.includes("？") || line1.includes("?"));

    // 2. 第 2 句：季節風向
    const wrongWind = meta.otherWinds.find((w) => line2.includes(w) || text.includes(`乘著（${w}`) || text.includes(`乘著${w}`));
    const hasRightWind = line2.includes(meta.wind) || text.includes(`乘著（${meta.wind}`) || text.includes(`乘著${meta.wind}`);
    const windPassed = hasRightWind && !wrongWind;
    const windTip = wrongWind
      ? `「${wrongWind}」是別的季節喔！${meta.name}要乘著「${meta.wind}」而來。`
      : windPassed
        ? `第 2 句正確搭配「${meta.wind}」`
        : `第 2 句記得寫「歌聲乘著（${meta.wind}）而來，」`;

    // 3. 第 3 句：狀聲詞
    const soundClean = stripOuterParens(line3.replace(/[—\-]+/g, "").replace(/[！!，,。.\s　]/g, ""));
    let soundPassed = false;
    let soundTip = "";
    if (!soundClean || isPlaceholder(soundClean) || line3.includes("歌聲是")) {
      soundTip = "第 3 句少了狀聲詞！從上方點一顆聲音按鈕，或自己寫 3 次聲音（例：沙沙沙）。";
    } else if (soundClean.length === 1) {
      soundTip = `「${soundClean}」只有 1 個字，要寫 3 次（${soundClean.repeat(3)}）才像歌聲喔！`;
    } else if (soundClean.length === 2 && soundClean[0] === soundClean[1] && !literaryTwoChar.has(soundClean)) {
      soundTip = `「${soundClean}」只寫了 2 次，單字聲音記得寫 3 次（${soundClean[0].repeat(3)}）更有節奏！`;
    } else {
      soundPassed = true;
      soundTip = line3.includes("—") || line3.includes("-")
        ? `狀聲詞「${soundClean}」節奏很棒！`
        : `狀聲詞「${soundClean}」很好，別忘了後面加上破折號「——」`;
    }

    // 4. 第 4 句：誰＋在做什麼
    const afterIs = line4.includes("的歌聲是") ? (line4.split("的歌聲是")[1] || "") : line4;
    const whoClean = stripOuterParens(afterIs.replace(/[，,。.\s　]/g, ""));
    let whoPassed = false;
    let whoTip = "";
    if (!line4.includes("歌聲是") || !whoClean || isPlaceholder(whoClean)) {
      whoTip = `第 4 句請寫「${meta.name}的歌聲是（誰＋在做什麼），」`;
    } else if (/(的聲音|聲響|聲音)$/.test(whoClean)) {
      whoTip = `「${whoClean}」是靜態名詞，請改成「誰＋在做什麼」（例如：雷公打大鼓）。`;
    } else if (whoClean.length <= 2) {
      whoTip = `「${whoClean}」還少了動作喔！要寫出「誰＋在做什麼」。`;
    } else if (seasonKey === "p4" && (whoClean.includes("北風") || whoClean.includes("寒風") || whoClean.includes("冷風"))) {
      whoTip = "第 2 句已經用過「北風」了，第 4 句換別的主角（如滑雪板、鞭炮、大樹、熱湯）才不會重複！";
    } else {
      whoPassed = true;
      whoTip = `主角「${whoClean}」很有動作感！`;
    }

    // 5. 第 5 句：動起來
    const l5 = stripOuterParens(tailLines[0] || "").replace(/[，,。.\s　]/g, "");
    const hasTwoPlacesOrActions =
      (tailLines[0] || "").includes("，") ||
      (tailLines[0] || "").includes("、") ||
      /[過進上到從穿飛跳衝滑飄開滾鑽繞吹打落]/.test(l5);
    const line5Passed = l5.length >= 5 && !isPlaceholder(l5) && hasTwoPlacesOrActions;
    const line5Tip = line5Passed
      ? "第 5 句有寫出移動與空間感"
      : "第 5 句請照公式寫出兩個動作或地點：（動詞）過（地點一），（動詞）過（地點二），";

    // 6. 第 6 句：變魔術
    const l6 = stripOuterParens(tailLines[1] || "").replace(/[，,。.\s　]/g, "");
    const line6Passed = l6.length >= 4 && !isPlaceholder(l6);
    const line6Tip = line6Passed
      ? "第 6 句有把聲音變成具體畫面"
      : "第 6 句試試變魔術：寫「帶著（數量＋物品），」或「像（誰）在（做什麼），」";

    // 7. 第 7 句：挑一招收尾
    const l7Raw = tailLines[2] || "";
    const l7 = stripOuterParens(l7Raw).replace(/[，,。.\s　]/g, "");
    const l7WithoutOuterParen = l7Raw.trim().replace(/[）)]+$/, "").trim();
    const endsProperly = /[。！!？」』]$/.test(l7WithoutOuterParen);
    const line7Passed = l7.length >= 4 && !isPlaceholder(l7) && endsProperly;
    const line7Tip = line7Passed
      ? "第 7 句收尾完整有畫面！"
      : l7.length < 4 || isPlaceholder(l7)
        ? "第 7 句挑一招收尾：① 對（誰）說：「…」 ② 嚇得／逗得（誰）… ③ 把（心情）送進（哪裡）。"
        : "第 7 句最後記得加上句號「。」或驚嘆號「！」收尾喔！";

    const checks = [
      { id: "q1", label: "第 1 句：季節問句", passed: hasSeasonQ, tip: hasSeasonQ ? `清楚點出${meta.name}主題` : `開頭請寫「${meta.name}的歌聲從哪裡來？」` },
      { id: "q2", label: `第 2 句：風向（${meta.wind}）`, passed: windPassed, tip: windTip },
      { id: "q3", label: "第 3 句：狀聲詞節奏", passed: soundPassed, tip: soundTip },
      { id: "q4", label: "第 4 句：誰＋在做什麼", passed: whoPassed, tip: whoTip },
      { id: "q5", label: "第 5 句：動起來（兩地點）", passed: line5Passed, tip: line5Tip },
      { id: "q6", label: "第 6 句：變魔術（畫面聯想）", passed: line6Passed, tip: line6Tip },
      { id: "q7", label: "第 7 句：挑一招收尾", passed: line7Passed, tip: line7Tip }
    ];

    const score = checks.filter((c) => c.passed).length;
    let summary = "";
    if (score === 7) summary = "🌟 太強了！7 句結構完全過關，畫面超生動！";
    else if (score >= 5) summary = `👍 很棒喔！已完成 ${score}/7 項結構，把小提醒補齊就滿分！`;
    else summary = `✏️ 目前完成 ${score}/7 項，照著下面的建議一步一步補齊就會變很棒！`;

    return { score, total: 7, summary, checks };
  }

  function buildSkeleton(seasonKey, soundWord = "") {
    const meta = window.SEASONS_CONFIG.SEASONS[seasonKey];
    const soundSlot = soundWord ? `（${soundWord}）——` : "（　　　）——";
    return [
      `${meta.name}的歌聲從哪裡來？`,
      `歌聲乘著（${meta.wind}）而來，`,
      soundSlot,
      `${meta.name}的歌聲是（　　　　　），`,
      "（　　　　　　　，）",
      "（　　　　　　　，）",
      "（　　　　　　　。）"
    ].join("\n");
  }

  function buildOfflineFeedbackMarkdown(seasonKey, report, noteMsg) {
    const meta = window.SEASONS_CONFIG.SEASONS[seasonKey];
    const passed = report.checks.filter((c) => c.passed);
    const missed = report.checks.filter((c) => !c.passed);

    const lines = [];
    lines.push(
      `**🌟 做得很棒的地方**：${
        passed.length > 0
          ? `你的${meta.name}草稿已完成 ${report.score}/7 項結構（${passed.map((p) => p.label.replace(/第 \d 句：/, "")).join("、")}都對了）！`
          : `你已經踏出寫${meta.name}的第一步囉！`
      }`
    );
    lines.push("");
    lines.push("**🔍 結構健檢與修改建議**：");
    if (missed.length === 0) {
      lines.push("- 7 句結構全部符合《四季的歌聲》規範，再檢查有沒有錯別字就能抄進學習單囉！");
    } else {
      missed.slice(0, 3).forEach((m) => {
        lines.push(`- **${m.label}**：${m.tip}`);
      });
    }
    if (noteMsg) {
      lines.push("");
      lines.push(`*${noteMsg}*`);
    }
    return lines.join("\n");
  }

  return { grade, buildSkeleton, buildOfflineFeedbackMarkdown };
})();
