
"use client";
import React, { useState } from 'react';

import Image from './models/Image';
import Link from './models/Link';
import Page from './models/Page'
import History from './models/History';

import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { CardContent } from './components/ui/card-content';

import { validateUrl } from './utils/urls';
import { fetchImageInfo } from './utils/images';

function UrlFetcher() {
  const [url, setUrl] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageCount, setCurrentImageCount] = useState(0);
  const [totalImageCount, setTotalImageCount] = useState(0);

  const historyItem: History = {
    pages: [],
    date: new Date()
  };

  const fetchDocument = async (inputUrl: string) => {

    setLoading(true);
    setError(null);
    setPage(null); // Clear previous page details
    setCurrentImageCount(0);
    setTotalImageCount(0);

    const validatedUrl = validateUrl(inputUrl);

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
        externalLinks: [],
        totalImageCount: 0
      };

      // Parse the HTML to extract image URLs
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      page.title = doc.querySelector('title')?.textContent || 'No title found';

      const imgElements = doc.querySelectorAll('img');
      setTotalImageCount(imgElements.length);
  
      const linkElements = doc.querySelectorAll('a');

      if (imgElements.length > 0) {

        var currentCount = 0 
        
        for (const img of Array.from(imgElements)) {
          const imageSrc = img.getAttribute('src') || '';
          const label = img.getAttribute('alt') || imageSrc;

          if (imageSrc) {
            try {
              const imageObj = await fetchImageInfo(imageSrc);
              page.images.push(imageObj);

              setCurrentImageCount(currentCount + 1)
              currentCount++;
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
        
      }
      
      // Extract links from the document
      // Note: This works better inline than from using a helper function
      if (linkElements.length > 0) {
        
        const extractedLinks = Array.from(linkElements).map(link => {
          const href = link.getAttribute('href') || '';
          const isExternal = href.startsWith('http://') || href.startsWith('https://');
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

      const historyItem: History = {
          pages: [page],
          date: new Date()
        };
        const prevHistory = JSON.parse(localStorage.getItem('history') || '[]') as History[];

        prevHistory.push(historyItem);
        localStorage.setItem('history', JSON.stringify(prevHistory));
        setPage(page);

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

      {loading && <p>Analyzing... Loaded {currentImageCount} of {totalImageCount} images
        {page?.images.length}</p>}
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
                        : {grouped[type].images.length} image(s), total size: {(grouped[type].totalSize / (1024 * 1024)).toFixed(2)} MB
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
      <div className="mt-8">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">History</h2>
            <Button
              type="button"
              className="mb-4"
              onClick={() => {
                localStorage.removeItem('history');
                window.location.reload();
              }}
            >
              Clear History
            </Button>
            <ul>
              {(JSON.parse(localStorage.getItem('history') || '[]') as History[]).map((history, idx) => (
                <li key={idx} className="mb-4">
                  <div className="text-gray-600 text-sm mb-1">
                    {new Date(history.date).toLocaleString()}
                  </div>
                  <ul className="ml-4 list-disc">
                    {history.pages.map((p, i) => (
                      <li key={i}>
                        <span className="font-bold">{p.title}</span> — <span className="text-blue-600">{p.url}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default UrlFetcher;
