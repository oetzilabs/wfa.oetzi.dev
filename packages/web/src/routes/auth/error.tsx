import { Button } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, RouteDefinition, useSearchParams } from "@solidjs/router";

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    return { session };
  },
} satisfies RouteDefinition;

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();

  return (
    <div class="h-screen grow flex flex-col">
      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-col items-center justify-center">
          <div class="flex flex-col items-center justify-center">
            <span class="font-bold text-sm">{searchParams.error}</span>
            <span class="text-xs">{searchParams.message ?? ""}</span>
          </div>
          <Button as={A} href="/">
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
