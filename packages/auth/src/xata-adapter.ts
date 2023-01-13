import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";

import type { XataClient } from "./xata";

export function XataAdapter(client: XataClient): Adapter {
  return {
    async createUser(user) {
      const newUser = await client.db.nextauth_users.create({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      return {
        ...user,
        ...newUser,
      } as AdapterUser;
    },
    async getUser(id) {
      const user = await client.db.nextauth_users.filter({ id }).getFirst();
      return (user as AdapterUser) ?? null;
    },
    async getUserByEmail(email) {
      const user = await client.db.nextauth_users.filter({ email }).getFirst();
      return (user as AdapterUser) ?? null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const result = await client.db.nextauth_users_accounts
        .select(["user.*"])
        .filter({
          "account.providerAccountId": providerAccountId,
          "account.provider": provider,
        })
        .getFirst();
      const user = result?.user;
      return (user as AdapterUser) ?? null;
    },
    async updateUser(user) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = await client.db.nextauth_users.update(user.id!, user);
      return result
        ? ({
            ...user,
            ...result,
          } as AdapterUser)
        : ({
            ...user,
            id: user.id,
            emailVerified: user.emailVerified ?? null,
          } as AdapterUser);
    },
    async deleteUser(id) {
      await client.db.nextauth_users.delete(id);
    },
    async linkAccount(initialAccount) {
      const { userId, ...account } = initialAccount;
      const newXataAccount = await client.db.nextauth_accounts.create({
        access_token: account.access_token,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        expires_at: account.expires_at,
        id_token: account.id_token,
        refresh_token: account.refresh_token,
        scope: account.scope,
        session_state: account.session_state,
        token_type: account.token_type,
        type: account.type,
        user: { id: userId },
      });
      await client.db.nextauth_users_accounts.create({
        user: { id: userId },
        account: { id: newXataAccount.id },
      });
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const connectedAccount = await client.db.nextauth_users_accounts
        .filter({
          "account.providerAccountId": providerAccountId,
          "account.provider": provider,
        })
        .getFirst();

      if (!connectedAccount) {
        return;
      }
      await client.db.nextauth_users_accounts.delete(connectedAccount.id);
    },
    async createSession(initialSession) {
      const { userId, ...session } = initialSession;
      const newXataSession = await client.db.nextauth_sessions.create({
        ...session,
        user: { id: userId },
      });
      await client.db.nextauth_users_sessions.create({
        user: { id: userId },
        session: { id: newXataSession.id },
      });
      return { ...session, ...newXataSession, userId } as AdapterSession;
    },
    async getSessionAndUser(sessionToken) {
      const result = await client.db.nextauth_users_sessions
        .select(["user.*", "session.*"])
        .filter({ "session.sessionToken": sessionToken })
        .getFirst();
      if (!result?.session || !result?.user) {
        return null;
      }

      return {
        session: {
          ...result.session,
          sessionToken: result.session.sessionToken,
          expires: result.session.expires,
          userId: result.user.id,
        } as AdapterSession,
        user: {
          ...result.user,
          emailVerified: result.user.emailVerified ?? null,
        } as AdapterUser,
      };
    },
    async updateSession({ sessionToken, ...data }) {
      const session = await client.db.nextauth_sessions
        .filter({ sessionToken })
        .getFirst();
      if (!session) {
        return null;
      }

      await client.db.nextauth_sessions.update({ ...session, ...data });
      return {
        ...session,
        sessionToken,
        userId: data.userId,
        expires: data.expires,
      } as AdapterSession;
    },

    async deleteSession(sessionToken) {
      const session = await client.db.nextauth_sessions
        .filter({ sessionToken })
        .getFirst();
      if (!session) {
        return;
      }
      const connectedSession = await client.db.nextauth_users_sessions
        .filter({ "session.sessionToken": sessionToken })
        .getFirst();
      if (!connectedSession) {
        return;
      }
      await client.db.nextauth_sessions.delete(session.id);
      await client.db.nextauth_users_sessions.delete(connectedSession.id);
    },
    async createVerificationToken(token) {
      await client.db.nextauth_verificationTokens.create({
        expires: token.expires,
        identifier: token.identifier,
        token: token.token,
      });
      return token;
    },
    async useVerificationToken(token) {
      const xataToken = await client.db.nextauth_verificationTokens
        .filter({ identifier: token.identifier, token: token.token })
        .getFirst();
      if (!xataToken) {
        return null;
      }
      await client.db.nextauth_verificationTokens.delete(xataToken.id);
      return { ...token, expires: new Date() };
    },
  };
}
