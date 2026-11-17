// A prompt's words for a touch screen (RULES.md, "On a phone", 16 Nov: only what this moment needs, no keys on a
// phone). The den's prompt is written for a keyboard ("Off the den's beach · Space: go ashore · click the sea to
// drop a pin · 1: Sailing"); on a phone the prompt itself is the button that does Space (den.html), so Space's
// part says "Tap here", a click is a tap, and the parts that are only a key to press go.
const KEY = String.raw `(?:Space|Tab|Esc|Shift|Enter|Arrows|[A-Z0-9](?![A-Za-z0-9']))`;
// "1: Sailing", "Q E: fire", "1 to 3: rivals", "Space or click: pick up", "Shift or click a raider: throw".
const LEAD = new RegExp(String.raw `^(${KEY}(?:(?:, | or | / | to | )${KEY})*)(?: or (?:click|tap)( [^:]*)?)?: *(.*)$`);
/** The prompt's words for a touch screen: Space's part "Tap here: ...", "click" a tap, a key's own part gone. */
export function forTouch(text) {
    const parts = text.split(' · ').flatMap((part) => {
        const m = LEAD.exec(part);
        if (!m)
            return [part];
        const [, keys, what, rest] = m;
        if (/\bSpace\b/.test(keys))
            return [`Tap here: ${rest}`];
        if (m[0].includes(' or click') || m[0].includes(' or tap'))
            return [`Tap${what ?? ''}: ${rest}`];
        return []; // (only a key: nothing on a phone does it)
    });
    return parts.join(' · ').replace(/\bclick\b/g, 'tap').replace(/\bClick\b/g, 'Tap');
}
