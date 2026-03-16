import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconUsers, IconMail, IconChartBar } from "@tabler/icons-react";

const sections = [
  {
    title: "Users",
    description: "Manage users, roles, and ban status.",
    href: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Mail",
    description: "Configure mail and event-triggered email rules.",
    href: "/admin/mail",
    icon: IconMail,
  }, 
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Admin
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage users, mail triggers, and analytics.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                    <CardTitle className="text-zinc-900 dark:text-zinc-100">
                      {section.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
