import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SeasonKey = "p1" | "p2" | "p3" | "p4";

interface SeasonMeta {
  name: string;
  wind: string;
  otherWinds: string[];
  mood: string;
}

const SEASONS: Record<SeasonKey, SeasonMeta> = {
  p1: { name: "春天", wind: "東風", otherWinds: ["南風", "西風", "北風"], mood: "開心、熱鬧" },
  p2: { name: "夏天", wind: "南風", otherWinds: ["東風", "西風", "北風"], mood: "震撼、充滿活力" },
  p3: { name: "秋天", wind: "西風", otherWinds: ["東風", "南風", "北風"], mood: "涼爽、藏著希望" },
  p4: { name: "冬天", wind: "北風", otherWinds: ["東風", "南風", "西風"], mood: "冷冽、有氣勢" },
};

const LITERARY_TWO_CHAR_SOUNDS = new Set(["蕭蕭", "颯颯", "淙淙", "潺潺", "濺濺", "瀝瀝"]);

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  tip: string;
}

interface RuleReport {
  score: number;
  total: number;
  summary: string;
  checks: CheckItem[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function getSecretKey(): string {
  const secretJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretJson) {
    try {
      const parsed = JSON.parse(secretJson);
      if (parsed?.default) return String(parsed.default);
    } catch {
      // Fallback to legacy service role key
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function getAllowedClientKeys(): string[] {
  const keys: string[] = [];
  const pubJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (pubJson) {
    try {
      const parsed = JSON.parse(pubJson);
      Object.values(parsed).forEach((v) => {
        if (typeof v === "string" && v) keys.push(v);
      });
    } catch {
      // Ignore malformed JSON
    }
  }
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (anon) keys.push(anon);
  // 專案公開 Publishable Key（非機密）保底，避免特定執行環境未注入 JSON env 時誤擋
  keys.push("sb_publishable_4_8Lj3idSkZ0z74V4AIpRA_qqyEicMd");
  return keys;
}

function isAuthorizedClient(req: Request): boolean {
  const allowed = getAllowedClientKeys();
  if (allowed.length === 0) return true;
  const apiKey = req.headers.get("apikey") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  return allowed.includes(apiKey) || (bearer !== "" && allowed.includes(bearer));
}

function getGeminiKeys(): string[] {
  const raw = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GEMINI_API_KEYS") ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripOuterParens(text: string): string {
  return text.replace(/^[（(]+/, "").replace(/[）)]+$/, "").trim();
}

function splitPoemLines(raw: string): string[] {
  const byNewline = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (byNewline.length >= 5) return byNewline;

  const byPunctuation = raw
    .replace(/([？?！!。]|——)/g, "$1\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return byPunctuation.length > byNewline.length ? byPunctuation : byNewline;
}

function isPlaceholder(val: string): boolean {
  const cleaned = val.replace(/[（()）　\s，。？！—\-]/g, "");
  return cleaned.length === 0 || /^(狀聲詞|誰|動詞|地點|物品|一句話|寫在這裡)$/.test(cleaned);
}

/** 依《四季的歌聲》7 句結構進行確定性規則批改 */
function gradeSeasonParagraph(season: SeasonKey, rawText: string): RuleReport {
  const meta = SEASONS[season];
  const text = (rawText ?? "").trim();

  if (!text) {
    return {
      score: 0,
      total: 7,
      summary: `還沒寫${meta.name}喔！點一下「填入 7 句草稿骨架」就能開始。`,
      checks: [
        { id: "empty", label: "尚未填寫內容", passed: false, tip: `請先寫出${meta.name}的 7 句童詩草稿。` },
      ],
    };
  }

  const lines = splitPoemLines(text);
  const line1 = lines[0] ?? "";
  const line2 = lines[1] ?? "";
  const line3 = lines[2] ?? "";
  const line4Idx = lines.findIndex((l) => l.includes("的歌聲是"));
  const line4 = line4Idx >= 0 ? lines[line4Idx] : (lines[3] ?? "");
  const tailLines = line4Idx >= 0 ? lines.slice(line4Idx + 1) : lines.slice(4);

  // 1. 第 1 句：點出季節與設問
  const hasSeasonQ =
    line1.includes(meta.name) &&
    line1.includes("歌聲") &&
    (line1.includes("哪裡") || line1.includes("？") || line1.includes("?"));

  // 2. 第 2 句：季節風向（春東/夏南/秋西/冬北）
  const wrongWind = meta.otherWinds.find((w) => line2.includes(w) || (text.includes(`乘著（${w}`) || text.includes(`乘著${w}`)));
  const hasRightWind = line2.includes(meta.wind) || text.includes(`乘著（${meta.wind}`) || text.includes(`乘著${meta.wind}`);
  const windPassed = hasRightWind && !wrongWind;
  const windTip = wrongWind
    ? `「${wrongWind}」是別的季節喔！${meta.name}要乘著「${meta.wind}」而來。`
    : windPassed
      ? `第 2 句正確搭配「${meta.wind}」`
      : `第 2 句記得寫「歌聲乘著（${meta.wind}）而來，」`;

  // 3. 第 3 句：狀聲詞（三連音或四字/文言疊字）＋破折號
  const soundClean = stripOuterParens(line3.replace(/[—\-]+/g, "").replace(/[！!，,。.\s　]/g, ""));
  let soundPassed = false;
  let soundTip = "";
  if (!soundClean || isPlaceholder(soundClean) || line3.includes("歌聲是")) {
    soundTip = "第 3 句少了狀聲詞！從上方點一顆聲音按鈕，或自己寫 3 次聲音（例：沙沙沙）。";
  } else if (soundClean.length === 1) {
    soundTip = `「${soundClean}」只有 1 個字，要寫 3 次（${soundClean.repeat(3)}）才像歌聲喔！`;
  } else if (
    soundClean.length === 2 &&
    soundClean[0] === soundClean[1] &&
    !LITERARY_TWO_CHAR_SOUNDS.has(soundClean)
  ) {
    soundTip = `「${soundClean}」只寫了 2 次，單字聲音記得寫 3 次（${soundClean[0].repeat(3)}）更有節奏！`;
  } else {
    soundPassed = true;
    soundTip = line3.includes("—") || line3.includes("-")
      ? `狀聲詞「${soundClean}」節奏很棒！`
      : `狀聲詞「${soundClean}」很好，別忘了後面加上破折號「——」`;
  }

  // 4. 第 4 句：誰＋在做什麼（防名詞尾巴、防冬天重複北風）
  const afterIs = line4.includes("的歌聲是") ? line4.split("的歌聲是")[1] ?? "" : line4;
  const whoClean = stripOuterParens(afterIs.replace(/[，,。.\s　]/g, ""));
  let whoPassed = false;
  let whoTip = "";
  if (!line4.includes("歌聲是") || !whoClean || isPlaceholder(whoClean)) {
    whoTip = `第 4 句請寫「${meta.name}的歌聲是（誰＋在做什麼），」`;
  } else if (/(的聲音|聲響|聲音)$/.test(whoClean)) {
    whoTip = `「${whoClean}」是靜態名詞，請改成「誰＋在做什麼」（例如把打雷的聲音改成「雷公打大鼓」）。`;
  } else if (whoClean.length <= 2) {
    whoTip = `「${whoClean}」還少了動作喔！要寫出「誰＋在做什麼」。`;
  } else if (season === "p4" && (whoClean.includes("北風") || whoClean.includes("寒風") || whoClean.includes("冷風"))) {
    whoTip = "第 2 句已經用過「北風」了，第 4 句換別的主角（如滑雪板、鞭炮、大樹、熱湯）才不會重複！";
  } else {
    whoPassed = true;
    whoTip = `主角「${whoClean}」很有動作感！`;
  }

  // 5. 第 5 句：動起來（動作＋兩個地點）
  const l5 = stripOuterParens(tailLines[0] ?? "").replace(/[，,。.\s　]/g, "");
  const hasTwoPlacesOrActions =
    (tailLines[0] ?? "").includes("，") ||
    (tailLines[0] ?? "").includes("、") ||
    /[過進上到從穿飛跳衝滑飄開滾鑽繞吹打落]/.test(l5);
  const line5Passed = l5.length >= 5 && !isPlaceholder(l5) && hasTwoPlacesOrActions;
  const line5Tip = line5Passed
    ? "第 5 句有寫出移動與空間感"
    : "第 5 句請照公式寫出兩個動作或地點：（動詞）過（地點一），（動詞）過（地點二），";

  // 6. 第 6 句：變魔術（數量＋物品／像誰在做什麼）
  const l6 = stripOuterParens(tailLines[1] ?? "").replace(/[，,。.\s　]/g, "");
  const line6Passed = l6.length >= 4 && !isPlaceholder(l6);
  const line6Tip = line6Passed
    ? "第 6 句有把聲音變成具體畫面"
    : "第 6 句試試變魔術：寫「帶著（數量＋物品），」或「像（誰）在（做什麼），」";

  // 7. 第 7 句：留結果（說話／反應／送禮）＋結尾標點（容許句末包在括號內）
  const l7Raw = tailLines[2] ?? "";
  const l7 = stripOuterParens(l7Raw).replace(/[，,。.\s　]/g, "");
  const l7WithoutOuterParen = l7Raw.trim().replace(/[）)]+$/, "").trim();
  const endsProperly = /[。！!？」』]$/.test(l7WithoutOuterParen);
  const line7Passed = l7.length >= 4 && !isPlaceholder(l7) && endsProperly;
  const line7Tip = line7Passed
    ? "第 7 句收尾完整有畫面！"
    : l7.length < 4 || isPlaceholder(l7)
      ? "第 7 句挑一招收尾：① 對（誰）說：「…」 ② 嚇得／逗得（誰）… ③ 把（心情）送進（哪裡）。"
      : "第 7 句最後記得加上句號「。」或驚嘆號「！」收尾喔！";

  const checks: CheckItem[] = [
    { id: "q1", label: "第 1 句：季節問句", passed: hasSeasonQ, tip: hasSeasonQ ? `清楚點出${meta.name}主題` : `開頭請寫「${meta.name}的歌聲從哪裡來？」` },
    { id: "q2", label: `第 2 句：風向（${meta.wind}）`, passed: windPassed, tip: windTip },
    { id: "q3", label: "第 3 句：狀聲詞節奏", passed: soundPassed, tip: soundTip },
    { id: "q4", label: "第 4 句：誰＋在做什麼", passed: whoPassed, tip: whoTip },
    { id: "q5", label: "第 5 句：動起來（兩地點）", passed: line5Passed, tip: line5Tip },
    { id: "q6", label: "第 6 句：變魔術（畫面聯想）", passed: line6Passed, tip: line6Tip },
    { id: "q7", label: "第 7 句：挑一招收尾", passed: line7Passed, tip: line7Tip },
  ];

  const score = checks.filter((c) => c.passed).length;
  let summary = "";
  if (score === 7) summary = "🌟 太強了！7 句結構完全過關，畫面超生動！";
  else if (score >= 5) summary = `👍 很棒喔！已完成 ${score}/7 項結構，把小提醒補齊就滿分！`;
  else summary = `✏️ 目前完成 ${score}/7 項，照著下面的建議一步一步補齊就會變很棒！`;

  return { score, total: 7, summary, checks };
}

function buildRuleFallbackFeedback(season: SeasonKey, report: RuleReport, reason: "no_key" | "rate_limited"): string {
  const meta = SEASONS[season];
  const passed = report.checks.filter((c) => c.passed);
  const missed = report.checks.filter((c) => !c.passed);

  const lines: string[] = [];
  lines.push(`**🌟 做得很棒的地方**：${passed.length > 0 ? `你的${meta.name}草稿已完成 ${report.score}/7 項結構（${passed.map((p) => p.label.replace(/第 \d 句：/, "")).join("、")}都對了）！` : `你已經踏出寫${meta.name}的第一步囉！`}`);
  lines.push("");
  lines.push("**🔍 結構健檢與修改建議**：");
  if (missed.length === 0) {
    lines.push("- 7 句結構全部符合《四季的歌聲》規範，可以試著檢查標點與錯別字，讓句子更有畫面感！");
  } else {
    missed.slice(0, 3).forEach((m) => {
      lines.push(`- **${m.label}**：${m.tip}`);
    });
  }
  lines.push("");
  if (reason === "rate_limited") {
    lines.push("⏳ *目前全班同時送交人數較多，AI 錯字細批排隊中；先把上面結構修好，等 5～10 秒再按一次即可進行 AI 細批！*");
  } else {
    lines.push("💡 *（目前使用「結構規則引擎」批改；若老師後續在 Supabase Secrets 加入 `GEMINI_API_KEY`，即可同時開啟 AI 錯字檢查與仿寫示範！）*");
  }
  return lines.join("\n");
}

async function callGeminiFeedback(
  season: SeasonKey,
  studentText: string,
  report: RuleReport
): Promise<{ text: string | null; status: "ok" | "no_key" | "rate_limited" | "error" }> {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    return { text: null, status: "no_key" };
  }

  const meta = SEASONS[season];
  const ruleNotes = report.checks
    .map((c) => `- ${c.label}：${c.passed ? "通過" : `待改進（${c.tip}）`}`)
    .join("\n");

  const prompt = `你是國小四年級「秉辰師分身」，請以溫暖鼓勵、但非常簡潔的口吻（小四生看得懂，總字數控制在 180 字以內），批改學生寫的《四季的歌聲》其中一段（${meta.name}）。

【本段必須符合的 7 句結構規範】
1. 第1句（點出季節）：${meta.name}的歌聲從哪裡來？
2. 第2句（季節風向）：歌聲乘著（${meta.wind}）而來，
3. 第3句（狀聲詞）：單字聲音寫 3 次（例：沙沙沙）或 4 字／文言疊字，加破折號「——」
4. 第4句（誰＋做什麼）：${meta.name}的歌聲是（誰＋在做什麼），（不能寫「〇〇的聲音」；冬天不重複寫北風）
5. 第5句（動起來）：（動詞）過（地點一），（動詞）過（地點二），
6. 第6句（變魔術）：帶著（數量＋物品）， 或 像（誰）在（做什麼），
7. 第7句（留結果）：說話／反應／送禮 收尾，加上句號或驚嘆號。

【系統剛才幫這份草稿測出的結構檢查結果（${report.score}/7）】
${ruleNotes}

【學生目前寫的「${meta.name}」草稿】
${studentText}

請嚴格依照以下 3 段格式輸出（不要加多餘開場白）：
**🌟 做得很棒的地方**：（1 句話具體稱讚學生寫出的畫面或亮點）

**🔍 錯別字與結構建議**：
- （最多列 2～3 點：明確指出錯別字、語意不通、或上述沒通過的結構怎麼改）

**💡 秉辰師分身的升級示範**：
（沿用學生自己寫的同一個主角，改寫 1～2 句更生動的第 5～7 句給他仿寫）`;

  const models = [Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash", "gemini-2.5-flash-lite"];
  let sawRateLimit = false;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": key,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
            }),
          }
        );

