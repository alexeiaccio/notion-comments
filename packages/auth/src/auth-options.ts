import { type User, type NextAuthOptions } from "next-auth";
import { XataClient } from "./xata";
import { XataAdapter } from "@next-auth/xata-adapter";
// import Notion from "./notion";
import CredentialsProvider from "next-auth/providers/credentials";

const client = new XataClient({
  apiKey: process.env.XATA_API_KEY ?? "xau_QRvJMCvl6qW0GJXsFq3bIf2uHsaJcjpr7",
});

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: XataAdapter(client),
  providers: [
    // ...add more providers here
    CredentialsProvider({
      id: "github",
      name: "Mocked GitHub",
      async authorize(credentials) {
        const name = credentials?.name as string;
        const user: User = {
          id: name,
          name: name,
          email: name,
        };
        return user;
      },
      credentials: {
        name: { type: "test" },
      },
    }),
    // Notion({
    //   clientId: process.env.NOTION_ID ?? "1ef8af53-8d3c-4cc7-bd89-a01be296c6d5",
    //   clientSecret:
    //     process.env.NOTION_SECRET ??
    //     "secret_8kUiZ9AJtxSPQj273t2pFoYPeC3nORXSG7Htw0gV6Fg",
    // }),
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
