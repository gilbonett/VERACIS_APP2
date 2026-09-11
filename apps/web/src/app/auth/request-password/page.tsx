import { RequestPasswordForm } from "./request-password-form";

export default function Page() {
  return (
    <div className="w-full flex flex-1 flex-col space-y-2 px-6">
      <strong className="text-base font-bold">Esqueceu sua senha?</strong>

      <RequestPasswordForm />
    </div>
  );
}
