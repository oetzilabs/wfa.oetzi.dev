import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "@wfa/core/src/auth/subjects";
import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";

type Cookies = {
  access_token: string | undefined;
  refresh_token: string | undefined;
};

export const GoogleClient = createClient({
  clientID: "google",
  issuer: Resource.Auth.url,
});

export const getUser = async (cookies: Cookies) => {
  const access = cookies.access_token;
  const refresh = cookies.refresh_token;
  if (!access || !refresh) throw new Error("No access or refresh token found");
  const session = await GoogleClient.verify(subjects, access);
  if (!session) throw new Error("No session found");
  if (session.err) {
    throw session.err;
  }
  if (session.subject.type !== "user") {
    throw new Error("Invalid session type");
  }
  const { id } = session.subject.properties;
  if (!id) throw new Error("Invalid UserID in session");
  const user = await Users.findById(id);
  if (!user) throw new Error("No session found");
  return user;
};

export const getApplication = async (cookies: Cookies) => {
  const access = cookies.access_token;
  const refresh = cookies.refresh_token;
  if (!access || !refresh) throw new Error("No access or refresh token found");
  const session = await GoogleClient.verify(subjects, access);
  if (!session) throw new Error("No session found");
  if (session.err) {
    throw session.err;
  }
  if (session.subject.type !== "user") {
    throw new Error("Invalid session type");
  }
  const { id } = session.subject.properties;
  if (!id) throw new Error("Invalid AppID in session");
  const app = await Applications.findById(id);
  if (!app) throw new Error("No application found");
  return app;
};

export const ensureAuthenticated = async (cookies: Cookies) => {
  const access = cookies.access_token;
  const refresh = cookies.refresh_token;
  if (!access || !refresh) throw new Error("No access or refresh token found");
  const session = await GoogleClient.verify(subjects, access);
  if (!session) throw new Error("No session found");
  if (session.err) {
    throw session.err;
  }
  switch (session.subject.type) {
    case "app": {
      const { id } = session.subject.properties;
      if (!id) throw new Error("Invalid AppID in session");
      const app = await Applications.findById(id);
      if (!app) throw new Error("No application found");
      return { app };
    }
    case "user": {
      const { id } = session.subject.properties;
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
