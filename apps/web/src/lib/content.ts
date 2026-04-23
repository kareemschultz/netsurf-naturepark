const API_URL = import.meta.env.VITE_API_URL ?? ""

export interface ManagedPhoto {
  id: number;
  filename: string;
  altText: string;
  caption: string;
  category: string
}

export interface ManagedPromo {
  id: number;
  title: string;
  subtitle: string;
  imageFilename: string;
  ctaText: string;
  ctaUrl: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Failed request: ${path}`)
  }

  return response.json() as Promise<T>
}

export async function fetchManagedPhotos(category: string): Promise<ManagedPhoto[]> {
  const params = new URLSearchParams({ category })
  const result = await fetchJson<{ data: ManagedPhoto[] }>(`/content/photos?${params.toString()}`)
  return result.data
}

export async function fetchManagedPromos(): Promise<ManagedPromo[]> {
  const result = await fetchJson<{ data: ManagedPromo[] }>("/content/promos")
  return result.data
}

export function toUploadUrl(filename: string): string {
  return `/uploads/gallery/${filename}`
}

export function promoUploadUrl(filename: string): string {
  return `/uploads/promos/${filename}`
}
