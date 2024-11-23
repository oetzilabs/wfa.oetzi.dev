import type { APIEvent } from "@solidjs/start/server";
import { Auth } from "@/lib/auth";
import { Users } from "@wfa/core/src/entities/users";
import { getRequestFingerprint, getRequestIP, sendRedirect } from "vinxi/http";

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
  })
    .then(async (r) => r.json())
    .catch((e) => {
      console.dir(e, {
        depth: Infinity,
      });
      return null;
    });
  if (!response) {
    return sendRedirect(event, "/auth/error?error=missing_first_auth_response", 303);
  }

  if (!response.access_token) {
    return sendRedirect(event, "/auth/error?error=missing_access_token", 303);
  }
  const headers = new Headers();
  headers.append("authorization", `Bearer user:${response.access_token}`);
  const sessionResponse = await fetch(new URL("/session/user", `https://${import.meta.env.VITE_API_URL}`), {
    headers,
  })
    .then((r) => r.json())
    .catch((e) => {
      return null;
    });

  if (!sessionResponse) {
    return sendRedirect(event, "/auth/error?error=missing_session", 303);
  }

  if (!sessionResponse.id) {
    return sendRedirect(event, "/auth/error?error=missing_user", 303);
  }

  const sessionToken = Auth.generateSessionToken();

  const ip = getRequestIP(event);
  const ip2 = getRequestIP(event, { xForwardedFor: true });
  const finalIp = ip2 ?? ip;
  const fingerprint = await getRequestFingerprint(event);

  const session = await Auth.createSession(sessionToken, {
    userId: sessionResponse.id,
    company_id: sessionResponse.company_id,
    organization_id: sessionResponse.organization_id,
    browser: e.request.headers.get("user-agent") ?? "unknown",
    ip: finalIp ?? "unknown",
    fingerprint,
  });

  Auth.setSessionCookie(event, sessionToken);

  event.context.session = session;

  const user = await Users.findById(sessionResponse.id);

  if (user && user.verifiedAt) return sendRedirect(event, "/", 303);
  return sendRedirect(event, "/auth/verify-email", 303);
}
