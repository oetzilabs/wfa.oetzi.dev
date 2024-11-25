import { TextField } from "@/components/form-components/textfield";
import { Button } from "@/components/ui/button";
import { createOrganization } from "@/lib/api/organizations";
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

const CreateOrganizationSchema = strictObject({
  name: MinValue(3),
  email: pipe(string(), email("Please enter a valid email")),
  website: pipe(string(), url("Please enter a valid url")),
});

type CreateOrganizationForm = InferOutput<typeof CreateOrganizationSchema>;

export default function CreateOrganizationPage() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const [loginForm, { Form, Field }] = createForm<CreateOrganizationForm>({
    // @ts-ignore
    validate: valiForm(CreateOrganizationSchema),
  });

  const createOrganizationAction = useAction(createOrganization);

  const handleSubmit: SubmitHandler<CreateOrganizationForm> = (values, event) => {
    toast.promise(createOrganizationAction(values), {
      loading: "Creating organization...",
      success: "Organization created successfully",
      error: "Failed to create organization",
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
            <div class="p-1 w-full h-full grow flex flex-col">
              <div class="flex flex-col w-full gap-2 p-4 rounded-sm h-full grow">
                <h2 class="text-lg font-bold leading-none">Create an Organization</h2>
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
                          disabled={loginForm.submitting}
                        />
                      )}
                    </Field>
                    <Field name="email">
                      {(field, props) => (
                        <TextField
                          {...props}
                          type="email"
                          value={field.value}
                          error={field.error}
                          placeholder="Email"
                          disabled={loginForm.submitting}
                        />
                      )}
                    </Field>
                    <Field name="website">
                      {(field, props) => (
                        <TextField
                          {...props}
                          type="text"
                          value={field.value}
                          error={field.error}
                          placeholder="Website"
                          disabled={loginForm.submitting}
                        />
                      )}
                    </Field>
                    <Button type="submit" class="w-max" disabled={loginForm.submitting}>
                      Create Organization
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
