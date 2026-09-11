"use client";

import { confirmPasswordAction } from "@/actions/confirm-password-action";
import { Button } from "@/components/button";
import {
  FormError,
  FormField,
  InputGroup,
  InputIcon,
  InputLabel,
  InputPassword,
  InputToggle,
} from "@/components/input";
import { Spinner } from "@/components/spinner";
import { toastManager } from "@/components/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { CircleCheck, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { resetSchema } from "./reset-schema";

type ResetFormProps = {
  token: string;
};

export function ResetForm({ token }: ResetFormProps) {
  const router = useRouter();
  const {
    form,
    handleSubmitWithAction,
    action: { isPending, hasSucceeded },
    resetFormAndAction,
  } = useHookFormAction(confirmPasswordAction, zodResolver(resetSchema), {
    formProps: {
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues: {
        token,
        newPassword: "",
        confirmPassword: "",
      },
    },
    actionProps: {
      onSuccess: () => {
        toastManager.add({
          description: "Senha atualizada com sucesso!",
          title: "Sucesso!",
          type: "success",
        });
        resetFormAndAction();
        router.push("/auth/signin");
      },
      onError({ error }) {
        toastManager.add({
          description: error.serverError,
          title: "Erro!",
          type: "error",
        });
      },
    },
  });

  const password = form.watch("newPassword") || "";

  const passwordValidations = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasUpperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumberAndSymbol:
        /\d/.test(password) &&
        /[!@#%$&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    }),
    [password],
  );

  useEffect(() => {
    if (hasSucceeded) {
      resetFormAndAction();
    }
  }, [hasSucceeded]);

  return (
    <form className="space-y-4" onSubmit={handleSubmitWithAction}>
      <FormField control={form.control} name="newPassword">
        <InputLabel>Nova Senha</InputLabel>
        <InputGroup>
          <InputIcon name="lock" />
          <InputPassword placeholder="Digite sua nova senha" />
          <InputToggle />
        </InputGroup>

        <div>
          <span className="text-blue-900 font-semibold text-sm">
            Sua senha deve conter:
          </span>

          <span
            className={`flex items-center gap-2 text-xs my-1 font-semibold ${
              passwordValidations.minLength
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {passwordValidations.minLength ? (
              <CircleCheck className="size-4" />
            ) : (
              <CircleX className="size-4" />
            )}
            No mínimo 8 caracteres
          </span>

          <span
            className={`flex items-center gap-2 text-xs my-1 font-semibold ${
              passwordValidations.hasUpperAndLower
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {passwordValidations.hasUpperAndLower ? (
              <CircleCheck className="size-4" />
            ) : (
              <CircleX className="size-4" />
            )}
            Letras maiúsculas e minúsculas
          </span>

          <span
            className={`flex items-center gap-2 text-xs my-1 font-semibold ${
              passwordValidations.hasNumberAndSymbol
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {passwordValidations.hasNumberAndSymbol ? (
              <CircleCheck className="size-4" />
            ) : (
              <CircleX className="size-4" />
            )}
            Números e símbolos ( Ex: !@#%$)
          </span>
        </div>
      </FormField>

      <FormField control={form.control} name="confirmPassword">
        <InputLabel>Confirmar Senha</InputLabel>
        <InputGroup>
          <InputIcon name="lock" />
          <InputPassword placeholder="Confirme sua nova senha" />
          <InputToggle />
        </InputGroup>
        <FormError />
      </FormField>

      <div className="flex flex-1 justify-between mt-10">
        <Button type="button" variant="ghost">
          Voltar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? <Spinner /> : "Confirmar"}
        </Button>
      </div>
    </form>
  );
}
