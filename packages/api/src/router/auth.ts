import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(async () => {
    await new Promise((resolve) => {
      setTimeout(() => void resolve(null), 1000);
    });
    return "you can see this secret message!";
  }),
});
