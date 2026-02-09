import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SecuritySessionsCard } from "./security-sessions-card";
import { ApiKeysCard } from "./api-keys-card";

export function SecuritySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Security
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your sessions, devices, and API keys.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-zinc-100">
            Sessions
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Manage your active sessions and devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SecuritySessionsCard />
        </CardContent>
      </Card>

      <ApiKeysCard />
    </div>
  );
}
