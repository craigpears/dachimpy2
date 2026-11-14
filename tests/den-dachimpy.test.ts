/* Dachimpy's house, which doubles as a museum (13 Nov: "my museum house idea ... Definitely seems [ready]";
   IDEAS.md, "A museum, in Dachimpy's house"). */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PLAN, ARRIVE, WALLS, EXHIBITS, hang, shotSize, SHOT_MAX, PAGE, exhibitLine, FRIENDS, FRIENDS_WALL, FURNISH,
  COOKIES, atCookies, TOUR, stopAt, HUG, COOKIE, hugSpot, SHELF, MUSEUM_LEN, IN_RED, MONKEY_MAN, IN_RAGS, IN_PINK_COAT,
} from '../src/den-dachimpy';
import { houseById, houseList, walkable, atWayOut, step, blocksOf, BACKDROPS, lookingAt, lookView, viewAt, LOOK_HOME, remark, GAZE_START, roomAt } from '../src/den-houses';
import type { View, Gaze } from '../src/den-houses';
import { AT_THE_DOOR, THE_COOKIE, ANOTHER_COOKIE, TOUR_LINES, PLAQUES, PANELS, ON_AN_EXHIBIT, ON_A_FRIEND, FRIEND_TITLES, THANKS, EVERYONE, CHARACTER, GOODBYE } from '../src/lines/dachimpy';
import { IN_DACHIMPYS_HOUSE } from '../src/lines/you';

