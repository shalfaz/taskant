import { seedOnStartup } from './startup';

seedOnStartup().catch(() => {
  process.exitCode = 1;
});
