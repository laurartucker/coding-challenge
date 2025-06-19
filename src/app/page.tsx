
"use client";
import React, { useState } from 'react';

import Image from './models/Image';
import Link from './models/Link';
import Page from './models/page'
import History from './models/History';
  
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

    // Check if input starts with https://.  Because of CORS issues, we replace https with http
    if (/^https:\/\//i.test(url)) {
      url = url.replace(/^https:\/\//i, "http://");
    }

    // Check if input is in the format http://example.com 
    if (!/^http?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    // Check if input is in the format www.example.com or example.com (no protocol)
    else if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(input)) {
      url = "http://" + input.trim();
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

async function fetchImageInfo(imgSrc: string) {
  var image: Image = {
    label: '',
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
    console.log("Image size:", image.size);

    // Remove query string and fragment before extracting file extension
    const urlWithoutParams = validatedUrl.split(/[?#]/)[0];
    image.fileType = urlWithoutParams.split('.').pop() || 'unknown';
    console.log("Image fetched:", image);

    } catch (e: unknown) {
      const error = e as Error;
    throw e;
  }
  return image;
}

function UrlFetcher() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  //const [details, setDetails] = useState<Page | null>(null);
  //   const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyItem: History = {
    pages: [],
    date: new Date()
  };

  const fetchDocument = async (inputUrl: string) => {

    setLoading(true);
    setError(null);
    setContent(null); // Clear previous content
    setPage(null); // Clear previous page details

    const validatedUrl = validateUrl(inputUrl);
    console.log("Validated URL:", validatedUrl);

    // Check if the URL is valid
    if (!validatedUrl) {
      setError("Invalid URL format.  Please enter a valid URL.  Format should be http://yoursite.com or www.yoursite.com");
      setLoading(false);
      return;
    }

    try {
      // Proxy the request through API route to avoid CORS issues
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(validatedUrl)}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load url, page not found. URL format should be http://yoursite.com or www.yoursite.com `);
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
      const linkElements = doc.querySelectorAll('a');
    
      if (linkElements.length > 0) {
        const extractedLinks = Array.from(linkElements).map(link => {
          const href = link.getAttribute('href') || '';
          const isExternal = href.startsWith('http://') || href.startsWith('https://');
          console.log("Extracted link:", href, "isExternal:", isExternal);
          return {
            title: link.textContent?.trim() || href,
            src: href,
            isExternal
          };
        });

        // Separate internal and external links
        page.internalLinks = extractedLinks.filter(link => !link.isExternal);
        page.externalLinks = extractedLinks.filter(link => link.isExternal);
      }


      if (imgElements.length > 0) {
        for (const img of Array.from(imgElements)) {
          const imageSrc = img.getAttribute('src') || '';
          const label = img.getAttribute('alt') || imageSrc;

          if (imageSrc) {
            try {
              const imageObj = await fetchImageInfo(imageSrc);
              imageObj.label = label;
              imageObj.fileType = imageObj.fileType || img.getAttribute('type') || '';
              imageObj.size = imageObj.size || 0;
              imageObj.label = label;

              page.images.push(imageObj);
            } catch (e) {
              // Optionally handle image fetch errors
              page.images.push({
                label,
                fileType: '',
                size: 0,
                src: imageSrc
              });
            }
          }
        }
        const historyItem: History = {
          pages: [page],
          date: new Date()
        };
        const prevHistory = JSON.parse(localStorage.getItem('history') || '[]') as History[];

        prevHistory.push(historyItem);
        localStorage.setItem('history', JSON.stringify(prevHistory));
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
      {error && <p className="text-red-500">{error}</p>}

      {page && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Page: {page.title}</h2>
            {/* Group images by fileType and calculate total size per type */}
            {(() => {
              const grouped: { [type: string]: { images: Image[]; totalSize: number } } = {};
              page.images.forEach(img => {
                const type = img.fileType || "unknown";
                if (!grouped[type]) {
                  grouped[type] = { images: [], totalSize: 0 };
                }
                grouped[type].images.push(img);
                grouped[type].totalSize += img.size || 0;
              });
              const fileTypes = Object.keys(grouped);
              return (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Images by File Type</h2>
                  <ul>
                    {fileTypes.map(type => (
                      <li key={type} className="mb-2">
                        <span className="font-bold">{type.toUpperCase()}</span>
                        — {grouped[type].images.length} image(s), total size: {(grouped[type].totalSize / (1024 * 1024)).toFixed(2)} MB
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
            <div className="flex flex-col md:flex-row gap-8 mt-4">
              {/* Internal Links */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Internal Links</h2>
                <ul>
                  {page.internalLinks.map((link, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          setUrl(url + link.src);
                          fetchDocument(url + link.src)
                        }}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {link.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* External Links */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">External Links</h2>
                <ul>
                  {page.externalLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default UrlFetcher;
