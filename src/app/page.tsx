
"use client";
import React, { useState } from 'react';

// components/ui/input.tsx
export function Input(props: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="border px-3 py-2 rounded w-full" />;
}

// components/ui/button.tsx
export function Button({ children, ...props }: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
    >
      {children}
    </button>
  );
}

// components/ui/card.tsx
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-xl shadow-sm bg-white">{children}</div>;
}

// Helper function to validate and normalize URLs
function validateUrl(input: string): string | null {
  try {
    // If input doesn't have a protocol, add http:// by default
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return "";
  }
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 text-black ${className}`}>{children}</div>;
}

async function fetchImage(baseUrl: string, imgSrc: string) {
  try {
    // Resolve imgSrc relative to baseUrl
    const resolvedUrl = new URL(imgSrc, baseUrl).href;
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(resolvedUrl)}`);
    if (!res.ok) throw new Error("Failed to fetch image");
    return res;
  } catch (e) {
    throw e;
  }
}

function UrlFetcher() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  //const [details, setDetails] = useState<Page | null>(null);
  //   const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type Image = {
    label: string;
    fileType: string;
    size: number;
    src: string;
  }

  type Link = {
    title: string;
    src: string;
    isExternal: boolean;
  }

  type Page = {
    title: string;
    url: string;
    images: Image[];
    internalLinks: Link[];
    externalLinks: Link[];
  };

  const fetchDocument = async (inputUrl: string) => {
    setLoading(true);
    setError(null);
    setContent(null); // Clear previous content
    setPage(null); // Clear previous page details

    const validatedUrl = validateUrl(inputUrl);

    // Check if the URL is valid
    if (!validatedUrl) {
      setError("Invalid URL format");
      setLoading(false);
      return;
    }

    try {
      // Proxy the request through API route to avoid CORS issues

      const response = await fetch(`/api/proxy?url=${encodeURIComponent(validatedUrl)}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch details: ${response.status} ${errorText}`);
      }

      const htmlText = await response.text();

      var page: Page = {
        title: '',
        url: validatedUrl,
        images: [],
        internalLinks: [],
        externalLinks: []
      };

      // Parse the HTML to extract image URLs
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      page.title = doc.querySelector('title')?.textContent || 'No title found';

      const imgElements = doc.querySelectorAll('img');

      if (imgElements.length > 0) {
        const extractedImages = Array.from(imgElements).map(img => img);

        extractedImages.forEach(async (img, index) => {

          var image: Image = {
            label: `${img.title}`,
            fileType: '',
            size: 0,
            src: `${img.src}`
          };

          if (img.src) {
            const validatedImgSrc = validateUrl(img.src);
            if (validatedImgSrc) {
              try {
                const imageRes = await fetchImage(url, validatedImgSrc);
                const imgBlob = await imageRes.blob();
                image.size = imgBlob.size;
                image.fileType = imgBlob.type;
              } catch (e) {
                image.size = -1; // Indicate error in fetching image
                image.fileType = 'Image not found';
              }
            } else {
              image.size = -1;
              image.fileType = 'Invalid image URL';
            }
          }
          page.images.push(image);
        });
        console.log("Page extracted:", page);
        setPage(page);
      }

      //setDetails(data);
    } catch (err: any) {
      setError(err?.message || "An error occurred");
    }
    setLoading(false);
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log("Fetching details for URL:", url)
    fetchDocument(url);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">URL Inspector</h1>
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="Enter a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>Analyze</Button>
      </form>

      {loading && <p>Analyzing...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {page && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Page: {page.title}</h2>
            <ul>
              {page.images.map((img, i) => (
                <li key={i} className="mb-2">
                  <div>
                    <span className="font-semibold">{img.label || img.src}</span>
                    <div className="text-sm">
                      Type: {img.fileType || "unknown"}, Size: {img.size >= 0 ? `${img.size} bytes` : "N/A"}
                    </div>
                    <div>
                      <a href={img.src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        View Image
                      </a>
                    </div>
                  </div>
                </li>
              ))}</ul>

            <h2 className="text-xl font-semibold mt-4 mb-2">Internal Links</h2>
            <ul>
              {page.internalLinks.map((link, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => fetchDocument(link.title)}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {link.title}
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold mt-4 mb-2">External Links</h2>
            <ul>
              {page.externalLinks.map((link, i) => (
                <li key={i}><a href={link.src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{link.title}</a></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default UrlFetcher;
