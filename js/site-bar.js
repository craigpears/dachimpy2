// The bar across the top of every page but the front page, drawn where this script is
// (`<script src="js/site-bar.js"></script>`, first thing in the body): the den's name and its sloop, home to the
// front page (the user, 14 Nov: "we also need a easy way to get back to home on each of these other pages at the
// top"); Places, What's new and How it's designed; Play the den. Its look is css/site.css. `data-static` on the
// script: it scrolls away instead of sticking, for a page with a sticky menu of its own; `data-wide`: as wide as
// a wide page (the course editor's).
(() => {
  const me = document.currentScript, here = location.pathname.split('/').pop() || 'index.html';
  const PAGES = [['index.html#places', 'Places'], ['changelog.html', "What's new"], ['design.html', "How it's designed"]];
  const links = PAGES.map(([href, name]) => (href === here ? `<a href="${href}" aria-current="page">${name}</a>` : `<a href="${href}">${name}</a>`)).join('');
  me.insertAdjacentHTML('beforebegin', `<nav class="site-bar${me.hasAttribute('data-static') ? ' static' : ''}" aria-label="The Pirate Den"${me.hasAttribute('data-wide') ? ' style="--sb-max:1280px"' : ''}><div class="sb-in">
  <a class="sb-home" href="./" aria-label="Dachimpy's Pirate Den: the front page"><svg viewBox="760 40 86 78" aria-hidden="true">
    <ellipse class="sb-ring" cx="802" cy="110" rx="36" ry="6.5"/><path class="sb-mast" d="M802 104V46"/>
    <path class="sb-sail" d="M805 50 Q 830 70 824 98 L 805 98 Z"/><path class="sb-sail" d="M799 56 L 774 98 L 799 98 Z"/>
    <path class="sb-flag" d="M802 46 l 16 3.5 -16 3.5 z"/><path class="sb-hull" d="M764 98 L 842 100 L 830 111 Q 802 116 776 111 Z"/>
  </svg><span><span class="sb-whose">Dachimpy's</span>Pirate Den</span></a>
  <div class="sb-go">${links}</div>
  <a class="sb-play" href="den.html">Play<span class="sb-the"> the den</span></a>
</div></nav>`);
})();
