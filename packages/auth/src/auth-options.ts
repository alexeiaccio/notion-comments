/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NextAuthOptions } from "next-auth";
import { XataClient } from "./xata";
import Notion from "./notion-provider";
import { XataAdapter } from "./xata-adapter";

const client = new XataClient({
  apiKey: process.env.XATA_API_KEY!,
});

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: XataAdapter(client),
  providers: [
    // ...add more providers here
    Notion({
      clientId: process.env.NOTION_ID!,
      clientSecret: process.env.NOTION_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
