import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminPage,
  EmptyState,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { API_BASE } from "@/lib/auth";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

export const Route = createFileRoute("/gallery/")({
  component: GalleryPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface GalleryPhoto {
  id: number;
  filename: string;
  originalName: string;
  altText: string;
  caption: string;
  category: string;
  uploaderName: string;
  sortOrder: number;
  isActive: boolean;
  uploadedAt: string;
}

interface PromoItem {
  id: number;
  title: string;
  subtitle: string;
  imageFilename: string;
  ctaText: string;
  ctaUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// ── Section definitions ────────────────────────────────────────────────────────

interface Section {
  category: string;
  name: string;
  description: string;
  icon: string;
}

const SECTIONS: Section[] = [
  {
    category: "hero",
    name: "Homepage Banner",
    description: "The large feature photo shown at the top of the homepage in the glass frame",
    icon: "🏠",
  },
  {
    category: "gallery",
    name: "Gallery Page",
    description: "Photos shown on the Gallery page. Visitors can browse and filter these",
    icon: "🖼️",
  },
  {
    category: "cabin:couples-cabin",
    name: "Couples Cabin",
    description: "Photos for the Couples Cabin detail page",
    icon: "🛏️",
  },
  {
    category: "cabin:family-cabin",
    name: "Family Cabin",
    description: "Photos for the Family Cabin detail page",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    category: "cabin:hansel-and-gretel-cabin",
    name: "Hansel & Gretel Cabin",
    description: "Photos for the Hansel & Gretel Cabin detail page",
    icon: "🏡",
  },
  {
    category: "cabin:camping-site",
    name: "Camping Site",
    description: "Photos for the Camping Site detail page",
    icon: "⛺",
  },
  {
    category: "cabin:ranch-building",
    name: "Ranch Building",
    description: "Photos for the Ranch Building detail page",
    icon: "🏚️",
  },
  {
    category: "cabin:couples-cabin-1",
    name: "Couples Cabin (Full)",
    description: "Additional photos for the second Couples Cabin listing",
    icon: "💑",
  },
  {
    category: "cabin:family-cabin-full",
    name: "Family Cabin (Full)",
    description: "Additional photos for the full Family Cabin listing",
    icon: "👪",
  },
  {
    category: "attraction",
    name: "Attractions",
    description: "Photos for the attractions and features section of the homepage",
    icon: "🌿",
  },
  {
    category: "about",
    name: "About Section",
    description: "Photos used in the About section of the website",
    icon: "ℹ️",
  },
  {
    category: "experience",
    name: "Experiences",
    description: "Photos showcasing activities and experiences at the park",
    icon: "🔥",
  },
];

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

async function uploadPhoto(fd: FormData): Promise<GalleryPhoto> {
  const res = await fetch(`${API_BASE}/admin/gallery/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<GalleryPhoto>;
}

async function uploadPromo(fd: FormData): Promise<PromoItem> {
  const res = await fetch(`${API_BASE}/admin/gallery/promos/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<PromoItem>;
}

// ── Shared sub-component: FieldLabel ─────────────────────────────────────────

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function GalleryPage() {
  const [activeTab, setActiveTab] = useState<"photos" | "promos">("photos");

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Gallery"
        title="Visitor photos, staff shots, and promotions"
        description="Manage the gallery that appears on the public Netsurf website. Upload visitor and staff photos, create promotional banners, and control what is shown or hidden."
        meta={
          <>
            <Badge variant="secondary">Gallery management</Badge>
          </>
        }
      />

      <div className="flex gap-2">
        <Button
          variant={activeTab === "photos" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </Button>
        <Button
          variant={activeTab === "promos" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("promos")}
        >
          Promotions
        </Button>
      </div>

      {activeTab === "photos" ? <PhotosTab /> : <PromosTab />}
    </AdminPage>
  );
}

// ── Photos tab ────────────────────────────────────────────────────────────────

function PhotosTab() {
  return (
    <div className="space-y-6">
      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Photos by Section"
          description="Each card represents a section of the website. Click Upload on any card to add photos to that section."
        />
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <SectionCard key={section.category} section={section} />
          ))}
        </div>
      </PageSection>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

interface UploadModalState {
  files: FileList;
  altText: string;
  uploaderName: string;
}

function SectionCard({ section }: { section: Section }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Upload modal state
  const [pendingUpload, setPendingUpload] = useState<UploadModalState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ data: GalleryPhoto[] }>(
      "GET",
      `/admin/gallery/photos?category=${encodeURIComponent(section.category)}`
    )
      .then((res) => setPhotos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [section.category, refreshKey]);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setPendingUpload({ files: e.target.files, altText: "", uploaderName: "" });
    // Reset file input so the same files can be re-picked if modal is closed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!pendingUpload || pendingUpload.files.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const file of Array.from(pendingUpload.files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("altText", pendingUpload.altText);
        fd.append("caption", "");
        fd.append("category", section.category);
        fd.append("uploaderName", pendingUpload.uploaderName);
        await uploadPhoto(fd);
      }
      setPendingUpload(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(photo: GalleryPhoto) {
    await apiFetch("PATCH", `/admin/gallery/photos/${photo.id}`, {
      isActive: !photo.isActive,
    });
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(photo: GalleryPhoto) {
    await apiFetch("DELETE", `/admin/gallery/photos/${photo.id}`);
    setConfirmDeleteId(null);
    setRefreshKey((k) => k + 1);
  }

  // Show up to 4 thumbnails inline; remaining count shown as a badge
  const visibleThumbs = photos.slice(0, 4);
  const extraCount = photos.length > 4 ? photos.length - 4 : 0;

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Card header */}
        <div className="p-5 pb-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5" aria-hidden="true">
              {section.icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-foreground leading-snug">
                {section.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="px-5 pb-3">
          {loading ? (
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 w-16 rounded-lg bg-muted animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div
              className="h-16 w-full rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <span className="text-xs text-muted-foreground">No photos yet -- click to upload</span>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {visibleThumbs.map((photo) => (
                <Thumbnail
                  key={photo.id}
                  photo={photo}
                  confirmDeleteId={confirmDeleteId}
                  onToggleActive={handleToggleActive}
                  onRequestDelete={(id) => setConfirmDeleteId(id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDelete={handleDelete}
                />
              ))}
              {/* "+" upload trigger thumbnail */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-16 w-16 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors shrink-0"
                title="Upload more photos"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
              {extraCount > 0 && (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    +{extraCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="mt-auto px-5 pb-5 pt-1 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {loading
              ? "Loading..."
              : photos.length === 0
              ? "No photos yet"
              : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFilePick}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Upload modal */}
      {pendingUpload !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {section.icon}
                </span>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Upload to {section.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {pendingUpload.files.length} file
                    {pendingUpload.files.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              </div>

              <FieldLabel label="Describe the photo (alt text)">
                <Input
                  type="text"
                  value={pendingUpload.altText}
                  onChange={(e) =>
                    setPendingUpload((p) => p ? { ...p, altText: e.target.value } : p)
                  }
                  placeholder="e.g. View from inside the Couples Cabin at sunrise"
                />
              </FieldLabel>

              <FieldLabel label="Your name (optional)">
                <Input
                  type="text"
                  value={pendingUpload.uploaderName}
                  onChange={(e) =>
                    setPendingUpload((p) => p ? { ...p, uploaderName: e.target.value } : p)
                  }
                  placeholder="Staff member name"
                />
              </FieldLabel>

              {uploadError ? (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {uploadError}
                </div>
              ) : null}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : `Upload ${pendingUpload.files.length} Photo${
                        pendingUpload.files.length !== 1 ? "s" : ""
                      }`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPendingUpload(null);
                    setUploadError("");
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Thumbnail with hover actions ───────────────────────────────────────────────

function Thumbnail({
  photo,
  confirmDeleteId,
  onToggleActive,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  photo: GalleryPhoto;
  confirmDeleteId: number | null;
  onToggleActive: (photo: GalleryPhoto) => void;
  onRequestDelete: (id: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (photo: GalleryPhoto) => void;
}) {
  const isConfirming = confirmDeleteId === photo.id;

  return (
    <div className="relative h-16 w-16 shrink-0 group">
      <img
        src={`/uploads/gallery/${photo.filename}`}
        alt={photo.altText || photo.originalName}
        className={[
          "h-full w-full rounded-lg object-cover border border-border",
          !photo.isActive ? "opacity-40" : "",
        ].join(" ")}
        loading="lazy"
      />

      {/* Hover overlay with actions */}
      {!isConfirming && (
        <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          {/* Toggle visibility */}
          <button
            type="button"
            title={photo.isActive ? "Hide from website" : "Show on website"}
            onClick={() => onToggleActive(photo)}
            className="h-6 w-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            {photo.isActive ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          {/* Delete */}
          <button
            type="button"
            title="Delete photo"
            onClick={() => onRequestDelete(photo.id)}
            className="h-6 w-6 flex items-center justify-center rounded bg-white/20 hover:bg-destructive text-white transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {isConfirming && (
        <div className="absolute inset-0 rounded-lg bg-black/80 flex flex-col items-center justify-center gap-1 p-1">
          <span className="text-[9px] text-white font-semibold text-center leading-tight">
            Delete?
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onConfirmDelete(photo)}
              className="text-[9px] px-1.5 py-0.5 rounded bg-destructive text-white font-semibold hover:bg-destructive/80 transition-colors"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold hover:bg-white/40 transition-colors"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Hidden badge */}
      {!photo.isActive && (
        <div className="absolute top-0.5 left-0.5">
          <span className="rounded px-1 py-0.5 text-[8px] font-bold bg-black/70 text-white leading-none">
            HIDDEN
          </span>
        </div>
      )}
    </div>
  );
}

// ── Promotions tab ────────────────────────────────────────────────────────────

function PromosTab() {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formCtaText, setFormCtaText] = useState("");
  const [formCtaUrl, setFormCtaUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch<{ data: PromoItem[] }>("GET", "/admin/gallery/promos")
      .then((res) => setPromos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleAddPromo() {
    if (!formTitle.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const fd = new FormData();
      fd.append("title", formTitle.trim());
      fd.append("subtitle", formSubtitle.trim());
      fd.append("ctaText", formCtaText.trim());
      fd.append("ctaUrl", formCtaUrl.trim());
      if (formFile) fd.append("file", formFile);
      await uploadPromo(fd);
      setFormTitle("");
      setFormSubtitle("");
      setFormCtaText("");
      setFormCtaUrl("");
      setFormFile(null);
      setShowAddForm(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(promo: PromoItem) {
    await apiFetch("PATCH", `/admin/gallery/promos/${promo.id}`, { isActive: !promo.isActive });
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(promo: PromoItem) {
    await apiFetch("DELETE", `/admin/gallery/promos/${promo.id}`);
    setConfirmDeleteId(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Promotions"
          description="Promotional banners shown on the public website with optional call-to-action links."
          action={
            <Button
              variant={showAddForm ? "outline" : "default"}
              size="sm"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? "Cancel" : "Add Promotion"}
            </Button>
          }
        />

        {showAddForm ? (
          <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <h3 className="text-base font-black tracking-tight text-foreground">New Promotion</h3>

            <FieldLabel label="Title *">
              <Input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Weekend Special..."
              />
            </FieldLabel>

            <FieldLabel label="Subtitle">
              <Input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Book before Friday for 20% off..."
              />
            </FieldLabel>

            <FieldLabel label="Image (optional)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
              />
            </FieldLabel>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="CTA Button Text">
                <Input
                  type="text"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  placeholder="Book Now..."
                />
              </FieldLabel>

              <FieldLabel label="CTA URL">
                <Input
                  type="url"
                  value={formCtaUrl}
                  onChange={(e) => setFormCtaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </FieldLabel>
            </div>

            {formError ? (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full"
              onClick={handleAddPromo}
              disabled={saving || !formTitle.trim()}
            >
              {saving ? "Saving..." : "Create Promotion"}
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading promotions...
          </div>
        ) : promos.length === 0 ? (
          <EmptyState
            title="No promotions yet"
            description="Create a promotional banner to highlight special offers on the public website."
            action={
              <Button onClick={() => setShowAddForm(true)}>Add Promotion</Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {promo.imageFilename ? (
                    <img
                      src={`/uploads/promos/${promo.imageFilename}`}
                      alt={promo.title}
                      className="h-16 w-16 rounded-xl object-cover shrink-0 border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted shrink-0 border border-border flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{promo.title}</p>
                        {promo.subtitle ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">{promo.subtitle}</p>
                        ) : null}
                      </div>
                      <Badge variant={promo.isActive ? "secondary" : "outline"}>
                        {promo.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>

                    {promo.ctaText && promo.ctaUrl ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        CTA: <span className="font-semibold text-primary">{promo.ctaText}</span>
                        {" "}→ {promo.ctaUrl}
                      </p>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(promo)}
                      >
                        {promo.isActive ? "Hide" : "Show"}
                      </Button>

                      {confirmDeleteId === promo.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(promo)}
                          >
                            Confirm Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDeleteId(promo.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  );
}
