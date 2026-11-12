// Vitest: the tests in tests/, never a copy of them in an agent's worktree under .claude/.
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  // (20 s a test, not 5: the simulation's and the deal's heavier tests ran past 5 s while agents worked
  // alongside on the same machine, 12 Nov)
  test: { exclude: [...configDefaults.exclude, '.claude/**'], testTimeout: 20000 },
});
