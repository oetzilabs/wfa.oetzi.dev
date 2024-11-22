import { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCode } from "hono/utils/http-status";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { Env } from "./app";

export class VisibleError extends Error {
  constructor(
    public kind: "input" | "auth" | "not-found",
    public code: string,
    public message: string,
  ) {
    super(message);
  }
}

export const onError: ErrorHandler<Env> = (error, c) => {
  console.log("error", error);
  if (error instanceof VisibleError) {
    let statusCode: StatusCode;
    switch (error.kind) {
      case "input":
        statusCode = StatusCodes.BAD_REQUEST;
        break;
      case "auth":
        statusCode = StatusCodes.UNAUTHORIZED;
        break;
      case "not-found":
        statusCode = StatusCodes.NOT_FOUND;
        break;
      default:
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }
    return c.json(
      {
        code: error.code,
        message: error.message,
      },
      statusCode,
    );
  }
  if (error instanceof HTTPException) {
    if (error.status === 401) {
      return c.json(
        {
          code: "auth",
          message: "Unauthorized",
        },
        error.status,
      );
    }
  }
  if (error instanceof ZodError) {
    const e = error.errors[0];
    if (e) {
      return c.json(
        {
          code: e?.code,
          message: e?.message,
        },
        StatusCodes.BAD_REQUEST,
      );
    }
  }
  return c.json(
    {
      code: "internal",
      message: "Internal server error",
    },
    StatusCodes.INTERNAL_SERVER_ERROR,
  );
};
