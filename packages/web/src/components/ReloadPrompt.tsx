import type { Component } from "solid-js";
import { Show } from "solid-js";
import { useRegisterSW } from "virtual:pwa-register/solid";
import { Button } from "./ui/button";

const ReloadPrompt: Component = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div class="p-0 m-0 w-0 h-0">
      <Show when={offlineReady() || needRefresh()}>
        <div class="fixed right-0 bottom-0 m-4 p-3 border border-[#8885] rounded-sm">
          <div class="mb-2">
            <Show
              fallback={<span>New content available, click on reload button to update.</span>}
              when={offlineReady()}
            >
              <span>App ready to work offline</span>
            </Show>
          </div>
          <Show when={needRefresh()}>
            <Button onClick={() => updateServiceWorker(true)}>Reload</Button>
          </Show>
          <Button onClick={() => close()}>Close</Button>
        </div>
      </Show>
    </div>
  );
};

export default ReloadPrompt;
