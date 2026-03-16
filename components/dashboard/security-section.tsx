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
        <h2 className="text-2xl font-bold tracking-tight">
          Security
        </h2>
        <p className="text-sm text-muted">
          Manage your sessions, devices, and API keys.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Sessions
          </CardTitle>
          <CardDescription>
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
