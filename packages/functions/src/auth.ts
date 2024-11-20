import { env } from "node:process";
import { Users } from "@wfa/core/src/entities/users";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { GoogleAdapter } from "sst/auth/adapter";
import { auth } from "sst/aws/auth";
import { sessions } from "./utils";

export const handler = auth.authorizer({
  session: sessions,
  providers: {
    google: GoogleAdapter({
      clientID: Resource.GoogleClientId.value,
      mode: "oidc",
    }),
  },
  callbacks: {
    error: async (e, req) => {
      console.log("upps error: ", e);
      const response = new Response(e.message, {
        status: StatusCodes.BAD_REQUEST,
        headers: {
          Location: env.AUTH_FRONTEND_URL + "/auth/error?error=unknown",
        },
      });
      return response;
    },
    auth: {
      async allowClient(clientID, redirect) {
        console.log(clientID, redirect);
        const clients = ["google"];
        if (!clients.includes(clientID)) {
          return false;
        }

        return true;
      },
      async error(error, request) {
        console.log("auth-error", error);
        const response = new Response(error.message, {
          status: StatusCodes.BAD_REQUEST,
          headers: {
            Location: env.AUTH_FRONTEND_URL + "/auth/error?error=unknown",
          },
        });
        return response;
      },
      async success(response, input) {
        if (input.provider !== "google") {
          throw new Error("Unknown provider");
        }
        const claims = input.tokenset.claims();
        const email = claims.email;
        const name = claims.preferred_username ?? claims.name;
        const image = claims.picture ?? "/assets/images/avatar.png";
        if (!email || !name) {
          console.error("No email or name found in tokenset", input.tokenset);
          return response.session({
            type: "public",
            properties: {},
          });
        }

        let user_ = await Users.findByEmail(email);

        if (!user_) {
          user_ = await Users.create({ email, name, image })!;
        }

        return response.session({
          type: "user",
          properties: {
            id: user_!.id,
            email: user_!.email,
          },
        });
      },
    },
  },
});
