import { Metadata } from "next";
import { CommunityCalendar } from "./community-calendar";

export const metadata: Metadata = {
  title: "Calendário",
};

export default function Page() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <CommunityCalendar />
    </div>
  );
}
