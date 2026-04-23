const API_BASE = import.meta.env.VITE_API_URL || "";

export interface ManagedPhoto {
  id: number;
  filename: string;
  originalName: string;
  altText: string;
  caption: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  uploadedAt: string;
}

export interface ManagedPromo {
  id: number;
  title: string;
  subtitle: string | null;
  imageFilename: string | null;
  ctaText: string;
  ctaUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export function toUploadUrl(filename: string): string {
  return `${API_BASE}/uploads/gallery/${filename}`;
}

export function toPromoUrl(filename: string): string {
  return `${API_BASE}/uploads/promos/${filename}`;
}

export async function fetchManagedPhotos(category: string): Promise<ManagedPhoto[]> {
  try {
    const res = await fetch(`${API_BASE}/content/photos?category=${encodeURIComponent(category)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchManagedPromos(): Promise<ManagedPromo[]> {
  try {
    const res = await fetch(`${API_BASE}/content/promos`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
