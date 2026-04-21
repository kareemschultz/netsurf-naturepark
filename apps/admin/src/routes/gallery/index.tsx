import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "visitor", label: "Visitor" },
  { value: "staff", label: "Staff" },
  { value: "promo", label: "Promotional" },
] as const;

function PhotosTab() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadCategory, setUploadCategory] = useState("visitor");
  const [uploadUploaderName, setUploadUploaderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = activeCategory !== "all" ? `?category=${activeCategory}` : "";
    apiFetch<{ data: GalleryPhoto[] }>("GET", `/admin/gallery/photos${qs}`)
      .then((res) => setPhotos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, refreshKey]);

  async function handleUpload() {
    if (!uploadFiles || uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const file of Array.from(uploadFiles)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("altText", uploadAltText);
        fd.append("caption", "");
        fd.append("category", uploadCategory);
        fd.append("uploaderName", uploadUploaderName);
        await uploadPhoto(fd);
      }
      setUploadFiles(null);
      setUploadAltText("");
      setUploadUploaderName("");
      setShowUploadForm(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(photo: GalleryPhoto) {
    await apiFetch("PATCH", `/admin/gallery/photos/${photo.id}`, { isActive: !photo.isActive });
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(photo: GalleryPhoto) {
    await apiFetch("DELETE", `/admin/gallery/photos/${photo.id}`);
    setConfirmDeleteId(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Photos"
          description="Upload and manage gallery images shown on the public website."
          action={
            <Button
              variant={showUploadForm ? "outline" : "default"}
              size="sm"
              onClick={() => setShowUploadForm((v) => !v)}
            >
              {showUploadForm ? "Cancel" : "Upload Photos"}
            </Button>
          }
        />

        {showUploadForm ? (
          <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <h3 className="text-base font-black tracking-tight text-foreground">Upload New Photos</h3>

            <FieldLabel label="Images">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
              />
            </FieldLabel>

            <FieldLabel label="Alt Text">
              <Input
                type="text"
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                placeholder="Describe the image for accessibility…"
              />
            </FieldLabel>

            <FieldLabel label="Category">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="visitor">Visitor</option>
                <option value="staff">Staff</option>
                <option value="promo">Promotional</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Uploader Name (optional)">
              <Input
                type="text"
                value={uploadUploaderName}
                onChange={(e) => setUploadUploaderName(e.target.value)}
                placeholder="Staff member name…"
              />
            </FieldLabel>

            {uploadError ? (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full"
              onClick={handleUpload}
              disabled={uploading || !uploadFiles || uploadFiles.length === 0}
            >
              {uploading
                ? "Uploading…"
                : `Upload ${uploadFiles ? uploadFiles.length : 0} Photo${uploadFiles && uploadFiles.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading photos…
          </div>
        ) : photos.length === 0 ? (
          <EmptyState
            title="No photos yet"
            description="Upload the first one to get the gallery started."
            action={
              <Button onClick={() => setShowUploadForm(true)}>Upload Photos</Button>
            }
          />
        ) : (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={`/uploads/gallery/${photo.filename}`}
                    alt={photo.altText || photo.originalName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-3 space-y-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {photo.altText || photo.originalName}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{photo.category}</Badge>
                    <Badge variant={photo.isActive ? "secondary" : "outline"}>
                      {photo.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>

                  {photo.uploaderName ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      By {photo.uploaderName}
                    </p>
                  ) : null}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleActive(photo)}
                    >
                      {photo.isActive ? "Hide" : "Show"}
                    </Button>

                    {confirmDeleteId === photo.id ? (
                      <div className="flex gap-1 flex-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(photo)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(photo.id)}
                      >
                        Delete
                      </Button>
                    )}
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
                placeholder="Weekend Special…"
              />
            </FieldLabel>

            <FieldLabel label="Subtitle">
              <Input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Book before Friday for 20% off…"
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
                  placeholder="Book Now…"
                />
              </FieldLabel>

              <FieldLabel label="CTA URL">
                <Input
                  type="url"
                  value={formCtaUrl}
                  onChange={(e) => setFormCtaUrl(e.target.value)}
                  placeholder="https://…"
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
              {saving ? "Saving…" : "Create Promotion"}
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading promotions…
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
