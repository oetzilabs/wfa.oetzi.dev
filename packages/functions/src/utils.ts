import { z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { createSessionBuilder } from "sst/auth";
import { sessions } from "./session";

export const AuthenticationSchema = z.strictObject({
  type: z.enum(["app", "user"]),
  token: z.string(),
});

export const getUser = async (token: string) => {
  const splitToken = token.split(" ");
  if (splitToken.length !== 2) throw new Error("Invalid token");
  if (splitToken[0] !== "Bearer") throw new Error("Invalid token");
  const typeToken = splitToken[1].split(":");
  if (typeToken.length !== 2) throw new Error("Invalid token");
  if (typeToken[0] !== "user") throw new Error("Invalid token type");
  const isValid = AuthenticationSchema.safeParse({
    type: typeToken[0],
    token: typeToken[1],
  });
  if (!isValid.success) {
    throw new Error("Invalid token");
  }
  const session = await sessions.verify(isValid.data.token);
  if (!session) throw new Error("No session found");
  if (session.type !== "user") {
    throw new Error("Invalid session type");
  }
  const { id } = session.properties;
  if (!id) throw new Error("Invalid UserID in session");
  const user = await Users.findById(id);
  if (!user) throw new Error("No session found");
  return user;
};

export const getApplication = async (token: string) => {
  const splitToken = token.split(" ");
  if (splitToken.length !== 2) throw new Error("Invalid token");
  if (splitToken[0] !== "Bearer") throw new Error("Invalid token");
  const typeToken = splitToken[1].split(":");
  if (typeToken.length !== 2) throw new Error("Invalid token");
  if (typeToken[0] !== "app") throw new Error("Invalid token type");
  const isValid = AuthenticationSchema.safeParse({
    type: typeToken[0],
    token: typeToken[1],
  });
  if (!isValid.success) {
    throw new Error("Invalid token");
  }
  const session = await sessions.verify(isValid.data.token);
  if (!session) throw new Error("No session found");
  if (session.type !== "app") {
    throw new Error("Invalid session type");
  }
  const { id } = session.properties;
  if (!id) throw new Error("Invalid AppID in session");
  const app = await Applications.findById(id);
  if (!app) throw new Error("No application found");
  return app;
};

export const ensureAuthenticated = async (token: string) => {
  const splitToken = token.split(" ");
  if (splitToken.length !== 2) throw new Error("Invalid token");
  if (splitToken[0] !== "Bearer") throw new Error("Invalid token");
  const typeToken = splitToken[1].split(":");
  if (typeToken.length !== 2) throw new Error("Invalid token");
  const isValid = AuthenticationSchema.safeParse({
    type: typeToken[0],
    token: typeToken[1],
  });
  if (!isValid.success) {
    throw new Error("Invalid token");
  }
  switch (isValid.data.type) {
    case "app": {
      const session = await sessions.verify(isValid.data.token);
      if (!session) throw new Error("No session found");
      if (session.type !== "app") {
        throw new Error("Invalid session type");
      }
      const { id } = session.properties;
      if (!id) throw new Error("Invalid AppID in session");
      const app = await Applications.findById(id);
      if (!app) throw new Error("No application found");
      return { app };
    }
    case "user": {
      const session = await sessions.verify(isValid.data.token);
      if (!session) throw new Error("No session found");
      if (session.type !== "user") {
        throw new Error("Invalid session type");
      }
      const { id } = session.properties;
      if (!id) throw new Error("Invalid UserID in session");
      const user = await Users.findById(id);
      if (!user) throw new Error("No session found");
      return { user };
    }
    default: {
      throw new Error("Invalid token type");
    }
  }
};

export const json = (input: unknown, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export const error = <T extends string | Record<string, any>>(
  error: T,
  statusCode = StatusCodes.BAD_REQUEST,
): APIGatewayProxyResultV2 => {
  const payload = typeof error === "string" ? { error } : error;
  return {
    statusCode,
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
export const text = (input: string, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    body: input,
    headers: {
      "Content-Type": "text/plain",
    },
  };
};

export const image = (input: string | Buffer, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  if (typeof input === "string") {
    // redirect to image url if string
    return {
      statusCode: 302,
      headers: {
        Location: input,
      },
    };
  }

  return {
    statusCode,
    body: input.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "image/jpeg",
    },
  };
};

export const binary = (input: string | Buffer, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  if (typeof input === "string") {
    // create buffer from string
    input = Buffer.from(input);

    return {
      statusCode,
      body: input.toString("base64"),
      isBase64Encoded: true,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": input.length,
      },
    };
  }

  return {
    statusCode,
    body: input.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": input.length,
    },
  };
};

export const ApiHandler =
  <T extends any = any>(handler: APIGatewayProxyHandlerV2<T>) =>
  async (...args: Parameters<APIGatewayProxyHandlerV2<T>>) =>
    handler(...args);
