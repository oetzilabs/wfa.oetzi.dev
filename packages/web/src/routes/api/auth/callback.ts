import type { APIEvent } from "@solidjs/start/server";
import { Auth } from "@/lib/auth";
import { GoogleClient } from "@/lib/auth/client";
import { subjects } from "@wfa/core/src/auth/subjects";
import { Applications } from "@wfa/core/src/entities/application";
import { Organizations } from "@wfa/core/src/entities/organizations";
import { Users } from "@wfa/core/src/entities/users";
import { getRequestFingerprint, getRequestIP, sendRedirect } from "vinxi/http";

export async function GET(e: APIEvent) {
  const event = e.nativeEvent;
  const url = new URL(e.request.url);
  const code = url.searchParams.get("code");
  try {
    if (!code) throw new Error("Missing code");

    const tokens = await GoogleClient.exchange(code, import.meta.env.VITE_LOGIN_REDIRECT_URI);

    const verified = await GoogleClient.verify(subjects, tokens.access!, {
      refresh: tokens.refresh!,
    });

    const sessionToken = Auth.generateSessionToken();

    if (verified.subject.type !== "user") {
      return sendRedirect(event, "/auth/error?error=invalid_subject", 303);
    }

    const user = await Users.findById(verified.subject.properties.id);
    if (!user) return sendRedirect(event, "/auth/error?error=missing_user", 303);

    const last_created_application = await Applications.lastCreatedByUserId(user.id);
    const last_created_organization = await Organizations.lastCreatedByUserId(user.id);

    const ip = getRequestIP(event);
    const ip2 = getRequestIP(event, { xForwardedFor: true });
    const finalIp = ip2 ?? ip;
    const fingerprint = await getRequestFingerprint(event);

    const session = await Auth.createSession(sessionToken, {
      userId: user.id,
      cookie_token: sessionToken,
      access_token: tokens.access,
      refresh_token: tokens.refresh,
      application_id: last_created_application?.id,
      organization_id: last_created_organization?.id,
      browser: e.request.headers.get("user-agent") ?? "unknown",
      ip: finalIp ?? "unknown",
      fingerprint,
    });

    Auth.setSessionCookie(event, sessionToken);

    event.context.session = session;

    if (user && user.verifiedAt) return sendRedirect(event, "/dashboard", 303);
    return sendRedirect(event, "/auth/verify-email", 303);
  } catch (e: any) {
    return sendRedirect(event, "/auth/error?error=" + e.message, 303);
  }
}
