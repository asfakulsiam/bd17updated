
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates an image source URL. If the source is invalid or missing,
 * it returns a default placeholder URL.
 * @param src The image source URL to validate.
 * @returns A valid image URL or a placeholder.
 */
export function getValidImageSrc(src?: string | null): string {
  const placeholder = "https://placehold.co/600x400.png";
  if (src && (src.startsWith('http') || src.startsWith('/'))) {
    return src;
  }
  return placeholder;
}
