
"use client";
import React, { useState } from 'react';

import Image from './models/Image';
import Page from './models/Page'

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
  const [totalImageCount, setTotalImageCount] = useState(0);
  const [searchByDataAttribute, setSearchByDataAttribute] = useState(false);

  const [currentImageCount, setCurrentImageCount] = useState(0);

  const [previousSearches] = useState<string[]>([]);

  const fetchDocument = async (inputUrl: string) => {

    setLoading(true);
    setError(null);
    setCurrentImageCount(0);
    setTotalImageCount(0);

    const validatedUrl = validateUrl(inputUrl);

    // Check if the URL is valid
    if (!validatedUrl) {
      setError("Invalid URL format, please enter a valid URL.  Format should be http://yoursite.com or www.yoursite.com");
      setLoading(false);
      return;
    }

    try {
      // Proxy the request through API route to avoid CORS issues
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(validatedUrl)}`);

      if (!response.ok) {
        console.log(inputUrl)
        throw new Error(`Failed to load url, page not found. `);
      }

      const htmlText = await response.text();

      const page: Page = {
        title: '',
        url: validatedUrl,
        images: [],
        imagesNotFound: 0,
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
        let currentCount = 0
        const imageArray = Array.from(imgElements);

        for (let i = 0; i < imageArray.length; i++) {
          const parsedImage = await fetchImageInfo(imageArray[i], searchByDataAttribute);
          page.images.push(parsedImage);
          
          setCurrentImageCount(++currentCount);
        }
      }

      // Extract links from the document
      // Note: This works better inline than from using a helper function
      if (linkElements.length > 0) {
        const extractedLinks = Array.from(linkElements).map(link => {
          const href = link.getAttribute('href') || '';
          const isExternal = href.startsWith('http://') || href.startsWith('https://');
          // Extract only the protocol and domain for internal links
          let baseUrl = '';
          try {
            const urlObj = new URL(page.url);
            baseUrl = `${urlObj.protocol}//${urlObj.host}`;
          } catch {
            baseUrl = '';
          }
          return {
            title: link.textContent?.trim() || href,
            src: isExternal
              ? href
              : baseUrl + href, // Use only protocol and domain for internal links
            isExternal
          };
        });

        // Separate internal and external links
        page.internalLinks = extractedLinks.filter(link => !link.isExternal);
        page.externalLinks = extractedLinks.filter(link => link.isExternal);
      }
      setPage(page);

      previousSearches.push(validatedUrl);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
        console.error("An unknown error occurred:", err);
      }
    }
    setLoading(false);
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    fetchDocument(url);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">URL Inspector 9000</h1>
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="Enter a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchByDataAttribute}
            onChange={() => setSearchByDataAttribute(!searchByDataAttribute)}
            className="form-checkbox"
          />
          <span>Search images by <code>data-*</code> attributes</span>
          <Button type="submit" disabled={loading}>Analyze</Button>

        </label></form>

      {loading && <p>Analyzing... Loaded {currentImageCount} of {totalImageCount} images<br/></p>}

      {error && <p className="text-red-500">{error}</p>}

      {page && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl text-pink-500 font-bold mb-2">{page.title}</h2>
            {/* Group images by fileType and calculate total size per type */}
            {(() => {
              const groups: { [type: string]: { images: Image[]; totalSize: number } } = {};
              page.images.forEach(imgType => {
                const type = imgType.fileType || "unknown";
                if (!groups[type]) {
                  groups[type] = { images: [], totalSize: 0 };
                }
                groups[type].images.push(imgType);
                groups[type].totalSize += imgType.size || 0;
              });
              const fileTypes = Object.keys(groups);
              
              return (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Images by File Type</h2>
                  <ul>
                    {fileTypes.map(type => (
                      <li key={type} className="mb-2">
                        <span className="font-bold">{type.toUpperCase()}</span>
                        : {type === "not found"
                          ? `${page.imagesNotFound} image(s) with no src`
                          : `${groups[type].images.length} image(s), total size: ${(groups[type].totalSize / (1024 * 1024)).toFixed(2)} MB`
                        }
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
                      <a
                        type="button"
                        onClick={() => {
                          setUrl(link.src);
                          fetchDocument(link.src)
                        }}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {link.src}
                      </a>
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
      <h2 className="text-lg font-semibold mt-6 mb-2">Past Searches</h2>
      {previousSearches.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Previous Searches</h2>
          <ul>
            {previousSearches.map((searchUrl, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={() => {
                    setUrl(searchUrl);
                    fetchDocument(searchUrl);
                  }}
                >
                  {searchUrl}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default UrlFetcher;
