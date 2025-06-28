
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  signupInputSchema, 
  loginInputSchema, 
  createPostInputSchema, 
  getPostsByAthleteInputSchema,
  createFeedbackInputSchema,
  acceptFeedbackInputSchema,
  getFeedbackByPostInputSchema
} from './schema';

// Import handlers
import { signup } from './handlers/signup';
import { login } from './handlers/login';
import { createPost } from './handlers/create_post';
import { getAllPosts } from './handlers/get_all_posts';
import { getPostsByAthlete } from './handlers/get_posts_by_athlete';
import { createFeedback } from './handlers/create_feedback';
import { acceptFeedback } from './handlers/accept_feedback';
import { getFeedbackByPost } from './handlers/get_feedback_by_post';
import { getUserById } from './handlers/get_user_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  signup: publicProcedure
    .input(signupInputSchema)
    .mutation(({ input }) => signup(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // User routes
  getUserById: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserById(input.userId)),

  // Post routes
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),

  getAllPosts: publicProcedure
    .query(() => getAllPosts()),

  getPostsByAthlete: publicProcedure
    .input(getPostsByAthleteInputSchema)
    .query(({ input }) => getPostsByAthlete(input)),

  // Feedback routes
  createFeedback: publicProcedure
    .input(createFeedbackInputSchema)
    .mutation(({ input }) => createFeedback(input)),

  acceptFeedback: publicProcedure
    .input(acceptFeedbackInputSchema)
    .mutation(({ input }) => acceptFeedback(input)),

  getFeedbackByPost: publicProcedure
    .input(getFeedbackByPostInputSchema)
    .query(({ input }) => getFeedbackByPost(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