        if (res.status === 429) {
          sawRateLimit = true;
          continue;
        }
        if (!res.ok) {
          continue;
        }
        const data = await res.json();
        const out = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (out) {
          return { text: out, status: "ok" };
        }
      } catch {
        continue;
      }
    }
  }

  return { text: null, status: sawRateLimit ? "rate_limited" : "error" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorizedClient(req)) {
    return jsonResponse({ error: "Invalid API key" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) {
    return jsonResponse({ error: "Server configuration missing" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await req.json();
    const action = String(body?.action ?? "");

    // --- 1. 讀取學生草稿 ---
    if (action === "load") {
      const seat = Number(body?.seat);
      if (!Number.isInteger(seat) || seat < 1 || seat > 29) {
        return jsonResponse({ error: "Invalid seat (1-29)" }, 400);
      }

      const { data, error } = await supabaseAdmin
        .from("seasons_essays")
        .select("seat, p1, p2, p3, p4, feedback, rule_reports, updated_at")
        .eq("seat", seat)
        .maybeSingle();

      if (error) return jsonResponse({ error: error.message }, 500);

      return jsonResponse({
        seat,
        content: {
          p1: data?.p1 ?? "",
          p2: data?.p2 ?? "",
          p3: data?.p3 ?? "",
          p4: data?.p4 ?? "",
        },
        feedback: data?.feedback ?? {},
        rule_reports: data?.rule_reports ?? {},
        updated_at: data?.updated_at ?? null,
      });
    }

    // --- 2. 儲存學生草稿（含防空覆蓋保護 + 即時更新結構報告） ---
    if (action === "save") {
      const seat = Number(body?.seat);
      if (!Number.isInteger(seat) || seat < 1 || seat > 29) {
        return jsonResponse({ error: "Invalid seat (1-29)" }, 400);
      }
      const incoming = body?.content ?? {};
      const activeTab = body?.active_tab as SeasonKey | undefined;

      const { data: existing } = await supabaseAdmin
        .from("seasons_essays")
        .select("p1, p2, p3, p4, feedback, rule_reports")
        .eq("seat", seat)
        .maybeSingle();

      const merged: Record<SeasonKey, string> = {
        p1: String(incoming.p1 ?? ""),
        p2: String(incoming.p2 ?? ""),
        p3: String(incoming.p3 ?? ""),
        p4: String(incoming.p4 ?? ""),
      };

      // 防誤蓋：非正在編輯的分頁若突然為空而資料庫已有內容，保留舊資料
      (["p1", "p2", "p3", "p4"] as SeasonKey[]).forEach((k) => {
        const oldVal = existing?.[k] ?? "";
        if (k !== activeTab && !merged[k].trim() && oldVal.trim()) {
          merged[k] = oldVal;
        }
      });

      const ruleReports: Record<string, RuleReport> = { ...(existing?.rule_reports ?? {}) };
      (["p1", "p2", "p3", "p4"] as SeasonKey[]).forEach((k) => {
        if (merged[k].trim()) {
          ruleReports[k] = gradeSeasonParagraph(k, merged[k]);
        } else if (k === activeTab) {
          delete ruleReports[k];
        }
      });

      const { data: savedRow, error } = await supabaseAdmin
        .from("seasons_essays")
        .upsert(
          {
            seat,
            ...merged,
            feedback: existing?.feedback ?? {},
            rule_reports: ruleReports,
          },
          { onConflict: "seat" }
        )
        .select("updated_at")
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ status: "saved", updated_at: savedRow.updated_at, rule_reports: ruleReports });
    }

    // --- 3. 自動批改與建議（免密碼：規則結構檢查 + Gemini AI 細批） ---
    if (action === "grade") {
      const seat = Number(body?.seat);
      const season = body?.season as SeasonKey;
      if (!Number.isInteger(seat) || seat < 1 || seat > 29) {
        return jsonResponse({ error: "Invalid seat (1-29)" }, 400);
      }
      if (!["p1", "p2", "p3", "p4"].includes(season)) {
        return jsonResponse({ error: "Invalid season" }, 400);
      }

      const incoming = body?.content ?? {};
      const { data: existing } = await supabaseAdmin
        .from("seasons_essays")
        .select("p1, p2, p3, p4, feedback, rule_reports")
        .eq("seat", seat)
        .maybeSingle();

      const merged: Record<SeasonKey, string> = {
        p1: String(incoming.p1 ?? ""),
        p2: String(incoming.p2 ?? ""),
        p3: String(incoming.p3 ?? ""),
        p4: String(incoming.p4 ?? ""),
      };
      (["p1", "p2", "p3", "p4"] as SeasonKey[]).forEach((k) => {
        const oldVal = existing?.[k] ?? "";
        if (k !== season && !merged[k].trim() && oldVal.trim()) {
          merged[k] = oldVal;
        }
      });

      const targetText = merged[season];
      const report = gradeSeasonParagraph(season, targetText);
      const ruleReports: Record<string, RuleReport> = { ...(existing?.rule_reports ?? {}), [season]: report };
      const feedbackDict: Record<string, string> = { ...(existing?.feedback ?? {}) };

      let aiStatus: "ok" | "no_key" | "rate_limited" | "error" | "empty" = "ok";
      let aiText = "";

      if (!targetText.trim()) {
        aiStatus = "empty";
        aiText = report.summary;
      } else {
        const aiResult = await callGeminiFeedback(season, targetText, report);
        aiStatus = aiResult.status;
        if (aiResult.text) {
          aiText = aiResult.text;
          feedbackDict[season] = aiText;
        } else {
          aiText = buildRuleFallbackFeedback(
            season,
            report,
            aiResult.status === "rate_limited" ? "rate_limited" : "no_key"
          );
          // 僅在無金鑰時把結構批改建議存進 feedback 供教師端觀看；429 則不蓋掉既有 AI 建議
          if (aiResult.status !== "rate_limited" && !feedbackDict[season]) {
            feedbackDict[season] = aiText;
          }
        }
      }

      const { data: savedRow, error } = await supabaseAdmin
        .from("seasons_essays")
        .upsert(
          {
            seat,
            ...merged,
            feedback: feedbackDict,
            rule_reports: ruleReports,
          },
          { onConflict: "seat" }
        )
        .select("updated_at")
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);

      return jsonResponse({
        status: "ok",
        ai_status: aiStatus,
        rule_report: report,
        feedback_text: aiText,
        feedback: feedbackDict,
        rule_reports: ruleReports,
        updated_at: savedRow.updated_at,
      });
    }

    // --- 4. 教師後台：驗證密碼並讀取全班 1~29 號 ---
    if (action === "teacher_list" || action === "teacher_clear") {
      const pw = String(body?.pw ?? "");
      if (!pw) return jsonResponse({ error: "unauthorized" }, 401);

      const { data: pwRow, error: pwErr } = await supabaseAdmin
        .from("teacher_config")
        .select("pw")
        .eq("pw", pw)
        .maybeSingle();

      if (pwErr || !pwRow) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }

      if (action === "teacher_clear") {
        const seat = Number(body?.seat);
        if (!Number.isInteger(seat) || seat < 1 || seat > 29) {
          return jsonResponse({ error: "Invalid seat" }, 400);
        }
        const { error: delErr } = await supabaseAdmin.from("seasons_essays").delete().eq("seat", seat);
        if (delErr) return jsonResponse({ error: delErr.message }, 500);
        return jsonResponse({ status: "cleared", seat });
      }

      const { data: rows, error } = await supabaseAdmin
        .from("seasons_essays")
        .select("seat, p1, p2, p3, p4, feedback, rule_reports, updated_at")
        .order("seat", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);

      const bySeat = new Map((rows ?? []).map((r) => [r.seat, r]));
      const students = Array.from({ length: 29 }, (_, idx) => {
        const seat = idx + 1;
        const r = bySeat.get(seat);
        return {
          seat,
          p1: r?.p1 ?? "",
          p2: r?.p2 ?? "",
          p3: r?.p3 ?? "",
          p4: r?.p4 ?? "",
          feedback: r?.feedback ?? {},
          rule_reports: r?.rule_reports ?? {},
          updated_at: r?.updated_at ?? null,
        };
      });

      return jsonResponse({
        students,
        ai_configured: getGeminiKeys().length > 0,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Bad request" }, 400);
  }
});
