
export function extractLinkFromHtml(element: HTMLAnchorElement, initialUrl: string = '') {

   const label = element.getAttribute('href')

   const href = element.getAttribute('href') || '';
   const isExternal = href.startsWith('http://') || href.startsWith('https://');

   // Extract only the protocol and domain for internal links
   let baseUrl = '';
   try {
      const urlObj = new URL(initialUrl);
      baseUrl = `${urlObj.protocol}//${urlObj.host}`;
   } catch {
      baseUrl = '';
   }
   return {
      title: element.textContent?.trim() || href,
      label: label || '',
      src: isExternal
         ? href
         : baseUrl + href, // Use only protocol and domain for internal links
      isExternal
   };
}