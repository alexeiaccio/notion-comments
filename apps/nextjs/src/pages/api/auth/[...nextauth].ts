import NextAuth from "next-auth";

import { authOptions } from "@notion-comments/auth";

export default NextAuth(authOptions);
