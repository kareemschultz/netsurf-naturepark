import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { API_BASE } from "@/lib/auth";

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
    <label className="block">
      <span className="mb-2 block text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

// ── Category badge helper ─────────────────────────────────────────────────────

function categoryTone(cat: string): "neutral" | "green" | "amber" {
  if (cat === "staff") return "green";
  if (cat === "promo") return "amber";
  return "neutral";
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
            <InfoPill tone="green">Gallery management</InfoPill>
          </>
        }
      />

      <div className="flex gap-2">
        <FilterChip type="button" active={activeTab === "photos"} onClick={() => setActiveTab("photos")}>
          Photos
        </FilterChip>
        <FilterChip type="button" active={activeTab === "promos"} onClick={() => setActiveTab("promos")}>
          Promotions
        </FilterChip>
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

  // Upload form state
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
            <button
              type="button"
              onClick={() => setShowUploadForm((v) => !v)}
              className="admin-button-primary rounded-full px-5 py-2.5 text-sm font-bold"
            >
              {showUploadForm ? "Cancel" : "Upload Photos"}
            </button>
          }
        />

        {showUploadForm ? (
          <div className="mb-6 rounded-[1.6rem] border border-primary/10 bg-primary/4 p-5 space-y-4">
            <h3 className="text-base font-black tracking-tight text-foreground">Upload New Photos</h3>

            <FieldLabel label="Images">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
              />
            </FieldLabel>

            <FieldLabel label="Alt Text">
              <input
                type="text"
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                placeholder="Describe the image for accessibility…"
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              />
            </FieldLabel>

            <FieldLabel label="Category">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              >
                <option value="visitor">Visitor</option>
                <option value="staff">Staff</option>
                <option value="promo">Promotional</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Uploader Name (optional)">
              <input
                type="text"
                value={uploadUploaderName}
                onChange={(e) => setUploadUploaderName(e.target.value)}
                placeholder="Staff member name…"
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              />
            </FieldLabel>

            {uploadError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {uploadError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !uploadFiles || uploadFiles.length === 0}
              className="admin-button-primary w-full rounded-full px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading…" : `Upload ${uploadFiles ? uploadFiles.length : 0} Photo${uploadFiles && uploadFiles.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.value}
              type="button"
              active={activeCategory === cat.value}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </FilterChip>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading photos…
          </div>
        ) : photos.length === 0 ? (
          <EmptyState
            title="No photos yet"
            description="Upload the first one to get the gallery started."
            action={
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="admin-button-primary rounded-full px-4 py-2.5 text-sm font-bold"
              >
                Upload Photos
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-[1.7rem] border border-primary/10 bg-white/72 overflow-hidden shadow-[0_18px_40px_rgb(22_36_12_/6%)]"
              >
                <div className="aspect-square overflow-hidden bg-primary/4">
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
                    <InfoPill tone={categoryTone(photo.category)}>
                      {photo.category}
                    </InfoPill>
                    <InfoPill tone={photo.isActive ? "green" : "neutral"}>
                      {photo.isActive ? "Active" : "Hidden"}
                    </InfoPill>
                  </div>

                  {photo.uploaderName ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      By {photo.uploaderName}
                    </p>
                  ) : null}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(photo)}
                      className="flex-1 rounded-full border border-primary/10 bg-primary/6 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/12"
                    >
                      {photo.isActive ? "Hide" : "Show"}
                    </button>

                    {confirmDeleteId === photo.id ? (
                      <div className="flex gap-1 flex-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(photo)}
                          className="flex-1 rounded-full bg-red-600 px-2 py-1.5 text-xs font-bold text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 rounded-full border border-border px-2 py-1.5 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(photo.id)}
                        className="flex-1 rounded-full border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        Delete
                      </button>
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

  // Form state
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
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="admin-button-primary rounded-full px-5 py-2.5 text-sm font-bold"
            >
              {showAddForm ? "Cancel" : "Add Promotion"}
            </button>
          }
        />

        {showAddForm ? (
          <div className="mb-6 rounded-[1.6rem] border border-primary/10 bg-primary/4 p-5 space-y-4">
            <h3 className="text-base font-black tracking-tight text-foreground">New Promotion</h3>

            <FieldLabel label="Title *">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Weekend Special…"
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              />
            </FieldLabel>

            <FieldLabel label="Subtitle">
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Book before Friday for 20% off…"
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
              />
            </FieldLabel>

            <FieldLabel label="Image (optional)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
              />
            </FieldLabel>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="CTA Button Text">
                <input
                  type="text"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  placeholder="Book Now…"
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>

              <FieldLabel label="CTA URL">
                <input
                  type="url"
                  value={formCtaUrl}
                  onChange={(e) => setFormCtaUrl(e.target.value)}
                  placeholder="https://…"
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                />
              </FieldLabel>
            </div>

            {formError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleAddPromo}
              disabled={saving || !formTitle.trim()}
              className="admin-button-primary w-full rounded-full px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create Promotion"}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading promotions…
          </div>
        ) : promos.length === 0 ? (
          <EmptyState
            title="No promotions yet"
            description="Create a promotional banner to highlight special offers on the public website."
            action={
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="admin-button-primary rounded-full px-4 py-2.5 text-sm font-bold"
              >
                Add Promotion
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="rounded-[1.7rem] border border-primary/10 bg-white/72 p-5 shadow-[0_18px_40px_rgb(22_36_12_/6%)]"
              >
                <div className="flex items-start gap-4">
                  {promo.imageFilename ? (
                    <img
                      src={`/uploads/promos/${promo.imageFilename}`}
                      alt={promo.title}
                      className="h-16 w-16 rounded-[1.1rem] object-cover shrink-0 border border-primary/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-[1.1rem] bg-primary/6 shrink-0 border border-primary/10 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
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
                      <InfoPill tone={promo.isActive ? "green" : "neutral"}>
                        {promo.isActive ? "Active" : "Hidden"}
                      </InfoPill>
                    </div>

                    {promo.ctaText && promo.ctaUrl ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        CTA: <span className="font-semibold text-primary">{promo.ctaText}</span>
                        {" "}→ {promo.ctaUrl}
                      </p>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(promo)}
                        className="rounded-full border border-primary/10 bg-primary/6 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/12"
                      >
                        {promo.isActive ? "Hide" : "Show"}
                      </button>

                      {confirmDeleteId === promo.id ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(promo)}
                            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(promo.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          Delete
                        </button>
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
