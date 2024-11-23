import { language, setLanguage } from "@/components/stores/Language";
import { Combobox, ComboboxContent, ComboboxItem, ComboboxTrigger } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrencies, getLanguage, setPreferedCurrency } from "@/lib/api/application";
import { getAuthenticatedSession, getAuthenticatedSessions, logoutSession } from "@/lib/auth/util";
import { createAsync, revalidate, RouteDefinition, useAction, useSearchParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import Languages from "lucide-solid/icons/languages";
import Loader2 from "lucide-solid/icons/loader-2";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const language = await getLanguage();
    return { session, language };
  },
} satisfies RouteDefinition;

const LANGUAGES = [
  {
    label: "English",
    value: "en-US",
  },
  {
    label: "Deutsch",
    value: "de-DE",
  },
];

const UserAgentDisplay = (props: { userAgent: string }) => {
  const browserMatchers = [
    { name: "Chrome", regex: /Chrome\/([\d.]+)/ },
    { name: "Firefox", regex: /Firefox\/([\d.]+)/ },
    { name: "Safari", regex: /Version\/([\d.]+).*Safari/ },
    { name: "Edge", regex: /Edg\/([\d.]+)/ },
    { name: "Opera", regex: /OPR\/([\d.]+)/ },
  ];

  const osMatchers = [
    { name: "Windows", regex: /Windows NT ([\d.]+)/ },
    { name: "macOS", regex: /Mac OS X ([\d_]+)/ },
    { name: "Linux", regex: /Linux/ },
    { name: "Android", regex: /Android ([\d.]+)/ },
    { name: "iOS", regex: /iPhone OS ([\d_]+)/ },
  ];
  const formatUserAgent = createMemo(() => {
    const userAgent = props.userAgent;

    let browser = "Unknown Browser";
    let browserVersion = "";
    for (const { name, regex } of browserMatchers) {
      const match = userAgent.match(regex);
      if (match) {
        browser = name;
        browserVersion = match[1].replace(/_/g, ".");
        break;
      }
    }

    let os = "Unknown OS";
    let osVersion = "";
    for (const { name, regex } of osMatchers) {
      const match = userAgent.match(regex);
      if (match) {
        os = name;
        osVersion = match[1]?.replace(/_/g, ".") || "";
        break;
      }
    }

    return `${browser} ${browserVersion} on ${os} ${osVersion}`.trim();
  });

  return <span>{formatUserAgent()}</span>;
};

export default function Settings() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const sessions = createAsync(() => getAuthenticatedSessions(), { deferStream: true });
  const logoutSessionAction = useAction(logoutSession);
  const logoutSessionStatus = useSubmission(logoutSession);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = () => (searchParams.tab as string | undefined) ?? "account";

  const [loading, setLoading] = createSignal(false);

  const setPreferedCurrencyAction = useAction(setPreferedCurrency);
  const setPreferedCurrencyStatus = useSubmission(setPreferedCurrency);

  return (
    <div class="w-full flex flex-col gap-2 h-full grow py-4 lg:pt-0">
      <Suspense
        fallback={
          <div class="flex flex-col w-full py-10 gap-4 items-center justify-center">
            <Loader2 class="size-4 animate-spin" />
          </div>
        }
      >
        <Show when={session() && session()!.user !== null && session()}>
          {(s) => (
            <Tabs
              defaultValue={currentTab()}
              value={currentTab()}
              onChange={(v) => {
                setSearchParams({ tab: v });
              }}
              orientation="vertical"
              class="w-full h-full grow gap-2"
            >
              <TabsList class="min-w-[200px] w-fit h-full gap-0 rounded-none">
                <TabsTrigger
                  value="account"
                  class="text-left items-start justify-start data-[selected]:font-bold data-[selected]:bg-black data-[selected]:text-white dark:data-[selected]:bg-neutral-700 dark:data-[selected]:text-white rounded-sm py-2 h-auto"
                >
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  class="text-left items-start justify-start data-[selected]:font-bold data-[selected]:bg-black data-[selected]:text-white dark:data-[selected]:bg-neutral-700 dark:data-[selected]:text-white rounded-sm py-2 h-auto"
                >
                  Sessions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="account" class="w-full py-2">
                <div class="flex flex-col gap-2">
                  <h1 class="text-2xl font-bold">Language</h1>
                  <div class="flex flex-row gap-2">
                    <Combobox<{ label: string; value: string }>
                      value={LANGUAGES.find((l) => l.value === language())!}
                      disabled={loading()}
                      optionValue="value"
                      optionLabel="label"
                      options={LANGUAGES}
                      onChange={async (v) => {
                        if (!v) return;
                        setLoading(true);
                        setLanguage(v.value);
                        await revalidate([getLanguage.key]);
                        setLoading(false);
                      }}
                      itemComponent={(props) => (
                        <ComboboxItem item={props.item}>{props.item.rawValue.label}</ComboboxItem>
                      )}
                    >
                      <ComboboxTrigger class="flex flex-row gap-2 items-center h-8 px-2 bg-white dark:bg-black">
                        <Languages class="size-3" />
                        <span class="text-sm">{LANGUAGES.find((l) => l.value === language())?.value}</span>
                      </ComboboxTrigger>
                      <ComboboxContent />
                    </Combobox>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sessions" class="w-full py-2">
                <div class="flex flex-col gap-2">
                  <h1 class="text-2xl font-bold">Sessions</h1>
                  <div class="flex flex-col gap-2">
                    <Show when={session() && session()}>
                      {(currentSession) => (
                        <Show when={sessions() && sessions()}>
                          {(ses) => (
                            <For each={ses()}>
                              {(s) => (
                                <div class="w-full flex flex-col gap-2 rounded-sm bg-neutral-100 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800">
                                  <div class="w-full flex flex-row gap-2 justify-between">
                                    <div class="flex flex-row gap-2 items-center text-sm">
                                      {dayjs(s.createdAt).format("LLLL")}
                                    </div>
                                    <Show when={currentSession().id === s.id}>
                                      <Badge class="flex flex-row gap-2 items-center text-sm uppercase">current</Badge>
                                    </Show>
                                  </div>
                                  <div class="flex flex-row gap-2 items-center text-xs">
                                    <time
                                      datetime={dayjs(s.expiresAt).toISOString()}
                                      title={dayjs(s.expiresAt).format("LLLL")}
                                    >
                                      expires {dayjs(s.expiresAt).fromNow()}
                                    </time>
                                  </div>
                                  <div class="flex flex-col gap-2 items-start text-sm w-full">
                                    <Show when={s.browser}>
                                      {(browser) => <UserAgentDisplay userAgent={browser()} />}
                                    </Show>
                                    <span>IP: {s.ip}</span>
                                    <span>Fingerprint: {s.fingerprint}</span>
                                  </div>
                                  <div class="flex flex-row gap-2 items-center text-sm w-full justify-end">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        toast.promise(logoutSessionAction(s.id), {
                                          loading: "Logging out...",
                                          success: "Logged out",
                                          error: "Could not log out",
                                        });
                                      }}
                                      disabled={logoutSessionStatus.pending || logoutSessionStatus.input?.[0] === s.id}
                                    >
                                      Logout
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </For>
                          )}
                        </Show>
                      )}
                    </Show>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
