import { DataTable } from "@/components/ui/data-table";
import { SectionCards } from "@/components/dashboard/section-cards";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default async function Page() {
  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-lg font-medium">Appearance</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Choose your preferred appearance settings.
        </p>
        <ModeToggle />
      </div>
    </>
  );
}
