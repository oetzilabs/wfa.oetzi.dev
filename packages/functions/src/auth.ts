import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { handle } from "hono/aws-lambda";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { auth } from "sst/auth";
import { CodeAdapter } from "sst/auth/adapter/code";
import { GoogleAdapter } from "sst/auth/adapter/google";
import { sessions } from "./session";

export const handler = handle(
  auth.authorizer({
    providers: {
      google: GoogleAdapter({
        clientID: Resource.GoogleClientId.value,
        mode: "oidc",
      }),
      app_token: CodeAdapter({
        length: 8,
        onCodeInvalid: async (code, claims, req) => {
          return new Response("Code is invalid " + code, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        },
        onCodeRequest: async (code, claims, req) => {
          const searchParams = new URLSearchParams(req.url);
          const redirectUri = searchParams.get("redirect_uri");
          const hasAppId = searchParams.has("app_id");
          if (!hasAppId) {
            return new Response("No app id found", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }

          return new Response(code, {
            status: 302,
            headers: {
              Location:
                process.env.AUTH_FRONTEND_URL +
                "/auth/verify_app_token?" +
                new URLSearchParams({
                  app_id: searchParams.get("app_id")!,
                  generated_code: code,
                  redirect_uri: redirectUri ?? "/dashboard",
                }).toString(),
            },
          });
        },
      }),
    },
    session: sessions,
    callbacks: {
      connect: {
        async start(session, req) {
          // console.log("connect start", session);
        },
        async success(session, input) {
          // console.log("connect success", session, input);
          return new Response("Successfully connected", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        },
      },
      auth: {
        async start(event) {
          // console.log("auth start", event);
        },
        async allowClient(cId, redirect, req) {
          return ["gmail", "app_token"].includes(cId);
        },
        async success(ctx, input, req) {
          if (input.provider === "google") {
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
              },
            });
          } else if (input.provider === "app_token") {
            const searchParams = new URLSearchParams(req.url);
            const hasAppId = searchParams.has("app_id");
            if (!hasAppId) {
              return new Response("No app id found", {
                status: StatusCodes.BAD_REQUEST,
                headers: { "Content-Type": "text/plain" },
              });
            }
            const appId = searchParams.get("app_id")!;
            const app = await Applications.findById(appId);
            if (!app) return new Response("No app found", { status: StatusCodes.NOT_FOUND });

            return ctx.session({
              type: "app",
              properties: {
                id: app.id,
                token: app.token,
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
  }),
);
