import "dotenv/config";

const imageCache = new Map();

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
];

const getRandomFallback = () =>
  FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];

export const fetchUnsplashImage = async (query) => {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return getRandomFallback();

  if (imageCache.has(cleanQuery)) {
    return imageCache.get(cleanQuery);
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY missing in .env; using fallback image.");
    return getRandomFallback();
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      cleanQuery
    )}&per_page=3&orientation=landscape&content_filter=high`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!res.ok) {
      throw new Error(`Unsplash API responded with ${res.status}`);
    }

    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    if (results.length > 0) {
      // Pick one of the top 3 results so repeated similar queries still vary
      const chosen =
        results[Math.floor(Math.random() * Math.min(results.length, 3))];
      const imageUrl = chosen?.urls?.regular || chosen?.urls?.small;

      if (imageUrl) {
        imageCache.set(cleanQuery, imageUrl);
        return imageUrl;
      }
    }
  } catch (error) {
    console.error(`Unsplash fetch failed for "${cleanQuery}":`, error.message);
  }

  return getRandomFallback();
};

// Replaces every UNSPLASH_IMAGE(query) placeholder across index.html, style.css, and script.js
export const resolveUnsplashPlaceholders = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) return files;

  const placeholderRegex = /UNSPLASH_IMAGE\(\s*([^)]+?)\s*\)/g;
  const uniqueQueries = new Set();

  for (const file of files) {
    if (typeof file?.content !== "string") continue;
    for (const match of file.content.matchAll(placeholderRegex)) {
      if (match[1]) uniqueQueries.add(match[1].trim());
    }
  }

  if (uniqueQueries.size === 0) return files;

  const resolvedMap = new Map();
  await Promise.all(
    [...uniqueQueries].map(async (query) => {
      const imageUrl = await fetchUnsplashImage(query);
      resolvedMap.set(query, imageUrl);
    })
  );

  return files.map((file) => {
    if (typeof file?.content !== "string") return file;
    const updatedContent = file.content.replace(
      placeholderRegex,
      (_, rawQuery) => resolvedMap.get(rawQuery.trim()) || getRandomFallback()
    );
    return { ...file, content: updatedContent };
  });
};