import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <div className="flex flex-col justify-between h-full px-6">
      <LoginForm />

      {/*<div className="hidden  md:block  w-full h-24">
        <Image
          src={BannerLogosPNG}
          alt="banner logs"
          className="object-cover"
        />
      </div>*/}
    </div>
  );
}
