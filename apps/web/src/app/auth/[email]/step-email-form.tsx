"use client";

import { stepEmailAction } from "@/actions/step-email-action";
import { Button } from "@/components/button";
import {
  FormError,
  FormField,
  InputControl,
  InputGroup,
  InputIcon,
  InputLabel,
} from "@/components/input";
import { Spinner } from "@/components/spinner";
import { toastManager } from "@/components/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { useEffect } from "react";
import { ButtonBackForm } from "./button-back-form";
import { StepOtpForm } from "./step-otp-form";
import { stepEmailSchema } from "./step-schemas";

export function StepEmailForm() {
  const {
    form,
    handleSubmitWithAction,
    action: { isPending, hasSucceeded, result },
    resetFormAndAction,
  } = useHookFormAction(stepEmailAction, zodResolver(stepEmailSchema), {
    formProps: {
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
        email: "",
      },
    },
    actionProps: {
      onError({ error }) {
        toastManager.add({
          description: error.serverError,
          title: "Error!",
          type: "error",
        });
      },
    },
  });

  useEffect(() => {
    if (hasSucceeded) {
      resetFormAndAction();
    }
  }, []);

  const formId = "STEP_EMAIL_FORM";

  return (
    <div className="space-y-6">
      <form id={formId} onSubmit={handleSubmitWithAction} noValidate>
        <FormField disabled={hasSucceeded} control={form.control} name="email">
          <InputLabel>E-mail</InputLabel>
          <InputGroup>
            <InputIcon name="mail" />
            <InputControl type="email" placeholder="ex: seuemail@exemplo.com" />
          </InputGroup>
          <FormError />
        </FormField>
      </form>

      {!hasSucceeded ? (
        <div className="flex items-center justify-between">
          <ButtonBackForm resetFormAndAction={resetFormAndAction} />
          <Button form={formId} type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : "Enviar Código"}
          </Button>
        </div>
      ) : (
        <StepOtpForm expiresAt={result.data?.expiresAt} />
      )}
    </div>
  );
}
