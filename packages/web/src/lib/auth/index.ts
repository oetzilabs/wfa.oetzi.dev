import type { SessionSelect as Session, SessionInsert, UserSelect as User } from "@wfa/core/src/drizzle/sql/schema";
import type { H3Event } from "vinxi/http";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "@wfa/core/src/drizzle/sql";
import { sessions, users } from "@wfa/core/src/drizzle/sql/schema";
import { Validator } from "@wfa/core/src/validator";
import { eq } from "drizzle-orm";
import { InferInput, safeParse } from "valibot";
import { setCookie } from "vinxi/http";

export module Auth {
  export const SESSION_COOKIE_NAME = "auth_session" as const;

  export const SESSION_EXPIRES_AT: Readonly<number> = Date.now() + 1000 * 60 * 60 * 24 * 30;

  export function generateSessionToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
  }

  export async function createSession<T extends Omit<SessionInsert, "id" | "expiresAt" | "createdAt" | "updatedAt">>(
    token: string,
    payload: T,
  ) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: SessionInsert = {
      ...payload,
      id: sessionId,
      cookie_token: token,
      createdAt: new Date(),
      updatedAt: null,
      expiresAt: new Date(SESSION_EXPIRES_AT),
    };
    const createdSession = await db.insert(sessions).values(session).returning();
    const [selectedSession] = await db.select().from(sessions).where(eq(sessions.id, createdSession[0].id));
    return selectedSession;
  }
  export async function updateSession<T extends Omit<SessionInsert, "updatedAt">>(token: string, payload: T) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: SessionInsert = {
      ...payload,
      updatedAt: new Date(),
    };
    const [updatedSession] = await db.update(sessions).set(session).where(eq(sessions.id, sessionId)).returning();
    return updatedSession;
  }

  export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const result = await db
      .select({ user: users, session: sessions })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId));
    if (result.length < 1) {
      return { session: null, user: null };
    }
    const { user, session } = result[0];
    if (Date.now() >= session.expiresAt.getTime()) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
      return { session: null, user: null };
    }
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      await db
        .update(sessions)
        .set({
          expiresAt: session.expiresAt,
        })
        .where(eq(sessions.id, session.id));
    }
    return { session, user };
  }

  export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  export async function invalidateSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  export const getSessionsByUserId = (id: Validator.Cuid2SchemaInput) => {
    // const isValid = safeParse(Validator.Cuid2Schema, id);
    // if (!isValid.success) {
    //   throw isValid.issues;
    // }
    // // TODO!: remove this once valibot has fixed the infered types
    // const userId = isValid.output as string;
    return db.query.sessions.findMany({
      where: (fields, op) => op.eq(fields.userId, id),
      with: {
        user: true,
      },
    });
  };

  export const setSessionCookie = (event: H3Event, sessionToken: string) => {
    setCookie(event, Auth.SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.NODE_ENV === "production",
      expires: new Date(Auth.SESSION_EXPIRES_AT),
      path: "/",
    });
  };

  export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
}
