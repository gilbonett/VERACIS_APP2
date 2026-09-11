"use client";

import { usePathname, useRouter } from "next/navigation";

type ButtonNavigateProps = {
  label: string;
  iconSrc: string;
  href: string;
  prominent?: boolean;
};

export function ButtonNavigate({
  label,
  iconSrc,
  href,
  prominent,
}: ButtonNavigateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="flex flex-col items-center justify-center gap-1.5"
    >
      <span
        className={`flex items-center justify-center rounded-full transition-colors ${
          prominent ? "size-14" : "size-12"
        } ${isActive ? "bg-[#1351B4]" : "bg-[#F4F4F4]"}`}
      >
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          className={`size-6 object-contain ${isActive ? "brightness-0 invert" : ""}`}
        />
      </span>
      <span
        className={`text-xs font-medium ${
          isActive ? "text-[#1351B4]" : "text-[#636363]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
