"use client";

import { requestPasswordAction } from "@/actions/request-password-action";
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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { requestPasswordSchema } from "./request-password-schema";

export function RequestPasswordForm() {
  const router = useRouter();
  const {
    form,
    handleSubmitWithAction,
    action: { isPending, hasSucceeded },
    resetFormAndAction,
  } = useHookFormAction(
    requestPasswordAction,
    zodResolver(requestPasswordSchema),
    {
      formProps: {
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
          email: "",
        },
      },
      actionProps: {
        onSuccess: () => {
          toastManager.add({
            description: "Email enviado com sucesso!",
            title: "Sucesso!",
            type: "success",
          });

          resetFormAndAction();
          router.back();
        },
        onError({ error }) {
          toastManager.add({
            description: error.serverError,
            title: "Erro!",
            type: "error",
          });
        },
      },
    },
  );

  useEffect(() => {
    if (hasSucceeded) {
      resetFormAndAction();
    }
  }, [hasSucceeded]);

  function handleBack() {
    resetFormAndAction();
    router.back();
  }

  return (
    <form onSubmit={handleSubmitWithAction} className="space-y-4">
      <FormField control={form.control} name="email">
        <InputLabel>Digite seu email de recuperação</InputLabel>
        <InputGroup>
          <InputIcon name="mail" />
          <InputControl type="email" placeholder="ex: seuemail@exemplo.com" />
        </InputGroup>
        <FormError />
      </FormField>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack}>
          Voltar
        </Button>

        <Button disabled={isPending} type="submit">
          {isPending ? <Spinner /> : "Solicitar"}
        </Button>
      </div>
    </form>
  );
}
