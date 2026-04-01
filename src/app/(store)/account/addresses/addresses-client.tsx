"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createAddress, updateAddress, deleteAddress } from "@/app/actions/addresses";
import type { Address } from "@prisma/client";

const addressFormSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50";

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function AddressForm({ defaultValues, onSubmit, onCancel, isLoading, submitLabel }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Label (optional)
          </label>
          <input
            type="text"
            {...register("label")}
            className={inputCls}
            placeholder="Home, Work, etc."
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            First name <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("firstName")} className={inputCls} disabled={isLoading} />
          {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Last name <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("lastName")} className={inputCls} disabled={isLoading} />
          {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Street address <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("street")} className={inputCls} disabled={isLoading} />
          {errors.street && <p className="mt-1 text-xs text-destructive">{errors.street.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            City <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("city")} className={inputCls} disabled={isLoading} />
          {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            State <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("state")} className={inputCls} disabled={isLoading} />
          {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Postal code <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("postalCode")} className={inputCls} disabled={isLoading} />
          {errors.postalCode && <p className="mt-1 text-xs text-destructive">{errors.postalCode.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Country <span className="text-destructive">*</span>
          </label>
          <input type="text" {...register("country")} className={inputCls} disabled={isLoading} />
          {errors.country && <p className="mt-1 text-xs text-destructive">{errors.country.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Phone (optional)
          </label>
          <input type="tel" {...register("phone")} className={inputCls} disabled={isLoading} />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            {...register("isDefault")}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            disabled={isLoading}
          />
          <label htmlFor="isDefault" className="text-sm text-foreground">
            Set as default address
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface AddressesClientProps {
  initialAddresses: Address[];
}

export function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(data: AddressFormValues) {
    setIsAddLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.set(k, String(v));
    });

    const result = await createAddress(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setShowAddForm(false);
      // Reload addresses by refreshing — in a real app use router.refresh() or optimistic update
      window.location.reload();
    }
    setIsAddLoading(false);
  }

  async function handleUpdate(id: string, data: AddressFormValues) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.set(k, String(v));
    });

    const result = await updateAddress(id, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setEditingId(null);
      window.location.reload();
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your saved delivery addresses.
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">New address</h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            isLoading={isAddLoading}
            submitLabel="Save address"
          />
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold">No saved addresses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an address to speed up checkout.
          </p>
          <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {editingId === addr.id ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">Edit address</h2>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <AddressForm
                    defaultValues={{
                      label: addr.label ?? undefined,
                      firstName: addr.firstName,
                      lastName: addr.lastName,
                      street: addr.street,
                      city: addr.city,
                      state: addr.state,
                      country: addr.country,
                      postalCode: addr.postalCode,
                      phone: addr.phone ?? undefined,
                      isDefault: addr.isDefault,
                    }}
                    onSubmit={(data) => handleUpdate(addr.id, data)}
                    onCancel={() => setEditingId(null)}
                    isLoading={isPending}
                    submitLabel="Update address"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-6">
                  <div className="text-sm space-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {addr.firstName} {addr.lastName}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                          Default
                        </span>
                      )}
                      {addr.label && (
                        <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {addr.label}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{addr.street}</p>
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-muted-foreground">{addr.country}</p>
                    {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(addr.id)}
                      aria-label="Edit address"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id || isPending}
                      aria-label="Delete address"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
