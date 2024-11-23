import FeatureSection from "@/components/Features";
import { Footer } from "@/components/Footer";
import TestimonialSection from "@/components/Testimonials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UsedByCompaniesSection from "@/components/UsedByCompanies";
import { generateReferralCode } from "@/lib/api/referral";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { cn } from "@/utils/cn";
import { A, createAsync, revalidate, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Share from "lucide-solid/icons/share-2";
import Sparkles from "lucide-solid/icons/sparkles";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    return { session };
  },
} satisfies RouteDefinition;

export default function Dashboard() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  return (
    <main class="w-full flex flex-col gap-0 h-full grow min-h-[calc(100vh-60px)]">
      <div class="w-full flex flex-col grow" />
      <Footer />
    </main>
  );
}
