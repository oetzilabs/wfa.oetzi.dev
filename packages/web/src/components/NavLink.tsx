import { A, AnchorProps, useLocation, useResolvedPath } from "@solidjs/router";
import { splitProps } from "solid-js";
import { cn } from "../lib/utils";

export type NavLinkProps = AnchorProps & {
  exact?: boolean;
};

export default function NavLink(props: NavLinkProps) {
  const [local, others] = splitProps(props, ["href", "class", "children", "exact"]);
  const location = useLocation();
  const rp = useResolvedPath(() => location.pathname);
  const isActive = () => (local.exact ? rp() === local.href : (rp()?.startsWith(local.href) ?? false));

  return (
    <A
      class={cn(
        "flex flex-col items-start gap-2 p-3 rounded-sm w-full select-none leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800",
        {
          "bg-neutral-100 dark:bg-neutral-900": isActive(),
        },
      )}
      {...others}
      href={local.href}
    >
      <div class={cn("flex flex-row w-full items-start gap-2", { "font-bold": isActive() })}>{local.children}</div>
    </A>
  );
}
