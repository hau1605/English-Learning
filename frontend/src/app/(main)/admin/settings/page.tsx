"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSystemSettings,
  useUpdateSystemSetting,
} from "@/features/admin/hooks/use-admin.hook";
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Users,
  BookOpen,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface SettingGroup {
  title: string;
  description: string;
  icon: any;
  settings: {
    key: string;
    label: string;
    description: string;
    type: "string" | "number" | "boolean";
  }[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: "General",
    description: "Basic platform settings",
    icon: Settings,
    settings: [
      {
        key: "platform_name",
        label: "Platform Name",
        description: "The name of your learning platform",
        type: "string",
      },
      {
        key: "platform_description",
        label: "Description",
        description: "Brief description of your platform",
        type: "string",
      },
      {
        key: "contact_email",
        label: "Contact Email",
        description: "Support email address",
        type: "string",
      },
    ],
  },
  {
    title: "Learning",
    description: "Learning-related settings",
    icon: BookOpen,
    settings: [
      {
        key: "xp_per_flashcard",
        label: "XP per Flashcard",
        description: "XP earned per flashcard review",
        type: "number",
      },
      {
        key: "xp_per_quiz",
        label: "XP per Quiz",
        description: "Base XP earned per quiz completion",
        type: "number",
      },
      {
        key: "streak_bonus_multiplier",
        label: "Streak Bonus",
        description: "XP multiplier for streaks",
        type: "number",
      },
      {
        key: "mastery_threshold",
        label: "Mastery Threshold",
        description: "Days to master a flashcard",
        type: "number",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Notification settings",
    icon: Bell,
    settings: [
      {
        key: "notify_daily_reminder",
        label: "Daily Reminder",
        description: "Send daily study reminders",
        type: "boolean",
      },
      {
        key: "notify_streak_alert",
        label: "Streak Alert",
        description: "Alert users about streak at risk",
        type: "boolean",
      },
      {
        key: "notify_new_content",
        label: "New Content",
        description: "Notify when new content is available",
        type: "boolean",
      },
    ],
  },
  {
    title: "Security",
    description: "Security and access settings",
    icon: Shield,
    settings: [
      {
        key: "require_email_verification",
        label: "Email Verification",
        description: "Require email verification on signup",
        type: "boolean",
      },
      {
        key: "max_login_attempts",
        label: "Max Login Attempts",
        description: "Maximum failed login attempts",
        type: "number",
      },
      {
        key: "session_timeout",
        label: "Session Timeout (minutes)",
        description: "Session expiration time",
        type: "number",
      },
    ],
  },
];

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: settings, isLoading, refetch } = useSystemSettings();
  const updateMutation = useUpdateSystemSetting();

  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.data) {
      setLocalSettings(settings.data);
    }
  }, [settings]);

  const handleChange = (key: string, value: any, type: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: type === "number" ? parseInt(value) || 0 : value,
    }));
    setHasChanges(true);
  };

  const handleSave = async (key: string) => {
    try {
      await updateMutation.mutateAsync({ key, value: localSettings[key] });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSaveAll = async () => {
    const promises = Object.keys(localSettings).map((key) =>
      updateMutation.mutateAsync({ key, value: localSettings[key] }),
    );
    await Promise.all(promises);
    setHasChanges(false);
    toast.success("All settings saved successfully");
  };

  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your platform settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={!hasChanges || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          {SETTING_GROUPS.map((group) => (
            <TabsTrigger key={group.title} value={group.title.toLowerCase()}>
              {group.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTING_GROUPS.map((group) => (
          <TabsContent
            key={group.title}
            value={group.title.toLowerCase()}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <group.icon className="h-5 w-5" />
                  {group.title}
                </CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-start justify-between"
                  >
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {setting.type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            id={setting.key}
                            checked={!!localSettings[setting.key]}
                            onCheckedChange={(checked) =>
                              handleChange(setting.key, checked, "boolean")
                            }
                          />
                          <Badge
                            variant={
                              localSettings[setting.key]
                                ? "default"
                                : "secondary"
                            }
                          >
                            {localSettings[setting.key]
                              ? "Enabled"
                              : "Disabled"}
                          </Badge>
                        </div>
                      ) : setting.type === "number" ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={setting.key}
                            type="number"
                            className="w-32"
                            value={localSettings[setting.key] || ""}
                            onChange={(e) =>
                              handleChange(
                                setting.key,
                                e.target.value,
                                "number",
                              )
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(setting.key)}
                            disabled={updateMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={setting.key}
                            className="w-64"
                            value={localSettings[setting.key] || ""}
                            onChange={(e) =>
                              handleChange(
                                setting.key,
                                e.target.value,
                                "string",
                              )
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(setting.key)}
                            disabled={updateMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Raw Settings View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            All Settings (Raw)
          </CardTitle>
          <CardDescription>
            View and edit all settings in raw format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(localSettings, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
