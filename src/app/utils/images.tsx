import Image from '../models/Image';

import { validateUrl } from './urls';

export async function fetchImageInfo(imageElement: HTMLImageElement, searchByDataAttribute = false): Promise<Image> {

  const image: Image = {
    id: Date.now(), // Using timestamp as a simple unique ID
    fileType: '',
    size: 0,
    src: ''
  }
  let imageSrc = imageElement.getAttribute('src') || '';

  if (searchByDataAttribute)
    imageSrc = imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-fallback-src') || '';

  if (imageSrc) {
    try {
      const validatedUrl = validateUrl(imageSrc);

      if (!validatedUrl) {
        throw new Error("Invalid image URL");
      }

      image.src = validatedUrl;

      const res = await fetch(`/api/proxy?url=${validatedUrl}`);

      if (!res.ok)
        throw new Error("Failed to fetch image");

      const blob = await res.blob();
      image.size = blob.size;

      // Remove query string and fragment before extracting file extension
      const urlWithoutParams = validatedUrl.split(/[?#]/)[0];
      image.fileType = urlWithoutParams.split('.').pop() || 'unknown';

    } catch (e) {
      const error = e as Error;
      console.error("imgsrc: ", imageSrc, "Error fetching image info:", error.message);
      throw e;
    }
  }
  else {
    return image; // Return empty image object if no src attribute found
    // If no src attribute, add to not found image count
    //  page.imagesNotFound++;
  }
  try {
    const validatedUrl = validateUrl(imageSrc);

    if (!validatedUrl) {
      throw new Error("Invalid image URL");
    }

    image.src = validatedUrl;

    const res = await fetch(`/api/proxy?url=${validatedUrl}`);

    if (!res.ok)
      throw new Error("Failed to fetch image");

    const blob = await res.blob();
    image.size = blob.size;

    // Remove query string and fragment before extracting file extension
    const urlWithoutParams = validatedUrl.split(/[?#]/)[0];
    image.fileType = urlWithoutParams.split('.').pop() || 'unknown';

  } catch (e: unknown) {
    const error = e as Error;
    console.error("imgsrc: ", imageSrc, "Error fetching image info:", error.message);
    throw e;
  }
  return image;
}
