import { createAsync, redirect, RouteDefinition, useSearchParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { Button } from "../../components/ui/button";
import { getApplicationById } from "../../lib/api/applications";
import { getAuthenticatedSession } from "../../lib/auth/util";

export const route = {
  preload: async (props) => {
    const session = await getAuthenticatedSession();
    const app_id = props.params.app_id;
    if (!session || !app_id) {
      return redirect("/auth/login", 401);
    }
    const app = await getApplicationById(props.params.app_id);
    return {
      session,
      app,
    };
  },
} satisfies RouteDefinition;

type VerifyAppTokenProps = {
  app_id: string;
  generated_code: string;
  redirect_uri: string;
};

const VerifyAppToken = (props: VerifyAppTokenProps) => {
  const app = createAsync(() => getApplicationById(props.app_id), { deferStream: true });

  return (
    <Show when={app() && app()}>
      {(a) => (
        <div class="flex flex-col w-full p-4 items-center justify-center h-full grow">
          <div class="flex flex-col w-max p-4 rounded-md border border-neutral-200 bg-neutral-100 shadow-md dark:border-neutral-800 dark:bg-neutral-900 h-max">
            <div class="flex flex-col w-max gap-4">
              <h1 class="text-xl font-bold">Verify App: {a().name}</h1>
              <div class="flex flex-col w-max gap-1">
                <p class="text-sm">Please check the code and verify your identity.</p>
                <span class="font-['Geist_Mono'] text-xs font-bold tracking-widest">Code: {props.generated_code}</span>
              </div>
              <div class="flex flex-col gap-4 items-end justify-end">
                <form method="get" action={`${import.meta.env.VITE_AUTH_URL}app_token/callback`}>
                  <input type="hidden" name="grant_type" value="authorization_code" />
                  <input type="hidden" name="client_id" value="app_token" />
                  <input type="hidden" name="app_id" value={props.app_id} />
                  <input type="hidden" name="code" value={props.generated_code} />
                  <input type="hidden" name="redirect_uri" value={props.redirect_uri} />
                  <Button class="w-max" type="submit">
                    All fine!
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};

export default function VerifyAppTokenPage() {
  const [searchParams] = useSearchParams();
  const app_id = createMemo(() => searchParams.app_id as string | undefined);
  const generated_code = createMemo(() => searchParams.generated_code as string | undefined);
  const redirect_uri = createMemo(() => searchParams.redirect_uri as string | undefined);
  return (
    <Show
      when={app_id() !== undefined && redirect_uri() !== undefined && generated_code() !== undefined}
      fallback={
        <div class="flex flex-col w-full p-4 items-center justify-center h-full grow">
          <div class="flex flex-col items-center justify-center w-full">
            <span class="text-red-500 font-bold">Something went wrong...</span>
            <span>Missing parameters</span>
            <span class="font-['Geist_Mono'] text-xs font-bold tracking-widest">App ID: {app_id()}</span>
            <span class="font-['Geist_Mono'] text-xs font-bold tracking-widest">Redirect URI: {redirect_uri()}</span>
            <span class="font-['Geist_Mono'] text-xs font-bold tracking-widest">
              Generated Code: {generated_code()}
            </span>
          </div>
        </div>
      }
    >
      <VerifyAppToken app_id={app_id()!} redirect_uri={redirect_uri()!} generated_code={generated_code()!} />
    </Show>
  );
}
