import { TextField } from "@/components/form-components/textfield";
import { Button } from "@/components/ui/button";
import { createApplication } from "@/lib/api/applications";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { createForm, SubmitHandler, valiForm } from "@modular-forms/solid";
import { createAsync, RouteDefinition, useAction } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { email, InferOutput, minLength, pipe, strictObject, string, url } from "valibot";

const MinValue = (x: number) => pipe(string(), minLength(x, `Must be at least ${x} characters`));

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const notification = await getSystemNotifications();
    const stats = await getStatistics();
    return { notification, session, stats };
  },
} satisfies RouteDefinition;

const CreateApplicationSchema = strictObject({
  name: MinValue(3),
});

type CreateApplicationForm = InferOutput<typeof CreateApplicationSchema>;

export default function CreateApplicationPage() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const [applicationForm, { Form, Field }] = createForm<CreateApplicationForm>({
    // @ts-ignore
    validate: valiForm(CreateApplicationSchema),
  });

  const createApplicationAction = useAction(createApplication);

  const handleSubmit: SubmitHandler<CreateApplicationForm> = (values, event) => {
    toast.promise(createApplicationAction(values), {
      loading: "Creating application...",
      success: "Application created successfully",
      error: "Failed to create application",
    });
  };

  return (
    <div class="w-full grow flex flex-col h-full">
      <Suspense
        fallback={
          <div class="flex flex-col w-full h-full grow items-center justify-center">
            <Loader2 class="size-4 animate-spin" />
          </div>
        }
      >
        <Show when={session() && session()}>
          {(s) => (
            <div class="p-4 pt-0 w-full h-full grow flex flex-col">
              <div class="flex flex-col w-full gap-2 rounded-sm h-full grow">
                <h2 class="text-lg font-bold leading-none">Create an Application</h2>
                <div class="flex flex-col gap-2 max-w-xl">
                  <Form class="flex flex-col gap-2 w-full" onSubmit={handleSubmit} keepResponse>
                    <Field name="name">
                      {(field, props) => (
                        <TextField
                          {...props}
                          type="text"
                          value={field.value}
                          error={field.error}
                          placeholder="Name"
                          disabled={applicationForm.submitting}
                        />
                      )}
                    </Field>
                    <Button type="submit" class="w-max" disabled={applicationForm.submitting}>
                      Create Application
                    </Button>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
