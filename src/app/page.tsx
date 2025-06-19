
"use client";
import React, { useState } from 'react';

import Image from './models/Image';
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
  const [totalImageCount, setTotalImageCount] = useState(0);
  const [searchByDataAttribute, setSearchByDataAttribute] = useState(false);
  const [historyList, setHistoryList] = useState<History[]>([])

  var [currentImageCount, setCurrentImageCount] = useState(0);

  React.useEffect(() => {
    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
      setHistoryList(JSON.parse(storedHistory));
    } else {
      setHistoryList([]);
    }
  }, []);

  const fetchDocument = async (inputUrl: string) => {

    setLoading(true);
    setError(null);
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
        console.log(inputUrl)
        throw new Error(`Failed to load url, page not found. URL format should be http://yoursite.com or www.yoursite.com `);
      }

      const htmlText = await response.text();

      var page: Page = {
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

        var currentCount = 0
        const imageArray = Array.from(imgElements);

        for (let i = 0; i < imageArray.length; i++) {

          const img = imageArray[i];
          var imageSrc = img.getAttribute('src') || '';

          if (searchByDataAttribute)
            imageSrc = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-fallback-src') || '';

          if (imageSrc) {
            try {
              const imageObj = await fetchImageInfo(imageSrc);
              page.images.push(imageObj);
            } catch (e) {
              console.error(`Failed to fetch image ${imageSrc}:`, e);
            }
          }
          else {
            console.log(imageArray[i], "No src attribute found for image at index ", i);
            // If no src attribute, add to not found image count
            page.imagesNotFound++;
          }
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

      {loading && <p>Analyzing... Loaded {currentImageCount} of {totalImageCount} images</p>}
      
      {error && <p className="text-red-500">{error}</p>}

      {page && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl text-pink-500 font-bold mb-2">{page.title}</h2>
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
              if (page.imagesNotFound > 0) {
                grouped["not found"] = { images: [], totalSize: 0 };
                fileTypes.push("not found");
              }
              return (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Images by File Type</h2>
                  <ul>
                    {fileTypes.map(type => (
                      <li key={type} className="mb-2">
                        <span className="font-bold">{type.toUpperCase()}</span>
                        : {type === "not found"
                          ? `${page.imagesNotFound} image(s) with no src`
                          : `${grouped[type].images.length} image(s), total size: ${(grouped[type].totalSize / (1024 * 1024)).toFixed(2)} MB`
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

      {/* History Section - TODO: move to separate component*/}
      <div className="mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">History</h2>
              <Button
                type="button"
                onClick={() => {
                  localStorage.removeItem('history');
                  window.location.reload();
                }}
              >
                Clear History
              </Button>
            </div>
            <ul>
              {historyList.length === 0 ? (
                <li className="text-gray-500">No history yet.</li>
              ) : (
                historyList.map((history, i) => (
                  <li key={i} className="mb-4">
                    <div className="text-gray-600 text-sm mb-1">
                      {new Date(history.date).toLocaleString()}
                    </div>
                    <ul className="ml-4 list-disc">
                      {history.pages.map((page, i) => (
                        <li key={i}>
                          <span className="font-bold">{page.title}</span> — 
                          <a
                            type="button"
                            onClick={() => {
                              setUrl( page.url);
                              fetchDocument(page.url)
                            }}
                            className="text-pink-600 underline hover:text-blue-800"
                          >
                            {page.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default UrlFetcher;
