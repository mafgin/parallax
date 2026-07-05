/**
 * Options: a reading-language default, an engine override, and the anonymous
 * usage-statistics opt-out. Stored in browser.storage.local. No secrets, no
 * tokens — there is no backend beyond the anonymous stats counter.
 */
const $reading = document.getElementById("reading-lang");
const $provider = document.getElementById("provider");
const $stats = document.getElementById("stats");
const $save = document.getElementById("save-btn");
const $status = document.getElementById("status");

async function load() {
  const { wlReadingLang, wlProvider, wlStatsEnabled } = await browser.storage.local.get([
    "wlReadingLang",
    "wlProvider",
    "wlStatsEnabled",
  ]);
  if (wlReadingLang) $reading.value = wlReadingLang;
  if (wlProvider) $provider.value = wlProvider;
  $stats.checked = wlStatsEnabled !== false; // default on
}

async function save() {
  await browser.storage.local.set({
    wlReadingLang: $reading.value,
    wlProvider: $provider.value,
    wlStatsEnabled: $stats.checked,
  });
  $status.textContent = "saved";
  $status.className = "status ok";
  setTimeout(() => {
    $status.textContent = "";
    $status.className = "status";
  }, 1500);
}

$save.addEventListener("click", save);
load();
