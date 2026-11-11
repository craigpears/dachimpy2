// Vitest: the tests in tests/, never a copy of them in an agent's worktree under .claude/.
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
