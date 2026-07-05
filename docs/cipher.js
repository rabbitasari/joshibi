// 変換ロジック（serve.ps1 と同じ挙動をJSで実装）。
// 変換表は cipherdata.js から読み込み、モジュール初期化時に一度だけ解析する。
import { CIPHER_DATA } from "./cipherdata.js";

const CODE_LEN = 5;

function parseTable(raw) {
  const forward = new Map(); // 文字 -> コード
  const reverse = new Map(); // コード -> 文字
  const cats = []; // [{ name, chars: [] }]
  let maxKeyLen = 1;
  let cur = null;

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (t === "") continue;
    if (t.startsWith("#")) {
      cur = { name: t.slice(1).trim(), chars: [] };
      cats.push(cur);
      continue;
    }
    for (const tok of t.split(/\s+/)) {
      if (tok.length <= CODE_LEN) continue;
      // 形式は「文字:コード」。コードは末尾5文字、その手前の ":" を1つ除去。
      const code = tok.slice(tok.length - CODE_LEN);
      let kana = tok.slice(0, tok.length - CODE_LEN);
      if (kana.endsWith(":")) kana = kana.slice(0, -1);
      if (kana === "") continue;
      forward.set(kana, code); // 後勝ち（serve.ps1 と同じ）
      reverse.set(code, kana);
      if (kana.length > maxKeyLen) maxKeyLen = kana.length;
      if (cur) cur.chars.push(kana);
    }
  }
  return { forward, reverse, cats, maxKeyLen };
}

const T = parseTable(CIPHER_DATA);
export const categories = T.cats;

// 暗号化: 先頭から最長一致。表に無い文字は空白のみ通し、それ以外はエラー対象。
export function encrypt(text) {
  let out = "";
  const bad = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let len = T.maxKeyLen; len >= 1; len--) {
      if (i + len > text.length) continue;
      const chunk = text.slice(i, i + len);
      if (T.forward.has(chunk)) {
        out += T.forward.get(chunk);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const ch = text[i];
      if (/\s/.test(ch)) out += ch;
      else bad.push(ch);
      i++;
    }
  }
  return { result: out, bad };
}

// 復号: 先頭から5文字ずつ。コードなら文字へ、そうでなければ1文字通す。
export function decrypt(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    let consumed = false;
    if (i + CODE_LEN <= text.length) {
      const code = text.slice(i, i + CODE_LEN);
      if (T.reverse.has(code)) {
        out += T.reverse.get(code);
        i += CODE_LEN;
        consumed = true;
      }
    }
    if (!consumed) {
      out += text[i];
      i++;
    }
  }
  return out;
}
