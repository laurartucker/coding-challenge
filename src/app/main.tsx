import React, { useState } from 'react';

function ImageFetcher() {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const fetchImages = async (e) => {
    e.preventDefault();
    setImages([]);
    setError('');

    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const imgTags = Array.from(doc.images);
      const imgSrcs = imgTags
        .map(img => img.src)
        .filter(src => src); // filter out empty src
      setImages(imgSrcs);
    } catch (err) {
      setError('Failed to fetch images. Make sure the URL allows CORS.');
    }
  };

  return (
    <div>
      <form onSubmit={fetchImages}>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL"
          required
        />
        <button type="submit">Fetch Images</button>
      </form>
      {error && <div style={{color: 'red'}}>{error}</div>}
      <ul>
        {images.map((src, idx) => (
          <li key={idx}>
            <img src={src} alt="" style={{maxWidth: 200}} />
            <div>{src}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ImageFetcher;