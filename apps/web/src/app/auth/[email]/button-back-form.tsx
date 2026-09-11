"use client";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";

type ButtonBackFormProps = {
  resetFormAndAction: () => void;
};

export function ButtonBackForm({ resetFormAndAction }: ButtonBackFormProps) {
  const router = useRouter();

  function handleBack() {
    router.back();
    resetFormAndAction();
  }

  return (
    <Button type="button" variant="ghost" onClick={handleBack}>
      Voltar
    </Button>
  );
}
