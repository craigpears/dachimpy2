// The banner, drawn where this script is (`<script src="js/banner.js"></script>`): the monkey hanging from the
// treasure map's dotted trail, the X, the evening sea and the sloop; its look is css/banner.css. One drawing for
// the front page and the den's loading splash. A plain script, so it's there before the page first paints.
document.currentScript.insertAdjacentHTML('beforebegin', `<svg class="monkey-banner" viewBox="0 0 900 140" preserveAspectRatio="xMinYMid slice" role="img" aria-label="Dachimpy's Pirate Den: a monkey hanging from a treasure map's dotted trail, which ends in an X, over an evening sea with a ship">
  <defs>
    <linearGradient id="bn-sky" x2="0" y2="1"><stop offset="0" class="bn-s1"/><stop offset="1" class="bn-s2"/></linearGradient>
    <linearGradient id="bn-sea" x2="0" y2="1"><stop offset="0" class="bn-s3"/><stop offset="1" class="bn-s4"/></linearGradient>
    <radialGradient id="bn-glow"><stop offset="0" class="bn-g1"/><stop offset="1" class="bn-g2"/></radialGradient>
  </defs>
  <!-- The evening: sky, a glow low over the sea, a few stars. -->
  <rect width="900" height="140" fill="url(#bn-sky)"/>
  <ellipse cx="660" cy="98" rx="330" ry="62" fill="url(#bn-glow)"/>
  <g class="bn-stars"><circle cx="452" cy="16" r="1.3"/><circle cx="530" cy="34" r="1"/><circle cx="604" cy="12" r="1.4"/><circle cx="688" cy="28" r="1"/><circle cx="760" cy="14" r="1.2"/><circle cx="846" cy="30" r="1.4"/><circle cx="878" cy="10" r="1"/><circle cx="410" cy="40" r="1"/></g>
  <!-- The island, the old banner's cliff, its seaward face catching the glow. -->
  <path class="bn-land" d="M226 98 C 262 80 286 50 318 30 C 336 18 352 16 368 28 C 394 48 424 76 474 92 L 506 98 Z"/>
  <path class="bn-land-lit" d="M368 28 C 394 48 424 76 474 92 L 506 98 L 446 98 C 418 78 392 50 368 28 Z"/>
  <!-- The sea. -->
  <rect y="97" width="900" height="43" fill="url(#bn-sea)"/>
  <path class="bn-horizon" d="M0 97.5H900"/>
  <g class="bn-shimmer"><path d="M560 106h70M612 114h110M700 104h50M520 124h64M748 121h84M650 131h46M470 110h40"/></g>
  <!-- The ship on the right, the old banner's ring round her (green then, rose now). -->
  <g class="bn-ship">
    <ellipse class="bn-ring" cx="802" cy="110" rx="36" ry="6.5"/>
    <path class="bn-mast" d="M802 104V46"/>
    <path class="bn-sail" d="M805 50 Q 830 70 824 98 L 805 98 Z"/>
    <path class="bn-sail" d="M799 56 L 774 98 L 799 98 Z"/>
    <path class="bn-flag" d="M802 46 l 16 3.5 -16 3.5 z"/>
    <path class="bn-hull" d="M764 98 L 842 100 L 830 111 Q 802 116 776 111 Z"/>
  </g>
  <!-- The treasure map's dotted trail, from the top corner to an X. -->
  <path class="bn-trail" d="M30 -8 Q 70 26 110 24 C 160 22 182 56 230 44 S 294 6 324 30 S 344 50 352 54"/>
  <path class="bn-x-edge" d="M356 46 L 384 76 M 384 46 L 356 76"/>
  <path class="bn-x" d="M356 46 L 384 76 M 384 46 L 356 76"/>
  <text class="bn-word" x="116" y="116">Dachimpy's Pirate Den</text>
  <!-- The monkey (no hat: "my monkeys don't have hats", the user, 14 Nov), hanging from the trail by one hand, a hook for the other. -->
  <g class="bn-monkey">
    <path class="bn-limb" stroke-width="5" d="M70 114 C 92 122 102 104 93 97 C 86 92 80 100 86 104"/>
    <path class="bn-limb" stroke-width="7" d="M71 90 Q 86 58 94 25"/>
    <circle class="bn-fur" cx="94" cy="23" r="5.5"/>
    <path class="bn-limb" stroke-width="6" d="M54 116 Q 50 126 47 132"/>
    <path class="bn-limb" stroke-width="6" d="M66 116 Q 70 126 74 131"/>
    <circle class="bn-fur" cx="46" cy="133" r="4.5"/><circle class="bn-fur" cx="75" cy="132" r="4.5"/>
    <ellipse class="bn-fur" cx="60" cy="102" rx="14.5" ry="18.5"/>
    <ellipse class="bn-light" cx="61" cy="105" rx="8" ry="11"/>
    <path class="bn-limb" stroke-width="6" d="M49 91 Q 39 104 36 116"/>
    <path class="bn-hook" d="M36 117 q -3 8 3 10 q 6 1 6 -5"/>
    <circle class="bn-fur" cx="33" cy="66" r="8"/><circle class="bn-light" cx="33" cy="66" r="4.2"/>
    <circle class="bn-fur" cx="79" cy="66" r="8"/><circle class="bn-light" cx="79" cy="66" r="4.2"/>
    <circle class="bn-fur" cx="56" cy="64" r="23"/>
    <circle class="bn-light" cx="49.5" cy="62" r="8.5"/><circle class="bn-light" cx="62.5" cy="62" r="8.5"/>
    <ellipse class="bn-light" cx="56" cy="75" rx="13" ry="9"/>
    <circle class="bn-eye" cx="50" cy="63" r="3.3"/><circle class="bn-eye" cx="62" cy="63" r="3.3"/>
    <circle class="bn-glint" cx="51" cy="62" r="1.1"/><circle class="bn-glint" cx="63" cy="62" r="1.1"/>
    <circle class="bn-eye" cx="54" cy="72" r="1.1"/><circle class="bn-eye" cx="58" cy="72" r="1.1"/>
    <path class="bn-smile" d="M49 77 Q 56 84 63 77"/>
  </g>
</svg>`);
