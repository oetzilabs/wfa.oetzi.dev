import { createRoute, z } from "@hono/zod-openapi";
import { document_statuses } from "@wfa/core/src/drizzle/sql/schema";
import { Documents } from "@wfa/core/src/entities/documents";
import { Validator } from "@wfa/core/src/validator";
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
    200: {
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
    404: {
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
    200: {
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
    404: {
      description: "Document not found",
    },
    401: {
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
          return c.json({ error: "Document not found" }, 404);
        }
        return c.json(
          docs.map((doc) => ({ id: doc.id })),
          200,
        );
      }
      case "user": {
        const docs = await Documents.findManyByUserSessionToken(_secret, {
          includeDeleted,
        });
        if (!docs) {
          return c.json({ error: "Document not found" }, 404);
        }
        return c.json(
          docs.map((doc) => ({ id: doc.id, status: doc.status })),
          200,
        );
      }
      default: {
        return c.json({ error: "Invalid token" }, 401);
      }
    }
  });
  return app;
};
