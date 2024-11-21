import { createRoute, z } from "@hono/zod-openapi";
import { document_statuses } from "@wfa/core/src/drizzle/sql/schema";
import { Documents } from "@wfa/core/src/entities/documents";
import { Downloader } from "@wfa/core/src/entities/downloader";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { App } from "../app";
import { bearer } from "../middleware/authentication";

const get_all_documents_route = createRoute({
  method: "get",
  path: "/documents",
  request: {
    headers: z.object({
      authorization: z.string().openapi({
        param: {
          name: "Authorization",
          in: "header",
          required: true,
        },
      }),
    }),
    params: z.object({
      includeDeleted: z.boolean().openapi({
        param: {
          name: "includeDeleted",
          in: "query",
        },
        default: false,
        example: false,
      }),
    }),
  },
  middlewares: [bearer],
  responses: {
    [StatusCodes.OK]: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.string().openapi({
                example: "doc_nc6bzmkmd014706rfda898to",
              }),
            })
            .openapi("Document"),
        },
      },
      description: "Retrieve the document",
    },
    [StatusCodes.NOT_FOUND]: {
      description: "Document not found",
    },
  },
});

const get_document_route = createRoute({
  method: "get",
  path: "/documents/{id}",
  request: {
    headers: z.object({
      authorization: z.string().openapi({
        param: {
          name: "Authorization",
          in: "header",
          required: true,
        },
      }),
    }),
    params: z.object({
      id: Validator.prefixed_cuid2.openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "user_nc6bzmkmd014706rfda898to",
      }),
    }),
  },
  middlewares: [bearer],
  responses: {
    [StatusCodes.OK]: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.string().openapi({
                example: "user_nc6bzmkmd014706rfda898to",
              }),
              status: z.enum(document_statuses).openapi({
                example: "uploaded",
              }),
            })
            .openapi("Document"),
        },
      },
      description: "Retrieve the document",
    },
    [StatusCodes.NOT_FOUND]: {
      description: "Document not found",
    },
    [StatusCodes.UNAUTHORIZED]: {
      description: "Unauthorized",
    },
  },
});

const download_document_route = createRoute({
  method: "get",
  path: "/documents/{id}/download",
  request: {
    headers: z.object({
      authorization: z.string().openapi({
        param: {
          name: "Authorization",
          in: "header",
          required: true,
        },
      }),
    }),
    params: z.object({
      id: Validator.prefixed_cuid2.openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "user_nc6bzmkmd014706rfda898to",
      }),
    }),
  },
  middlewares: [bearer],
  responses: {
    [StatusCodes.OK]: {
      content: {
        "application/octet-stream": {
          schema: z.instanceof(Buffer).openapi("Document"),
        },
      },
      headers: z.object({
        "content-type": z
          .enum(["application/octet-stream", "application/pdf"])
          .openapi({
            param: {
              name: "Content-Type",
              in: "header",
            },
            example: "application/octet-stream",
          })
          .default("application/octet-stream"),
        "content-disposition": z
          .string()
          .openapi({
            param: {
              name: "Content-Disposition",
              in: "header",
            },
            example: "attachment; filename=test.pdf",
          })
          .default("attachment; filename=test.pdf"),
      }),
      description: "Retrieve the document",
    },
    [StatusCodes.NOT_FOUND]: {
      description: "Document not found",
    },
    [StatusCodes.UNAUTHORIZED]: {
      description: "Unauthorized",
    },
  },
});

export const registerRoute = (app: App) => {
  app.use(get_document_route.getRoutingPath(), bearer);
  app.openapi(get_document_route, async (c) => {
    const { id } = c.req.valid("param");
    const doc = await Documents.findById(id);
    if (!doc) {
      return c.json({ error: "Document not found" }, 404);
    }
    return c.json(
      {
        id: doc.id,
      },
      200,
    );
  });
  app.openapi(download_document_route, async (c) => {
    const { id } = c.req.valid("param");
    const doc = await Documents.findById(id);
    if (!doc) {
      return c.json({ error: "Document not found" }, StatusCodes.NOT_FOUND);
    }
    try {
      const file = await Downloader.getFile(doc.filepath, {
        type: "r2",
        bucket: Resource.MainCloudflareStorage,
      });
      return c.body(file, StatusCodes.OK);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, StatusCodes.INTERNAL_SERVER_ERROR);
      } else {
        return c.json({ error: "Uknown error occured" }, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
  });
  app.openapi(get_all_documents_route, async (c) => {
    const { includeDeleted } = c.req.valid("param");
    const auth = c.req.valid("header").authorization;
    const authtoken = auth.split(" ")[1];
    const splitToken = authtoken.split(":");
    const _type = splitToken[0];
    const _secret = splitToken[1];

    switch (_type) {
      case "app": {
        const docs = await Documents.findManyByApplicationToken(_secret, {
          includeDeleted,
        });
        if (!docs) {
          return c.json({ error: "Documents not found" }, StatusCodes.NOT_FOUND);
        }
        return c.json(
          docs.map((doc) => ({ id: doc.id })),
          StatusCodes.OK,
        );
      }
      case "user": {
        const docs = await Documents.findManyByUserSessionToken(_secret, {
          includeDeleted,
        });
        if (!docs) {
          return c.json({ error: "Documents not found" }, StatusCodes.NOT_FOUND);
        }
        return c.json(
          docs.map((doc) => ({ id: doc.id, status: doc.status })),
          StatusCodes.OK,
        );
      }
      default: {
        return c.json({ error: "Invalid token" }, StatusCodes.UNAUTHORIZED);
      }
    }
  });
  return app;
};
