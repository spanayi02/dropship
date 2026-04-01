import { getStoreSettings } from "@/app/actions/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Store Settings",
};

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your store configuration and pricing defaults.
        </p>
      </div>

      <div className="rounded-xl border p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
