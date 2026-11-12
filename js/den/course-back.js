// A course from the race's editor, raced in the den (12 Nov): den.html?at=race&course=..., its 3D view
// (race-editor.html; src/race-course.ts). The race is laid from it (LAY.RACE, read once at load); this only
// puts a way back to the editor on the screen, with the course, so 2D and 3D are a click apart.
import { LAY } from '../den-sail.js';

if (LAY.RACE.CUSTOM && typeof document !== 'undefined') {
  const a = document.createElement('a');
  a.href = `race-editor.html?course=${LAY.RACE.CODE}`;
  a.id = 'course-back';
  a.textContent = '◂ Back to the course editor (2D)';
  a.title = 'You\'re racing a course from the editor';
  Object.assign(a.style, {
    position: 'fixed', right: '12px', top: '64px', zIndex: 60, padding: '7px 12px', borderRadius: '8px',
    background: 'rgba(40,26,12,.86)', color: '#f4e4bf', font: '600 13px system-ui, sans-serif', textDecoration: 'none',
    border: '1px solid rgba(232,200,140,.5)',
  });
  const add = () => document.body.appendChild(a);
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
}
