// 静的版アプリ本体。変換はブラウザ内で実行（cipher.js を読み込む）。
import { encrypt, decrypt, categories } from "./cipher.js";

// 簡易ゲート（静的なので回避可能。あくまでUX用）
if (sessionStorage.getItem("authed") !== "1") {
  window.location.replace("index.html");
}

var boxTop = document.getElementById("box-top");
var boxBottom = document.getElementById("box-bottom");
var labelTop = document.getElementById("label-top");
var labelBottom = document.getElementById("label-bottom");
var swapBtn = document.getElementById("swap-btn");
var convertBtn = document.getElementById("convert-btn");
var logoutBtn = document.getElementById("logout-btn");
var errorEl = document.getElementById("convert-error");
var accordionBody = document.getElementById("char-table");

var PLAIN_LABEL = "テキストを入力";
var CIPHER_LABEL = "暗号文字列";
var reversed = false;

var CATEGORY_LABELS = {
  hiragana: "ひらがな",
  katakana_zen: "カタカナ（全角）",
  katakana_han: "カタカナ（半角）",
  alnum_zen: "英数字（全角）",
  alnum_han: "英数字（半角）",
  symbol: "記号",
};

function showError(msg) {
  errorEl.textContent = msg || "";
}

function handleConvert() {
  showError("");
  if (reversed) {
    boxBottom.value = decrypt(boxTop.value);
    return;
  }
  var res = encrypt(boxTop.value);
  if (res.bad.length > 0) {
    boxBottom.value = "";
    var uniq = [];
    for (var i = 0; i < res.bad.length; i++) if (uniq.indexOf(res.bad[i]) === -1) uniq.push(res.bad[i]);
    showError("対応していない文字が使われています：" + uniq.join(" "));
  } else {
    boxBottom.value = res.result;
  }
}

function handleSwap() {
  reversed = !reversed;
  showError("");
  if (reversed) {
    labelTop.textContent = CIPHER_LABEL;
    labelBottom.textContent = PLAIN_LABEL;
  } else {
    labelTop.textContent = PLAIN_LABEL;
    labelBottom.textContent = CIPHER_LABEL;
  }
  var tmp = boxTop.value;
  boxTop.value = boxBottom.value;
  boxBottom.value = tmp;
}

function handleLogout() {
  sessionStorage.removeItem("authed");
  window.location.href = "index.html";
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCharset() {
  if (!accordionBody) return;
  var html = "";
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    if (!cat.chars || cat.chars.length === 0) continue;
    var label = CATEGORY_LABELS[cat.name] || cat.name;
    html += '<details class="sub-accordion">';
    html +=
      '<summary class="sub-title">' +
      escapeHtml(label) +
      ' <span class="sub-count">(' +
      cat.chars.length +
      ")</span></summary>";
    html += '<div class="sub-body"><div class="char-grid">';
    for (var j = 0; j < cat.chars.length; j++) {
      html += '<span class="char-cell">' + escapeHtml(cat.chars[j]) + "</span>";
    }
    html += "</div></div></details>";
  }
  if (html === "") html = '<p class="accordion-placeholder">（未登録）</p>';
  accordionBody.innerHTML = html;
}

swapBtn.addEventListener("click", handleSwap);
convertBtn.addEventListener("click", handleConvert);
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

renderCharset();
