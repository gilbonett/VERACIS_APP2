import { Metadata } from "next";
import { Overview } from "./overview";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function CalendarPage() {
  return (
    <div className="flex flex-col flex-1 gap-2 pb-6">
      <Overview />
    </div>
  );
}
