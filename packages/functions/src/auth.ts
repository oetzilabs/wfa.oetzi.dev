import { env } from "node:process";
import { Users } from "@wfa/core/src/entities/users";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { auth } from "sst/auth";
import { CodeAdapter } from "sst/auth/adapter/code";
import { GoogleAdapter } from "sst/auth/adapter/google";

const session = auth.sessions<{
  user: {
    id: string;
    email: string;
  };
  app: {
    id: string;
    token: string;
  };
}>();

const authorizer = () =>
  auth.authorizer({
    providers: {
      gmail: GoogleAdapter({
        clientID: Resource.GoogleClientId.value,
        mode: "oidc",
      }),
      code: CodeAdapter({
        length: 32,
        onCodeInvalid: async (code, claims, req) => {
          return new Response("Code is invalid " + code, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        },
        onCodeRequest: async (code, claims, req) => {
          const searchParams = new URLSearchParams(req.url);
          const redirectUri = searchParams.get("redirect_uri")?.replace(process.env.AUTH_FRONTEND_URL as string, "");

          console.log("Code request", code, claims, redirectUri);

          return new Response(code, {
            status: 302,
            headers: {
              Location:
                process.env.AUTH_FRONTEND_URL +
                "/verify?" +
                new URLSearchParams({
                  email: claims.email,
                  redirect: redirectUri ?? "/workspace",
                }).toString(),
            },
          });
        },
      }),
    },
    session,
    callbacks: {
      auth: {
        async allowClient(cId, redirect, req) {
          return ["gmail"].includes(cId);
        },
        async success(ctx, input, req) {
          if (input.provider === "gmail") {
            const claims = input.tokenset.claims();
            const email = claims.email;
            const name = claims.preferred_username ?? claims.name;
            const image = claims.picture ?? "/assets/images/avatar.png";
            if (!email || !name) {
              console.error("No email or name found in tokenset", input.tokenset);
              return ctx.session({
                type: "public",
                properties: {},
              });
            }

            let user_ = await Users.findByEmail(email);

            if (!user_) {
              user_ = await Users.create({ email, name, image })!;
            }

            return ctx.session({
              type: "user",
              properties: {
                id: user_!.id,
                email: user_!.email,
              },
            });
          } else if (input.provider === "code") {
            // const app = await App.findByCode(input.tokenset.claims().code);
            // if (!app) throw new Error("No app found");
            // const token = await App.generateToken(app.id);
            return ctx.session({
              type: "app",
              properties: {
                id: "",
                token: "",
              },
            });
          } else {
            return ctx.session({
              type: "public",
              properties: {},
            });
          }
        },
      },
    },
  });

export default {
  fetch(event: any, ctx: any) {
    return authorizer().fetch(event, ctx);
  },
};
