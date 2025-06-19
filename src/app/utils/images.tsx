import Image from '../models/Image';

import { validateUrl } from './urls';

export async function fetchImageInfo(imgSrc: string) {

  var image: Image = {
    id: Date.now(), // Using timestamp as a simple unique ID
    fileType: '',
    size: 0,
    src: ''
  }

  try {
    // Resolve imgSrc relative to baseUrl
    const validatedUrl = validateUrl(imgSrc);
    
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
      console.error("imgsrc: ", imgSrc, "Error fetching image info:", error.message);
    throw e;
  }
  return image;
}
