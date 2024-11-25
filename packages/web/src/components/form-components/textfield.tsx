import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import * as Kobalte2 from "../ui/textarea";
import * as Kobalte from "../ui/textfield";

type TextFieldProps = {
  name: string;
  type?: "text" | "email" | "tel" | "password" | "url" | "date" | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  value: string | undefined;
  error: string;
  multiline?: boolean | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  ref: (element: HTMLInputElement | HTMLTextAreaElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement | HTMLTextAreaElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement | HTMLTextAreaElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement | HTMLTextAreaElement, FocusEvent>;
};

export function TextField(props: TextFieldProps) {
  const [rootProps, inputProps] = splitProps(
    props,
    ["name", "value", "required", "disabled"],
    ["placeholder", "ref", "onInput", "onChange", "onBlur"],
  );
  return (
    <Kobalte.TextFieldRoot {...rootProps} validationState={props.error ? "invalid" : "valid"}>
      <Show when={props.label}>
        <Kobalte.TextFieldLabel>{props.label}</Kobalte.TextFieldLabel>
      </Show>
      <Show when={props.multiline} fallback={<Kobalte.TextField {...inputProps} type={props.type} />}>
        <Kobalte2.TextArea {...inputProps} autoResize />
      </Show>
      <Kobalte.TextFieldErrorMessage>{props.error}</Kobalte.TextFieldErrorMessage>
    </Kobalte.TextFieldRoot>
  );
}
