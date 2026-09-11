"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import { cn } from "@/lib/utils";
import HomeSVG from "@/public/assets/home.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";

const routeNames: Record<string, string> = {
  map: "Mapa",
  profile: "Perfil",
  dashboard: "Dashboard",
  calendar: "Calendário",
};

function formatSegment(segment: string): string {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    )
  ) {
    return `ID: ${segment.slice(0, 8)}...`;
  }

  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  if (routeNames[segment]) {
    return routeNames[segment];
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface DynamicBreadcrumbProps {
  separator?: React.ReactNode;
  className?: string;
  homeLabel?: string;
}

export function DynamicBreadcrumb({
  separator = ">",
  className,
  homeLabel = "Início",
}: DynamicBreadcrumbProps = {}) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter((segment) => segment !== "");
  const isHomePage = segments.length === 0;

  return (
    <Breadcrumb className={cn("hidden md:flex", className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isHomePage ? (
            <BreadcrumbPage className="flex items-center text-primary font-medium">
              <Image src={HomeSVG} alt="Home" className="size-10" />
              <span className="mr-2" aria-hidden>
                &gt;
              </span>
              {homeLabel}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              href="/"
              className="flex items-center hover:text-primary transition-colors"
            >
              <Image src={HomeSVG} alt="Home" className="size-10" />
              <span className="mr-2" aria-hidden>
                &gt;
              </span>
              {homeLabel}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          const segmentName = formatSegment(segment);

          return (
            <div key={href} className="flex items-center">
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-primary font-semibold ml-2">
                    {segmentName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={href}
                    className="hover:text-primary font-semibold transition-colors ml-2"
                  >
                    {segmentName}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
