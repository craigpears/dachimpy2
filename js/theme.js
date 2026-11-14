// The colour theme, on every page (css/site.css's themes): the one picked at the top right of the front page, kept
// in this browser, or ?theme=<name> to try one. A plain script in each page's head, so a page never flashes in the
// wrong colours (the user, 14 Nov: "the color theme and things need to carry on through the site").
(() => {
  let theme = new URLSearchParams(location.search).get('theme');
  if (!theme) { try { theme = localStorage.getItem('den.front.theme'); } catch { /* (no storage: the default) */ } }
  if (theme && theme !== 'rose') document.documentElement.dataset.theme = theme;
})();
