"use client";

import { stepOtpAction } from "@/actions/step-otp-action";
import { Button } from "@/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { Input, InputControl } from "@/components/input";
import { Spinner } from "@/components/spinner";
import { toastManager } from "@/components/toast";
import { formatCode } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Clock4, TimerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonBackForm } from "./button-back-form";
import { stepOtpSchema } from "./step-schemas";
import { SuccessVerifyDialog } from "./success-verify-dialog";

type StepOtpFormProps = {
  expiresAt?: string;
};

export function StepOtpForm({ expiresAt }: StepOtpFormProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const {
    form,
    handleSubmitWithAction,
    action: { isPending, hasSucceeded },
    resetFormAndAction,
  } = useHookFormAction(stepOtpAction, zodResolver(stepOtpSchema), {
    formProps: {
      defaultValues: {
        code: "",
      },
    },
    actionProps: {
      onSuccess() {
        setIsSuccessOpen(true);
      },
      onError({ error }) {
        console.log(error);
        toastManager.add({
          description: error.serverError,
          title: "Error!",
          type: "error",
        });
      },
    },
  });

  useEffect(() => {
    const initialTime = Math.max(
      0,
      Math.floor(
        (new Date(expiresAt ?? new Date().toISOString()).getTime() -
          Date.now()) /
          1000,
      ),
    );

    setTimeLeft(initialTime);
    setIsMounted(true);
  }, [expiresAt]);

  useEffect(() => {
    if (!isMounted || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted, timeLeft]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) {
      return `${mins}m e ${secs.toString().padStart(2, "0")}s`;
    }
    return `${secs}s`;
  }

  const isCodeExpired = timeLeft === 0;

  function handleRedirectSuccess() {
    setIsSuccessOpen(false);
    resetFormAndAction();
    router.push("/map");
  }

  useEffect(() => {
    if (hasSucceeded) {
      resetFormAndAction();
    }
  }, []);

  return (
    <div className="space-y-4">
      {isSuccessOpen && (
        <SuccessVerifyDialog
          isOpen={isSuccessOpen}
          onRedirect={handleRedirectSuccess}
        />
      )}

      <div className="w-full h-16 flex items-center justify-center gap-2 bg-slate-200 rounded-md">
        {isCodeExpired ? <TimerOff size={16} /> : <Clock4 size={16} />}
        <span className="font-sans">
          {isCodeExpired ? "Código Expirado" : "Código enviado:"}
        </span>

        <strong className="font-sans">
          {!isCodeExpired && `Expira em ${formatTime(timeLeft)}`}
        </strong>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmitWithAction} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recebeu seu código?</FormLabel>
                <FormControl>
                  <Input>
                    <InputControl
                      placeholder="000-000"
                      className="tracking-widest text-center font-semibold"
                      maxLength={7}
                      {...field}
                      onChange={(e) => {
                        const value = formatCode(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </Input>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center">
            <ButtonBackForm resetFormAndAction={resetFormAndAction} />
            <Button
              disabled={isPending}
              type="submit"
              className="rounded-full w-32"
            >
              {isPending ? (
                <>
                  <Spinner /> Verificando
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
