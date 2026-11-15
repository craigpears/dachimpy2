/** Large shots that crumble a tower: three of her broadsides, both shots of each on it. */
export const TOWER_HP = 6;
/** A tower of the gate: its squares (its columns of the wall, rows r0 to r1: rocks to sail by till it's
    crumbled), and what's left of it. Only large guns hurt it. */
export class Tower {
    cols;
    squares = [];
    hp;
    constructor(cols, r0, r1, hp = TOWER_HP) {
        this.cols = cols;
        this.hp = hp;
        for (const c of cols)
            for (let r = r0; r <= r1; r++)
                this.squares.push([c, r]);
    }
    down() { return this.hp <= 0; }
    has(c, r) { return !this.down() && this.squares.some(([x, y]) => x === c && y === r); }
    /** A shot on it: a large gun's knocks a piece off ('hit', or 'crumbled' with the last); anything less
        'bounces'. */
    hit(guns) {
        if (this.down())
            return null;
        if (guns !== 'large')
            return 'bounced';
        this.hp--;
        return this.down() ? 'crumbled' : 'hit';
    }
}
/** An imperial gate in a wall rows r0 to r1 deep: its way (a column), a tower two wide either side of it. */
export class Gate {
    way;
    r0;
    r1;
    towers;
    constructor(way, r0, r1, hp = TOWER_HP) {
        this.way = way;
        this.r0 = r0;
        this.r1 = r1;
        this.towers = [[way - 2, way - 1], [way + 1, way + 2]].map((cols) => new Tower(cols, r0, r1, hp));
    }
    /** Each tower's middle, across (for drawing). */
    middles() { return this.towers.map((t) => (t.cols[0] + t.cols[t.cols.length - 1]) / 2); }
    /** The tower standing on this square, if one is (its number), else -1. */
    towerAt(c, r) { return this.towers.findIndex((t) => t.has(c, r)); }
    /** A tower's down: the way's three wide. */
    open() { return this.towers.some((t) => t.down()); }
    /** The wall's squares the gate stands on: its towers' (rocks till crumbled). */
    squares() { return this.towers.flatMap((t) => (t.down() ? [] : t.squares)); }
}
