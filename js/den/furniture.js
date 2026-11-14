/* Furniture: every piece in the houses (and anywhere else that wants one). Each piece is a small module of its
   own in js/den/furniture/ (14 Nov: laid out so anyone can add one; its README.md says how), listed in its
   registry, js/den/furniture/index.js. This file only passes them on, so every `import { ... } from
   './furniture.js'` keeps working as it always has: each builder by its name (rug, frame, coffin...), `place`,
   `wrapLines`, `cookiePlate`, FURNITURE (every builder by its id) and the registry itself (PIECES, GROUPS). */
export * from './furniture/index.js';
