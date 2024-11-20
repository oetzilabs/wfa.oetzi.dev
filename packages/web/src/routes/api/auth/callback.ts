import type { APIEvent } from "@solidjs/start/server";
import { Auth } from "@/lib/auth";
import { Users } from "@wfa/core/src/entities/users";
import { sendRedirect } from "vinxi/http";

export async function GET(e: APIEvent) {
  const event = e.nativeEvent;
  const url = new URL(e.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return sendRedirect(event, "/auth/error?error=missing_code", 303);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "google",
    code,
    redirect_uri: `${url.origin}${url.pathname}`,
  });

  const response = await fetch(`${import.meta.env.VITE_AUTH_URL}token`, {
    method: "POST",
    body,
  }).then(async (r) => r.json());

  if (!response.access_token) {
    return sendRedirect(event, "/auth/error?error=missing_access_token", 303);
  }

  const sessionResponse = await fetch(new URL("/session", import.meta.env.VITE_API_URL), {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
    },
  }).then((r) => r.json());

  const { id, organization_id, company_id } = sessionResponse;

  if (!id) {
    return sendRedirect(event, "/auth/error?error=missing_user", 303);
  }

  const sessionToken = Auth.generateSessionToken();

  const session = await Auth.createSession(sessionToken, {
    userId: id,
    company_id,
    organization_id,
  });

  Auth.setSessionCookie(event, sessionToken);

  event.context.session = session;

  const user = await Users.findById(id);

  if (user && user.verifiedAt) return sendRedirect(event, "/", 303);
  return sendRedirect(event, "/auth/verify-email", 303);
}
