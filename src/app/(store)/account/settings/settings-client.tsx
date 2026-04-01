"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { updateName, updateEmail, changePassword, deleteAccount } from "@/app/actions/account";

const nameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type NameValues = z.infer<typeof nameSchema>;
type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50";

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

interface SettingsClientProps {
  initialName: string;
  initialEmail: string;
  hasPassword: boolean;
}

export function SettingsClient({ initialName, initialEmail, hasPassword }: SettingsClientProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Name form
  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: initialName },
  });

  async function onNameSubmit(data: NameValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    const result = await updateName(formData);
    if (result.error) toast.error(result.error);
    else toast.success(result.success);
  }

  // Email form
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail },
  });

  async function onEmailSubmit(data: EmailValues) {
    const formData = new FormData();
    formData.set("email", data.email);
    const result = await updateEmail(formData);
    if (result.error) toast.error(result.error);
    else toast.success(result.success);
  }

  // Password form
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onPasswordSubmit(data: PasswordValues) {
    const formData = new FormData();
    formData.set("currentPassword", data.currentPassword);
    formData.set("newPassword", data.newPassword);
    formData.set("confirmNewPassword", data.confirmNewPassword);
    const result = await changePassword(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      passwordForm.reset();
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    const result = await deleteAccount();
    if (result.error) toast.error(result.error);
    else toast.success(result.success ?? "Account deleted");
    setIsDeleting(false);
    setDeleteConfirm(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      {/* Update name */}
      <SectionCard title="Display name" description="How your name appears on your account.">
        <form onSubmit={nameForm.handleSubmit(onNameSubmit)} noValidate className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...nameForm.register("name")}
              className={inputCls}
              disabled={nameForm.formState.isSubmitting}
            />
            {nameForm.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{nameForm.formState.errors.name.message}</p>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={nameForm.formState.isSubmitting}
            className="gap-2"
          >
            {nameForm.formState.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save name
          </Button>
        </form>
      </SectionCard>

      {/* Update email */}
      <SectionCard title="Email address" description="Update the email associated with your account.">
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...emailForm.register("email")}
              className={inputCls}
              disabled={emailForm.formState.isSubmitting}
            />
            {emailForm.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={emailForm.formState.isSubmitting}
            className="gap-2"
          >
            {emailForm.formState.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save email
          </Button>
        </form>
      </SectionCard>

      {/* Change password */}
      <SectionCard
        title="Change password"
        description={
          hasPassword
            ? "Update your account password."
            : "No password set — you signed in with Google."
        }
      >
        {!hasPassword ? (
          <p className="text-sm text-muted-foreground">
            You signed in with Google. Password login is not available for your account.
          </p>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate className="space-y-4 max-w-sm">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1.5">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
                className={inputCls}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
                className={inputCls}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-foreground mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmNewPassword")}
                className={inputCls}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="mt-1 text-xs text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={passwordForm.formState.isSubmitting}
              className="gap-2"
            >
              {passwordForm.formState.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Change password
            </Button>
          </form>
        )}
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger zone">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">Delete account</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <div className="mt-4">
            {!deleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete account
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-foreground">Are you sure?</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Yes, delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
