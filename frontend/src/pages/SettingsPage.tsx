import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Bell, Shield, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    studyReminders: true,
    revisionAlerts: true,
    examCountdowns: true,
    weeklyReport: false,
  });
  const { toast } = useToast();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function saveProfile(data: ProfileForm) {
    try {
      await api.put("/auth/profile", data);
      await refreshUser();
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({ title: "Failed to update profile", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function changePassword(data: PasswordForm) {
    try {
      await api.put("/auth/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast({ title: "Password changed successfully" });
    } catch (err) {
      toast({ title: "Failed to change password", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete your account, all subjects, topics, and progress. This cannot be undone."
    );
    if (!confirmed) return;
    try {
      await api.delete("/auth/account");
      logout();
    } catch (err) {
      toast({ title: "Failed to delete account", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                activeTab === id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                id === "danger" && activeTab === id && "text-destructive"
              )}
            >
              <Icon size={14} className={id === "danger" ? "text-destructive" : ""} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Profile Information</h3>
                  <p className="text-xs text-muted-foreground">Update your name and email address</p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                    <span className="text-primary text-xl font-mono font-semibold">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user?.plan} plan</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                      FULL NAME
                    </label>
                    <input
                      {...profileForm.register("name")}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                      EMAIL ADDRESS
                    </label>
                    <input
                      {...profileForm.register("email")}
                      type="email"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                      className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save size={13} />
                      {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Notification Preferences</h3>
                  <p className="text-xs text-muted-foreground">Control which alerts you receive</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "studyReminders" as const,
                      label: "Study Reminders",
                      desc: "Get notified when it's time to study",
                    },
                    {
                      key: "revisionAlerts" as const,
                      label: "Revision Alerts",
                      desc: "Reminders to review completed topics",
                    },
                    {
                      key: "examCountdowns" as const,
                      label: "Exam Countdowns",
                      desc: "Daily countdown alerts before exams",
                    },
                    {
                      key: "weeklyReport" as const,
                      label: "Weekly Progress Report",
                      desc: "Summary of your study week every Sunday",
                    },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                        className={cn(
                          "relative w-10 h-5 rounded-full transition-colors",
                          notifPrefs[key] ? "bg-primary" : "bg-secondary border border-border"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            notifPrefs[key] ? "translate-x-5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => toast({ title: "Notification preferences saved" })}
                  className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
                >
                  <Save size={13} />
                  Save Preferences
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Keep your account secure</p>
                </div>

                <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                  {[
                    { name: "currentPassword" as const, label: "CURRENT PASSWORD" },
                    { name: "newPassword" as const, label: "NEW PASSWORD" },
                    { name: "confirmPassword" as const, label: "CONFIRM NEW PASSWORD" },
                  ].map(({ name, label }) => (
                    <div key={name}>
                      <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register(name)}
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors[name] && (
                        <p className="text-destructive text-xs mt-1">
                          {passwordForm.formState.errors[name]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                    className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Shield size={13} />
                    {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </form>

                {/* Session info */}
                <div className="pt-4 border-t border-border">
                  <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">ACTIVE SESSION</p>
                  <div className="bg-secondary rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">Current session</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">JWT · Expires in 7 days</p>
                    </div>
                    <button
                      onClick={logout}
                      className="text-xs text-muted-foreground hover:text-destructive font-mono border border-border rounded px-2 py-1 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="bg-card border border-destructive/20 rounded-xl p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-destructive mb-1">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">Irreversible actions — proceed with caution</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete all study data</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Remove all subjects, topics, and sessions — keeps your account
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete all study data? This cannot be undone.")) return;
                        try {
                          await api.delete("/subjects/all");
                          toast({ title: "All study data deleted" });
                        } catch {
                          toast({ title: "Failed", variant: "destructive" });
                        }
                      }}
                      className="text-xs text-destructive border border-destructive/30 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors font-mono whitespace-nowrap"
                    >
                      Clear data
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <button
                      onClick={deleteAccount}
                      className="flex items-center gap-1.5 text-xs text-white bg-destructive rounded-lg px-3 py-1.5 hover:bg-destructive/90 transition-colors font-mono whitespace-nowrap"
                    >
                      <Trash2 size={11} />
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
