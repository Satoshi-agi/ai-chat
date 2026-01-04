/**
 * Optimized Image component using Next.js Image
 * Provides automatic image optimization, lazy loading, and responsive images
 */

import Image from 'next/image';
import type { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * OptimizedImage component with Next.js Image optimization
 *
 * Features:
 * - Automatic image optimization
 * - Lazy loading by default
 * - Responsive images
 * - WebP/AVIF format conversion
 * - Blur placeholder (optional)
 *
 * Usage:
 * <OptimizedImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   width={800}
 *   height={600}
 * />
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
      {...props}
    />
  );
}
