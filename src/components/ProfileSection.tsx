import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import * as z from "zod"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Pencil, Check, X } from "lucide-react"

const nameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
})

type NameFormData = z.infer<typeof nameSchema>

export function ProfileSection() {
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateMyName = useMutation(api.users.updateMyName)
  
  const [isEditing, setIsEditing] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleEdit = () => {
    form.reset({ name: currentUser?.name || "" })
    setServerError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setServerError(null)
    form.reset()
  }

  const handleSave = async (data: NameFormData) => {
    setServerError(null)

    try {
      await updateMyName({ name: data.name })
      setIsEditing(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to update name")
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form id="profile-name-form" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(handleSave)(e); }}>
            <div className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="profile-name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Your name"
                      autoFocus
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {serverError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <p className="text-destructive text-sm">{serverError}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  form="profile-name-form"
                  size="sm"
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {currentUser.name || "No name set"}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {currentUser.email && (
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium text-sm">{currentUser.email}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

