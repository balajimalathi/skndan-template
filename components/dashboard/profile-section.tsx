"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Session, User } from "better-auth";
import { toast } from "sonner";
import { z } from "zod";
import {
  updateProfileSettings,
  type ProfileSettingsValues,
} from "@/app/(dashboard)/dashboard/settings/profile/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONE_OPTIONS = [
  { value: "pst", label: "Pacific Standard Time (PST)" },
  { value: "mst", label: "Mountain Standard Time (MST)" },
  { value: "cst", label: "Central Standard Time (CST)" },
  { value: "est", label: "Eastern Standard Time (EST)" },
  { value: "gmt", label: "Greenwich Mean Time (GMT)" },
];

export function ProfileSection({
  session,
  initialTimezone,
}: {
  session: { user: User; session: Session };
  initialTimezone?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Enter a valid email"),
        timezone: z.string().optional().nullable(),
      }),
    ),
    defaultValues: {
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      timezone: initialTimezone ?? undefined,
    },
  });

  async function onSubmit(values: ProfileSettingsValues) {
    startTransition(async () => {
      const result = await updateProfileSettings(values);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update profile");
        return;
      }
      toast.success("Profile updated");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Profile
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal information and how it appears to others.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-transparent">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-zinc-100">
            Profile Picture
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            This will be displayed on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
          <Avatar className="h-24 w-24 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={session.user.image!} alt="User" />

            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xl text-zinc-800 dark:text-zinc-200">
              {session.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload new image
            </Button>
            <Button
              variant="ghost"
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800 border dark:bg-transparent">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-zinc-100">
            Personal Information
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Update your personal details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        disabled={true}
                        className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time zone</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger
                          id="timezone"
                          className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        >
                          <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 px-0 pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

