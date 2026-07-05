// 静的版のログイン（クライアント側でパスワード照合）。
// 注意: 静的サイトなので、このゲートは"軽い目隠し"であり本当のセキュリティではありません
// （JSを読める人はゲートも変換表も回避・閲覧できます）。
(function () {
  "use strict";

  var SALT_B64 = "djBT1ShM65C0JBQPCuCpuA==";
  var HASH_B64 = "Lkiq4YoKE3vNdSUA9FWkjVEUmyPp2QT6m/oZL7IxUKc=";
  var ITER = 100000;

  var form = document.getElementById("login-form");
  var input = document.getElementById("password");
  var errorEl = document.getElementById("login-error");
  var enterBtn = document.getElementById("enter-btn");

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }

  async function verifyPassword(pw) {
    if (!pw) return false;
    var enc = new TextEncoder();
    var km = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
    var bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: b64ToBytes(SALT_B64), iterations: ITER, hash: "SHA-256" },
      km,
      256
    );
    var actual = new Uint8Array(bits);
    var expected = b64ToBytes(HASH_B64);
    if (actual.length !== expected.length) return false;
    var diff = 0;
    for (var i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";
    enterBtn.disabled = true;
    verifyPassword(input.value)
      .then(function (ok) {
        if (ok) {
          sessionStorage.setItem("authed", "1");
          window.location.href = "app.html";
        } else {
          errorEl.textContent = "パスワードが違います。";
          input.value = "";
          input.focus();
          enterBtn.disabled = false;
        }
      })
      .catch(function () {
        errorEl.textContent = "エラーが発生しました。";
        enterBtn.disabled = false;
      });
  });
})();
