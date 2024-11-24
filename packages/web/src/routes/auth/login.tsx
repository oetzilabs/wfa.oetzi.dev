import { Button } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, RouteDefinition } from "@solidjs/router";
import { createSignal, For, JSX } from "solid-js";

type SVGAttributes = Partial<JSX.SvgSVGAttributes<SVGSVGElement>>;

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    return { session };
  },
} satisfies RouteDefinition;

const generateAuthUrl = (provider: string) => {
  const url = new URL(`${import.meta.env.VITE_AUTH_URL}${provider}/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", provider);
  url.searchParams.set("redirect_uri", import.meta.env.VITE_LOGIN_REDIRECT_URI);
  return url.toString();
};

const logins = {
  google: generateAuthUrl("google"),
} as const;

export type Logins = keyof typeof logins;

const logos: Record<Logins, (props: SVGAttributes) => JSX.Element> = {
  google: (props: SVGAttributes) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 13.9V10.18H21.36C21.5 10.81 21.61 11.4 21.61 12.23C21.61 17.94 17.78 22 12.01 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C14.7 2 16.96 2.99 18.69 4.61L15.85 7.37C15.13 6.69 13.88 5.88 12 5.88C8.69 5.88 5.99 8.63 5.99 12C5.99 15.37 8.69 18.12 12 18.12C15.83 18.12 17.24 15.47 17.5 13.9H12Z"
        fill="currentColor"
      />
    </svg>
  ),
};

const randomPersonTesimonial = {
  name: "Özgür Isbert",
  title: "Software Engineer",
  testimonial: "I might be biased, but it works as if I made it myself - It's that good.",
};

export default function LoginPage() {
  const [email, setEmail] = createSignal<string>("");

  const [submitting, setSubmitting] = createSignal<boolean>();

  let formRef: HTMLFormElement;

  return (
    <div class="h-screen grow flex flex-col">
      <div class="w-full h-full flex flex-col grow bg-gradient-to-r from-neutral-950 to-neutral-50">
        <div class="w-full relative flex h-full flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-12 lg:px-0 ">
          <div class="relative hidden h-full flex-col text-white p-10 lg:flex flex-1 col-span-8">
            {/* <div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-900" /> */}
            <div class="relative z-20 flex items-center text-lg gap-2 font-bold">Workflow Automation.</div>
            <div class="relative z-20 mt-auto">
              <blockquote class="space-y-2">
                <p class="">&ldquo;{randomPersonTesimonial.testimonial}&rdquo;</p>
                <p class="text-sm">
                  {randomPersonTesimonial.name} - {randomPersonTesimonial.title}
                </p>
              </blockquote>
            </div>
          </div>
          <div class="p-8 w-full col-span-full lg:col-span-4 h-full items-center justify-center flex bg-white">
            <div class="flex w-full flex-col justify-center gap-12 max-w-[400px]">
              <div class="flex flex-col items-center justify-center w-full gap-4">
                <h1 class="text-2xl font-semibold tracking-tight lg:sr-only not-sr-only">Workflow Automation.</h1>
                <h2 class="text-xl lg:text-2xl font-semibold tracking-tight">Login</h2>
              </div>
              <div class="flex flex-col gap-4 items-center w-full">
                <For each={Object.entries(logins) as [Logins, string][]}>
                  {([provider, url]) => {
                    const L = logos[provider];
                    return (
                      <Button
                        as={A}
                        class="w-fit w-max-full flex items-center justify-center text-sm font-medium gap-4 rounded-sm !py-5 leading-none"
                        href={url}
                      >
                        <L class="h-5 w-5" />
                        <div class="flex flex-row gap-1">
                          <span>Login via </span>
                          <span class="capitalize">{provider}</span>
                        </div>
                      </Button>
                    );
                  }}
                </For>
              </div>
              <div class="px-8 text-center text-sm text-muted-foreground gap-2 flex flex-col">
                <span>By continuing, you agree to our</span>
                <div class="">
                  <A href="/terms-of-service" class="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </A>{" "}
                  and{" "}
                  <A href="/privacy" class="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </A>
                  .
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
