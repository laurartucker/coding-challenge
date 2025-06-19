

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Using Url Inspector 9000
UI9000 lets you analyze any kind of url and shows you a full breakdown of images and links included on the site.  This fully responsive tool lets you analyze to your heart's content, even allowing you to rerun previous searches <insert sunglasses emoji/>

### Analyzing a Url

When loading the UI9000 for the first time, you'll see a form with a textbox and a checkbox.  You may enter a url in any format - for example, http://www.testing.com, https://www.testing.com, www.testing.com or testing.com are all valid urls.  The UI9000 handles verifying the url and fetching data.  If the server polled supports the url, the result will be returned. 

NOTE: All references to https:// have to be converted to http:// to avoid CORS issues.  This doesn't affect results as most sites support both. 

For the URL supplied, the UI9000 fetches the full DOM and parses out images and links.  

### Progress Counter
When analyzing a url, UI9000 needs to fetch all image files, and for larger sites or slower connections, this can take a little time. 


### Image Parsing 
For images, from those referenced in the DOM, UI9000 first fetches the image to get filesize, then groups images by file type. For each group, the image type and the sum of all group file sizes is shown.  

NOTE: "Unknown" is listed as a file type.  This is not a mistake - many sites use data attributes to load their images, so using the basic src attribute may not actually return a fetchable image.  This is where the checkbox comes in.  If you suspect images aren't being polled correctly, check the checkbox.  This adds an option to use data attributes like data-src or data-fallback-src, meaning you'll get a more comprehensive list. 

NOTE: Even with the checkbox, some sites that have image elements may be using frameworks that have image elements but no discernable image src.  For example, instagram.com/differentdiving is one of them.  UI9000 will handle it, but the information returned won't be as complete as other sites.

### Link Parsing
UI9000 takes every anchor element in the dom and sorts them into Internal and External links.  Each of these links contains clickable links.  

#### Internal Links
Additional logic has been added to handle internal links correctly.  The src in the element might read "/dive-sites", for example, which works for that site but doesn't do much for us. UI9000 creates a composite url from the baseUrl so internal links can be clicked on and searched without any other clicks. 

#### External Links
Every link listed as an absolute URL will displayed under external links.  When clicked on, UI will analyze said link.  

NOTE: A site might include itself as a link - not just '/', but the full, absolute URL.  Given this link is actually the same as what's being analyzed, an arguement could be made to class this as an internal link.  At this time, if a link is included in its absolute form, it is classed as an external link.

NOTE: External links include mailto: and tel: anchors.  Since they are external links, they are included.  WHen clicked on, they will be analyzed but UI9000 will reject the URL.  

### Past Searches
As a convenience add, a change request was processed and approved internally to expand requirements and list sites analyzed in the current session.  Each site analyzed is displayed under page information, and when each are clicked, UI9000 will rerun the search. 