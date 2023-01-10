import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import type { TokenSetParameters } from "openid-client";

interface NotionTokenSet extends TokenSetParameters {
  workspace_id?: string;
  owner?: {
    user: {
      id: string;
    };
  };
}

interface NotionTokenSetParams {
  tokens: NotionTokenSet;
}

export interface NotionProviderOptions {
  notionVersion?: string;
}

export interface NotionProfile extends Record<string, any> {
  id: string;
  name: string;
  avatar_url: string;
  person: {
    email: string;
  };
  workspace: string;
}

export default function Notion<P extends NotionProfile>(
  options: OAuthUserConfig<P> & NotionProviderOptions,
): OAuthConfig<P> {
  return {
    id: "notion",
    name: "Notion",
    type: "oauth",
    authorization: "https://api.notion.com/v1/oauth/authorize",
    token: "https://api.notion.com/v1/oauth/token",
    userinfo: {
      request: async ({ tokens }: NotionTokenSetParams) => {
        const { access_token = "", workspace_id, owner } = tokens;

        if (!access_token || !owner?.user.id) {
          throw new Error("Notion Provider: No access token received");
        }

        const res = await fetch(
          "https://api.notion.com/v1/users/" + owner?.user.id,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Notion-Version": options.notionVersion || "2022-06-28",
              Authorization: "Bearer " + access_token,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Something went wrong while trying to get the user");
        }

        const user = await res.json();

        return {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          person: {
            email: user.person.email,
          },
          workspace: workspace_id,
        };
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.person.email,
        image: profile.avatar_url,
        workspace: profile.workspace,
      };
    },
    style: {
      logo: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/notion.svg`,
      logoDark: `${
        process.env.NEXTAUTH_URL ?? "http://localhost:3000"
      }/notion.svg`,
      bg: "#fff",
      text: "#000",
      bgDark: "#fff",
      textDark: "#000",
    },
    options,
  };
}
