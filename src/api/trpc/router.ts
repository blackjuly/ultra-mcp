import { router } from './trpc';
import { statsRouter } from './routers/stats';
import { configRouter } from './routers/config';
import { modelsRouter } from './routers/models';
import { chatsRouter } from './routers/chats';

export const appRouter = router({
  stats: statsRouter,
  config: configRouter,
  models: modelsRouter,
  chats: chatsRouter,
});

export type AppRouter = typeof appRouter;