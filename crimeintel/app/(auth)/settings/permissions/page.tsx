import { RoleManager } from "@/components/settings/RoleManager";

export const metadata = {
  title: "Permissions | CrimeIntel",
  description: "Manage system access and permissions.",
};

export default function PermissionsPage() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Access Control & Permissions</h2>
        <p className="text-muted-foreground mt-1">Configure roles and govern user access across the platform.</p>
      </div>

      <RoleManager />
    </div>
  );
}