const ROOT = join(__dirname, '..');
const LOOK_JS = readFileSync(join(ROOT, 'js', 'den-look.js'), 'utf8').replace(/\r\n/g, '\n');
const FURNITURE_JS = readFileSync(join(ROOT, 'js', 'den', 'furniture.js'), 'utf8');
const partsOf = (slot: string) => {
  const m = LOOK_JS.match(new RegExp(`\\n  ${slot}: \\{\\n    m: \\[([\\s\\S]*?)\\],\\n    f: \\[([\\s\\S]*?)\\],\\n  \\}`))!;
  return [...(m[1] + m[2]).matchAll(/\['([a-z]+)'/g)].map((x) => x[1]);
};
const [HALL, MUSEUM, FRIENDS_ROOM] = PLAN.rooms;
const H = hang();
/** A JPEG's size, from its SOF marker. */
function jpegSize(file: string): [number, number] {
  const b = readFileSync(file);
  expect(b[0] === 0xff && b[1] === 0xd8, `${file} is a JPEG`).toBe(true);
  for (let i = 2; i < b.length;) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [0, 0];
}

describe('their house in the district, which doubles as the museum', () => {
  it('is on the list by their name, and the house shell plays it', () => {
    expect(houseById('dachimpy')).toMatchObject({ owner: 'Dachimpy' });
    expect(houseList().map((h) => h.owner)).toContain('Dachimpy');
    expect(readFileSync(join(ROOT, 'js', 'den', 'house.js'), 'utf8')).toMatch(/dachimpy: DACHIMPY_HOUSE/);
  });

  it('has the hall, the museum and the friends\' room in a row, a doorway between each, walked end to end', () => {
    expect(PLAN.rooms.map((r) => r.id)).toEqual(['hall', 'museum', 'friends']);
    expect(walkable(PLAN, ARRIVE.you.x, ARRIVE.you.z)).toBe(true);
    expect(walkable(PLAN, ARRIVE.them.x, ARRIVE.them.z)).toBe(true);
    expect(atWayOut(PLAN, ARRIVE.you.x, ARRIVE.you.z + 0.3)).toBe(true);
    const B = blocksOf(FURNISH);
    let x: number = ARRIVE.you.x, z = 0;
    for (let i = 0; i < 2000 && x < FRIENDS_ROOM.x1 - 0.6; i++) [x, z] = step(PLAN, x, z, x + 0.05, z, B);
    expect(x).toBeGreaterThanOrEqual(FRIENDS_ROOM.x1 - 0.61);
    expect(roomAt(PLAN, x, z)?.id).toBe('friends');
  });

  it('places only furniture the shared furniture module makes, each in a room, none in your way at the door', () => {
    for (const p of FURNISH) {
      expect(FURNITURE_JS, p.kind).toMatch(new RegExp(`export const FURNITURE = \\{[^}]*\\b${p.kind}\\b`));
      expect(PLAN.rooms.some((r) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1), `${p.kind} at ${p.x},${p.z}`).toBe(true);
    }
    const B = blocksOf(FURNISH);
    for (const b of B) expect(Math.hypot(b.x - ARRIVE.you.x, b.z - ARRIVE.you.z)).toBeGreaterThan(b.r + 0.5);
    // the trinkets' shelf stands against the friends' room's right-hand wall, facing in
    expect(FRIENDS_ROOM.x1 - SHELF.x).toBeLessThan(0.6);
  });
});

describe('the museum: the old Blockade Simulator and Dachimpy.com, in order (the pictures in notes/museum/)', () => {
  it('shows every screenshot, published as a JPG no wider than 1280, its size as the data says', () => {
    const shots = EXHIBITS.filter((e) => e.kind === 'shot');
    expect(shots).toHaveLength(21);
    for (const s of shots) {
      if (s.kind !== 'shot') continue;
      const file = join(ROOT, s.file);
      expect(existsSync(file), s.file).toBe(true);
      expect(s.file).toMatch(/^museum\/[0-9]{2}-[a-z0-9-]+\.jpg$/);
      const [w, h] = jpegSize(file);
      expect([w, h], s.file).toEqual([...s.px]);
      expect(w).toBeLessThanOrEqual(1280);
    }
  });

  it('publishes museum/ with the site, and keeps notes/ unpublished', () => {
    const ignore = readFileSync(join(ROOT, '.assetsignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
    expect(ignore).toContain('notes');
    expect(ignore.some((l) => /^\/?museum/.test(l))).toBe(false);
  });

  it('keeps them in order, as numbered, down the museum', () => {
    const inMuseum = EXHIBITS.filter((e) => H[e.id].room === 'museum');
    const xs = inMuseum.map((e) => H[e.id].x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    const files = inMuseum.flatMap((e) => (e.kind === 'shot' ? [e.file] : []));
    expect([...files].sort()).toEqual(files);
    expect(inMuseum[0].id).toBe('guide');
    expect(inMuseum[inMuseum.length - 1].id).toBe('gone');
    // the hall: where it began (the banner and the title card moved on, to where the donation paid for them)
    expect(EXHIBITS.filter((e) => H[e.id].room === 'hall').map((e) => e.id)).toEqual(['began']);
  });

  it('hangs each in its room, along its back wall, none overlapping, under the ceiling', () => {
    for (const room of ['hall', 'museum']) {
      const R = PLAN.rooms.find((r) => r.id === room)!;
      const hung = Object.entries(H).filter(([, h]) => h.room === room).map(([id, h]) => ({ id, ...h }));
      for (const h of hung) {
        expect(h.x - h.w / 2, h.id).toBeGreaterThan(R.x0 + 0.3);
        expect(h.x + h.w / 2, h.id).toBeLessThan(R.x1 - 0.3);
        expect(h.y + h.h / 2 + 0.15, h.id).toBeLessThan(WALLS.high);
        if (h.card) expect(h.card.y - h.card.h / 2, `${h.id}'s plaque, above the wainscot`).toBeGreaterThan(0.88);
      }
      // side by side (the banner's over the others, so not counted)
      const row = [...hung].sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) {
        const a = row[i - 1], b = row[i], wa = Math.max(a.w, a.card?.w ?? 0), wb = Math.max(b.w, b.card?.w ?? 0);
        expect(b.x - wb / 2 - 0.2, `${a.id} | ${b.id}`).toBeGreaterThan(a.x + wa / 2);
      }
    }
    // the museum's long enough for them all, and not much more
    const last = Math.max(...Object.values(H).filter((h) => h.room === 'museum').map((h) => h.x + h.w / 2));
    expect(MUSEUM.x1 - last).toBeGreaterThan(0.6);
    expect(MUSEUM.x1 - last).toBeLessThan(3);
    expect(MUSEUM.x1 - MUSEUM.x0).toBe(MUSEUM_LEN);
  });

  it('sizes each screenshot its own shape, within the biggest a frame is', () => {
    for (const e of EXHIBITS) {
      if (e.kind !== 'shot' || H[e.id].room !== 'museum') continue;
      const s = shotSize(e.px);
      expect(s.w / s.h).toBeCloseTo(e.px[0] / e.px[1], 5);
      expect(s.w).toBeLessThanOrEqual(SHOT_MAX.w + 1e-9);
      expect(s.h).toBeLessThanOrEqual(SHOT_MAX.h + 1e-9);
    }
    expect(PAGE.w / PAGE.h).toBeCloseTo(256 / 320, 5);   // (a page is painted as a portrait's canvas is)
  });

  it('gives every screenshot a plaque in Dachimpy\'s voice, and every panel its story', () => {
    for (const e of EXHIBITS) {
      if (e.kind === 'shot') {
        expect((PLAQUES as Record<string, string>)[e.id], e.id).toBeTruthy();
        expect((PLAQUES as Record<string, string>)[e.id].length, e.id).toBeLessThan(230);   // (a card under a frame)
        expect(H[e.id].card, e.id).not.toBeNull();
      } else {
        expect((PANELS as Record<string, { title: string; text: string }>)[e.id].text.length, e.id).toBeLessThan(330);
      }
    }
  });

  it('has Dachimpy say a line about whichever you stop by (once a visit), and under it close up', () => {
    const exhibits = Object.entries(H).map(([id, h]) => ({ id, x: h.x, y: h.y, z: h.wall }));
    for (const e of exhibits) {
      expect(exhibitLine(e.id), e.id).toBe((ON_AN_EXHIBIT as Record<string, string>)[e.id]);
      expect(exhibitLine(e.id)!.length).toBeLessThan(110);   // (a bubble)
      const R = PLAN.rooms.find((r) => r.id === H[e.id].room)!;
      const you = { x: e.x, z: R.z0 + 1.0 };
      const v: View = lookView({ look: { x: you.x, y: 0.85, z: you.z - 1.2 }, dist: 9, tilt: 0.7, yaw: 0 }, you, LOOK_HOME, R, WALLS.high);
      const cam = viewAt(v), dir = { x: v.look.x - cam.x, y: v.look.y - cam.y, z: v.look.z - cam.z };
      expect(lookingAt(exhibits, you, cam, dir)?.id, e.id).toBe(e.id);
      let G: Gaze = GAZE_START;
      const said: string[] = [];
      for (let t = 0; t < 3; t += 0.1) { const r = remark(G, e.id, 0.1, true, true, exhibitLine); G = r.gaze; if (r.say) said.push(r.say); }
      expect(said).toEqual([exhibitLine(e.id)]);
    }
    expect(exhibitLine('nobody')).toBeNull();
  });

  it('is fond of the bugs (11 Nov: "the bugs are what made it"), and deadpan about the one that works', () => {
    expect(PLAQUES.inPlay).toMatch(/rocks/);
    expect(PANELS.gone.text).toMatch(/works perfectly/);
    expect(PLAQUES.jobbers).toMatch(/too complicated/i);
    expect(PLAQUES.inPlay).toMatch(/13 April 2010/);
    expect(FURNISH.find((p) => p.kind === 'simModel')?.x).toBe(H.inPlay.x);
  });

  it('starts where it all started: watching Dlonelyone teach a new pirate, and Dachimpy.com their own way of helping', () => {
    expect(PANELS.began.title).toBe('Did you know?');
    expect(PANELS.began.text).toMatch(/Dlonelyone/);
    expect(PANELS.began.text).toMatch(/Helping people learn/);
    // (14 Nov: "I don't think that's a representation of me ... it wasn't a good fit for me. So this is what I did
    // instead": no bravery or lack of confidence in it)
    expect(PANELS.began.text).not.toMatch(/brave|confiden|shy|afraid/i);
  });

  it('runs in the order the user told it (14 Nov): the Bnav Guide, the first Flash try, the boards before Whirled, the first set-up screen, Team One, the donation and what it paid for, the refined lobby, Whirled, the finished thing, then the site\'s versions', () => {
    const order = EXHIBITS.map((e) => e.id);
    expect(order).toEqual([
      'began', 'guide', 'shootDalnoth', 'traverses', 'first', 'beforeWhirled', 'jobbers', 'setup', 'teams',
      'donation', 'banner', 'titleCard', 'rotations', 'rings', 'lobby', 'create', 'inPlay',
      'siteV2', 'siteV3', 'siteV4', 'siteV5', 'siteLatest', 'dalnothApp', 'gone',
    ]);
    // the first set-up screen is "not even a wireframe, that is just the first version"
    expect(EXHIBITS.find((e) => e.id === 'setup')!.title).not.toMatch(/wireframe/i);
    expect(PLAQUES.setup).toMatch(/first version/i);
    expect(PLAQUES.setup).not.toMatch(/^[^!]*plan/i);
    // the banner, the title card and the sloops told with the donation that paid for them
    expect(PANELS.donation.text).toMatch(/hundred quid/);
    for (const id of ['banner', 'titleCard', 'rotations'] as const) expect(PLAQUES[id], id).toMatch(/gift|by hand/);
    expect(PLAQUES.rotations).toMatch(/game's own files/);
  });

  it('shoots Dalnoth in the site\'s first version and to its last ("it\'s become tradition", 14 Nov)', () => {
    expect(PLAQUES.shootDalnoth).toMatch(/Dalnoth/);
    expect(PLAQUES.shootDalnoth).toMatch(/[Tt]radition/);
    expect(PLAQUES.traverses).toMatch(/Dalnoth/);
    expect(PLAQUES.dalnothApp).toMatch(/Dalnoth/);
    const at = (id: string) => EXHIBITS.findIndex((e) => e.id === id);
    expect(at('shootDalnoth')).toBe(at('guide') + 1);
    expect(at('dalnothApp')).toBe(at('siteLatest') + 1);
  });

  it('shows only the pirate name Dachimpy: no real names, e-mails or other people\'s handles', () => {
    const all = JSON.stringify({ PLAQUES, PANELS, ON_AN_EXHIBIT, ON_A_FRIEND, FRIEND_TITLES, THANKS, CHARACTER });
    expect(all).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
    expect(all).not.toMatch(/Wolfi|Pears|nickbush|Wyriel|Natacha|ajmukemo|timdc|github\.io/i);
  });
});

describe('Dachimpy\'s voice: buzzy and excited first, the wry line after (the user, 14 Nov: "We can have both")', () => {
  /** A line's first sentence (a stop and a space ends one; "Dachimpy.com" doesn't). */
  const first = (s: string) => s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s;
  it('opens every line they say, and every plaque, with an excited one', () => {
    const lines: string[] = [
      ...Object.values(AT_THE_DOOR), THE_COOKIE.first, ...THE_COOKIE.again, THE_COOKIE.onward, ...ANOTHER_COOKIE,
      ...Object.values(TOUR_LINES).map((l) => l[0]), ...Object.values(PLAQUES), ...Object.values(ON_AN_EXHIBIT),
      ...Object.values(ON_A_FRIEND), GOODBYE,
    ];
    for (const l of lines) expect(first(l), l).toMatch(/!$/);
  });
  it('keeps a wry line after, here and there (the user: "people say it fits me still")', () => {
    expect(ANOTHER_COOKIE.join(' ')).toMatch(/I'm not counting\. I am counting/);
    expect(ON_AN_EXHIBIT.gone).toMatch(/Shame, really/);
  });
});

describe('their friends\' room: the trinkets and the portraits (IDEAS.md, "The tribute moves home")', () => {
  it('paints only pirates whose looks are in PIRATES (with Dachimpy beside them), pirate names only; anyone else a titled page', () => {
    const pirates = LOOK_JS.match(/export const PIRATES = [\s\S]*?\n\}\)/)![0];
    for (const f of FRIENDS) {
      expect(f.title).toBe(FRIEND_TITLES[f.id]);
      expect(ON_A_FRIEND[f.id].length, f.id).toBeLessThan(110);
      expect(exhibitLine(f.id)).toBe(ON_A_FRIEND[f.id]);
      if (f.portrait) {
        expect(f.portrait.sitter.who).toBe('pirate');
        const s = f.portrait.sitter.who === 'pirate' ? f.portrait.sitter : null;
        for (const name of [s!.name, ...(s!.company ?? []).map((c) => c.name ?? '')]) expect(pirates, name).toMatch(new RegExp(`\\n  ${name}: \\{`));
        expect(BACKDROPS).toContain(f.portrait.backdrop);
      } else expect(['welcomeBack', 'everyone', 'thanks']).toContain(f.page);
    }
    // (Fable's look isn't known: "Welcome Back Dachimpy!" is its title on a page, no figure)
    expect(FRIENDS.find((f) => f.id === 'welcomeBack')).toMatchObject({ page: 'welcomeBack' });
  });

  it('recreates Dachimpy\'s own portraits with friends under their real titles (IDEAS.md, both oceans, 13 Nov)', () => {
    expect(FRIEND_TITLES.gravee).toBe('Oh, Gawd!');
    expect(FRIEND_TITLES.kikkit).toMatch(/Cursed & Cookied/);
    expect(FRIEND_TITLES.sanne).toMatch(/Monkey Couple/);
    expect(FRIEND_TITLES.zizzy).toMatch(/Pinky and the Pink/);
    expect(FRIEND_TITLES.welcomeBack).toBe('Welcome Back Dachimpy!');
    for (const id of ['gravee', 'kikkit', 'zizzy', 'sanne'] as const) {
      const s = FRIENDS.find((f) => f.id === id)!.portrait!.sitter;
      expect(s.who === 'pirate' && s.company?.[0], id).toMatchObject({ kind: 'pirate', name: 'Dachimpy' });
    }
  });

  it('labels no one special, everybody\'s special (14 Nov: "I\'m feeling a bit bad about having a few people in my house that are labelled as the special ones, because everybody\'s special"): the closest in the middle, bigger, Daquan at its centre', () => {
    const middle = FRIENDS.filter((f) => f.middle).map((f) => f.id);
    expect(middle).toEqual(['kikkit', 'zizzy', 'daquan', 'sanne', 'whiterose']);
    const mid = (FRIENDS_ROOM.x0 + FRIENDS_ROOM.x1) / 2;
    expect(FRIENDS.find((f) => f.id === 'daquan')!.x).toBeCloseTo(mid, 5);   // ("my partner in crime through the whole thing")
    for (const f of FRIENDS) {
      if (f.middle) { expect(Math.abs(f.x - mid)).toBeLessThan(3); continue; }
      for (const s of FRIENDS.filter((g) => g.middle)) expect(s.w * s.h).toBeGreaterThan(f.w * f.h);
    }
    // no sign, and no "truly special" anywhere in what Dachimpy says or hangs
    const all = JSON.stringify({ TOUR_LINES, ON_A_FRIEND, FRIEND_TITLES, THANKS, EVERYONE });
    expect(all).not.toMatch(/special ones|truly special/i);
    expect(TOUR_LINES.friends.join(' ')).toMatch(/Everyone on these walls is special/);
    expect(readFileSync(join(ROOT, 'js', 'den', 'dachimpy-house.js'), 'utf8')).not.toMatch(/FURNITURE\.sign|SPECIAL/);
    expect(ON_A_FRIEND.daquan).toMatch(/partner in crime/);
  });

  it('gives Whiterose a frame of her own (14 Nov: "she would switch from Vanguard and play the other side ... miss you whiterose!"), Gravee and Balloffire theirs, and a page for everyone they blockaded with', () => {
    for (const id of ['whiterose', 'gravee', 'balloffire', 'daquan'] as const) expect(FRIENDS.find((f) => f.id === id)?.portrait, id).toBeTruthy();
    expect(ON_A_FRIEND.whiterose).toMatch(/Vanguard/);
    expect(ON_A_FRIEND.whiterose).toMatch(/Miss you, Whiterose!/);
    expect(FRIENDS.find((f) => f.id === 'everyone')).toMatchObject({ page: 'everyone' });
    expect(EVERYONE).toMatch(/whatever you're called now/);
    expect(EVERYONE).toMatch(/Mems/);
    expect(EVERYONE).toMatch(/You're here!/);
    // Daquan in "Scabard's group", beside Dachimpy, under its real title; Dachimpy short-haired, as ever
    expect(FRIEND_TITLES.daquan).toMatch(/Scabard's Group/);
    const s = FRIENDS.find((f) => f.id === 'daquan')!.portrait!.sitter;
    expect(s.who === 'pirate' && s.company?.[0]).toMatchObject({ kind: 'pirate', name: 'Dachimpy' });
    expect(['short', 'bald']).toContain(IN_PINK_COAT.hair);
  });

  it('"Monkey Couple" looked awful (14 Nov: "oh my God, what is that?"; "I\'m pretty sure I\'ve never had long hair"): Dachimpy fully clothed in red, short hair, as in the real portrait', () => {
    expect(IN_RED).toMatchObject({ top: 'plain', topCol: 'red', waist: 'sash', legs: 'pants', legsCol: 'red', bareLegs: false });
    expect(IN_RED.top).not.toBe('sash');
    for (const dress of [IN_RED, MONKEY_MAN, IN_RAGS]) expect(['short', 'bald']).toContain(dress.hair);
    // every friend painted close, the sitters big in the frame; Sanne turned so her tied-back hair shows
    for (const f of FRIENDS) if (f.portrait) expect(f.portrait.close, f.id).toBe(true);
    const sanne = FRIENDS.find((f) => f.id === 'sanne')!.portrait!.sitter;
    expect(sanne.who === 'pirate' && sanne.yaw).toBeLessThan(0);
    // and it's only Dachimpy's that are painted close: Gravee's and Roobear's houses keep theirs as they were
    expect(readFileSync(join(ROOT, 'src', 'den-gravee.ts'), 'utf8')).not.toMatch(/close: true/);
    expect(readFileSync(join(ROOT, 'src', 'den-roobear.ts'), 'utf8')).not.toMatch(/close: true/);
  });

  it('draws the friends\' hair in strands, as Tzz\'s and Helium\'s are (14 Nov: "things like hair and clothing need more ... I just want the same"), and their shirts and sashes cut with care', () => {
    // short, long, tied back and wavy hair, and the beehive wig, each laid in strands, streaked along them
    for (const style of ['short', 'long', 'ponytail']) expect(LOOK_JS, style).toMatch(new RegExp(`L\\.hair === '${style}'[^\\n]*\\{[\\s\\S]{0,1600}?tube\\(`));
    expect(LOOK_JS).toMatch(/L\.hat === 'beehive'[\s\S]{0,2400}?strandTex\(hcHex\)/);
    expect(LOOK_JS).toMatch(/if \(fine\.length\) body\.add\(part\(mergeGeometries\(fine\), M\('#ffffff', \{ map: strandTex\(hairHex\) \}\)/);
    // a plain shirt or a shirt with belt open at the neck, its collar points, buttons; a sash knotted
    expect(LOOK_JS).toMatch(/if \(L\.top === 'plain' \|\| L\.top === 'belt'\) \{[\s\S]{0,900}?bone/);
    expect(LOOK_JS).toMatch(/L\.waist === 'sash'[\s\S]{0,700}?const knot/);
  });

  it('has Sanne and Zizzy in the wardrobe from their Meridian portraits (13 Nov)', () => {
    const sanne = LOOK_JS.match(/\n {2}Sanne: \{([\s\S]*?)\n {2}\},/)![1], zizzy = LOOK_JS.match(/\n {2}Zizzy: \{([\s\S]*?)\n {2}\},/)![1];
    expect(sanne).toMatch(/hairCol: 'blonde'/);
    expect(sanne).toMatch(/topCol: 'red'/);
    expect(sanne).toMatch(/feet: 'boots', feetCol: 'white'/);
    expect(sanne).toMatch(/fam: 'monkey'/);
    expect(zizzy).toMatch(/hairCol: 'pink'/);
    expect(zizzy).toMatch(/legs: 'gown', legsCol: 'pink'/);
  });

  it('hangs them along the back wall without overlapping, inside the room', () => {
    const F = [...FRIENDS].sort((a, b) => a.x - b.x);
    for (let i = 1; i < F.length; i++) expect(F[i].x - F[i].w / 2 - 0.15, F[i].id).toBeGreaterThan(F[i - 1].x + F[i - 1].w / 2);
    for (const f of F) { expect(f.x - f.w / 2).toBeGreaterThan(FRIENDS_ROOM.x0 + 0.3); expect(f.x + f.w / 2).toBeLessThan(FRIENDS_ROOM.x1 - 0.3); }
    expect(FRIENDS_WALL).toBeCloseTo(FRIENDS_ROOM.z0 + 0.2, 5);
  });

  it('says thank you to everyone who makes Puzzle Pirates what it is', () => {
    expect(THANKS).toMatch(/Puzzle Pirates/);
    expect(THANKS).toMatch(/Thank you/);
  });
});

describe('a hug and a cookie at the door, every visit (IDEAS.md: "hugs and cookies")', () => {
  it('hugs you at the door each visit, then gives you a cookie', () => {
    expect(AT_THE_DOOR.first).toMatch(/[Hh]ug/);
    expect(AT_THE_DOOR.again).toMatch(/[Hh]ug/);
    expect(THE_COOKIE.first).toMatch(/cookie/);
    expect(THE_COOKIE.again.length).toBeGreaterThan(0);
    expect(IN_DACHIMPYS_HOUSE.hugged).toBeTruthy();
    expect(HUG.said).toBeLessThan(HUG.secs);
    expect(COOKIE.said).toBeLessThan(COOKIE.done);
  });

  it('stands beside you to hug you, facing you, you facing them, never in a wall or the furniture', () => {
    const B = blocksOf(FURNISH);
    for (const you of [ARRIVE.you, { x: HALL.x0 + 0.4, z: 0 }, { x: HALL.x1 - 0.4, z: 0 }, { x: COOKIES.x, z: COOKIES.z + 0.8 }]) {
      const h = hugSpot(PLAN, you, B);
      expect(Math.hypot(h.x - you.x, h.z - you.z)).toBeCloseTo(HUG.side, 5);
      expect(walkable(PLAN, h.x, h.z)).toBe(true);
      const toYou = Math.atan2(you.x - h.x, you.z - h.z), toThem = Math.atan2(h.x - you.x, h.z - you.z);
      expect(Math.abs(Math.atan2(Math.sin(h.yaw - toYou), Math.cos(h.yaw - toYou)))).toBeLessThan(1e-6);
      expect(Math.abs(Math.atan2(Math.sin(h.youYaw - toThem), Math.cos(h.youYaw - toThem)))).toBeLessThan(1e-6);
    }
  });

  it('keeps a plate of cookies on the hall\'s table, for another', () => {
    expect(FURNISH.find((p) => p.kind === 'table')).toMatchObject({ x: COOKIES.x, z: COOKIES.z });
    expect(atCookies({ x: COOKIES.x - 0.9, z: COOKIES.z + 0.6 })).toBe(true);
    expect(atCookies(ARRIVE.you)).toBe(false);
    expect(ANOTHER_COOKIE.length).toBeGreaterThan(1);
    expect(FURNITURE_JS).toMatch(/cookies/);
  });
});

describe('their tour', () => {
  it('has their lines for every stop, each somewhere you can stand, in the room it\'s about', () => {
    for (const s of TOUR) {
      expect(TOUR_LINES[s.id].length, s.id).toBeGreaterThan(0);
      expect(walkable(PLAN, s.at.x, s.at.z), `${s.id} at`).toBe(true);
      expect(walkable(PLAN, s.them.x, s.them.z), `${s.id} them`).toBe(true);
      expect(roomAt(PLAN, s.at.x, s.at.z)?.id).toBe(s.id);
      expect(Math.hypot(s.at.x - ARRIVE.you.x, s.at.z - ARRIVE.you.z), s.id).toBeGreaterThan(s.near);   // (not said at the door, over the hug)
    }
    expect(stopAt(0, TOUR[2].at.x, TOUR[2].at.z)).toBe(2);
    expect(stopAt(3, TOUR[0].at.x, TOUR[0].at.z)).toBe(-1);
  });
});

describe('Dachimpy in the wardrobe, from their in-game picture (13 Nov: the first go "absolutely does not look like me")', () => {
  it('"my pink and purple wig, kilt, belt and braces, and shoes": all wardrobe items for anyone', () => {
    const them = LOOK_JS.match(/\n {2}Dachimpy: \{([\s\S]*?)\n {2}\},/)![1];
    expect(them).toMatch(/hat: 'beehive', hatCol: 'rose', hatCol2: 'purple'/);   // (a tall pale pink wig, a purple band)
    expect(them).toMatch(/beard: 'full'/);   // (a brown beard and moustache)
    expect(them).toMatch(/hairCol: 'brown'/);
    expect(them).toMatch(/top: 'braces', topCol: 'purple'/);   // (purple braces over a bare chest)
    expect(them).toMatch(/waist: 'belt', waistCol: 'black'/);
    expect(them).toMatch(/legs: 'kilt', legsCol: 'pink', legsCol2: 'purple'/);
    expect(them).toMatch(/bareLegs: true/);
    expect(them).toMatch(/feet: 'shoes', feetCol: 'pink'/);
    for (const [slot, id] of [['hat', 'beehive'], ['top', 'braces'], ['legs', 'kilt'], ['feet', 'shoes']]) expect(partsOf(slot)).toContain(id);
    expect(LOOK_JS).toMatch(/'starfish', 'pegleg', 'bareLegs'\]/);   // (kept by cleanLook, for anyone)
    expect(readFileSync(join(ROOT, 'js', 'den', 'menus.js'), 'utf8')).toMatch(/toggle\(row\('Bare legs'\)/);
  });
});

describe('a link straight in (den.html?at=dachimpy)', () => {
  it('opens any house in the district by its id', () => {
    const menus = readFileSync(join(ROOT, 'js', 'den', 'menus.js'), 'utf8');
    expect(menus).toMatch(/else if \(houseById\(at\)\) toHouse\(at\)/);
    expect(houseById('dachimpy')).not.toBeNull();
  });
});
