import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  usePostV1AlbumsMutation,
  useGetV1ThemesQuery,
} from "../src/services/genApi";
import { Select, SelectCards, SelectOption } from "./Select";

interface AlbumFormData {
  name: string;
  description?: string;
  slug: string;
  visibility: string;
  themeId?: string;
}

interface AlbumWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VISIBILITY_OPTIONS: SelectOption[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view this album with the link",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only people with the link can view this album",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you and invited collaborators can view",
  },
];

export function AlbumWizard({ onSuccess, onCancel }: AlbumWizardProps) {
  const router = useRouter();
  const [createAlbumMutation, { isLoading: isCreating }] =
    usePostV1AlbumsMutation();
  const { data: themes } = useGetV1ThemesQuery(undefined as any);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AlbumFormData>({
    name: "",
    slug: "",
    visibility: "public",
  });
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4;

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const updateFormData = (updates: Partial<AlbumFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const result = await createAlbumMutation({
        albumCreateRequest: {
          name: formData.name,
          slug: formData.slug,
          visibility: formData.visibility,
        },
      }).unwrap();

      // If theme was selected, navigate to album page so user can apply it
      if (result.id && formData.themeId) {
        router.push(`/app/albums/${result.id}?theme=${formData.themeId}`);
      } else if (result.id) {
        router.push(`/app/albums/${result.id}`);
      }

      onSuccess?.();
    } catch (e: any) {
      if (e && e.status === 401) {
        router.push("/signup?next=/app");
        return;
      }
      setError(typeof e === "string" ? e : "Failed to create album");
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.slug.trim().length > 0;
      case 3:
        return true; // Visibility has default value
      case 4:
        return true; // Theme is optional
      default:
        return false;
    }
  };

  const themeOptions: SelectOption[] =
    themes?.map((theme) => ({
      value: theme.id || "",
      label: theme.name || "Untitled Theme",
      description: theme.prompt || undefined,
    })) || [];

  return (
    <div className="card max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <button
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </button>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Album Details</h2>
              <p className="text-sm text-neutral-600">
                What&apos;s this album about?
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Album Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    updateFormData({
                      name,
                      // Auto-generate slug if it hasn't been manually edited
                      slug:
                        formData.slug === generateSlug(formData.name) ||
                        formData.slug === ""
                          ? generateSlug(name)
                          : formData.slug,
                    });
                  }}
                  placeholder="My Summer Vacation"
                  className="w-full h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  placeholder="A collection of photos from our amazing trip..."
                  className="w-full h-20 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Album URL</h2>
              <p className="text-sm text-neutral-600">
                Choose how people will find your album
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Album Slug
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500 text-sm">redrawn.app/</span>
                </div>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    updateFormData({ slug: generateSlug(e.target.value) })
                  }
                  placeholder="my-summer-vacation"
                  className="w-full h-10 rounded-md border border-neutral-300 pl-24 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Only lowercase letters, numbers, and hyphens are allowed
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
              <p className="text-sm text-neutral-600">
                Who can view this album?
              </p>
            </div>

            <SelectCards
              value={formData.visibility}
              options={VISIBILITY_OPTIONS}
              onChange={(value) => updateFormData({ visibility: value })}
              className="grid-cols-1"
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Choose Theme (Optional)</h2>
              <p className="text-sm text-neutral-600">
                Pick a style for your photos
              </p>
            </div>

            {themeOptions.length > 0 ? (
              <div className="space-y-3">
                <SelectCards
                  value={formData.themeId || ""}
                  options={[
                    {
                      value: "",
                      label: "No theme (choose later)",
                      description:
                        "You can always add a theme after creating the album",
                    },
                    ...themeOptions,
                  ]}
                  onChange={(value) =>
                    updateFormData({ themeId: value || undefined })
                  }
                  className="grid-cols-1"
                />
              </div>
            ) : (
              <div className="card p-4 bg-neutral-50">
                <p className="text-sm text-neutral-600">
                  No themes available yet. You can add themes after creating
                  your album.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary step content would be here for step 5 if added */}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn btn-neutral disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            disabled={!isStepValid()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isStepValid() || isCreating}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Album"}
          </button>
        )}
      </div>
    </div>
  );
}
