// import Page from "../models/Page";

// export function extractLinksFromHtml(fullList: NodeListOf<HTMLAnchorElement>, page: Page) {

//    if (fullList.length > 0) {
//       // Flatten the NodeListOf<HTMLAnchorElement>[] into a single array of HTMLAnchorElement
//       const allLinks = fullList.flatMap(nodeList => Array.from(nodeList));

//       const extractedLinks = allLinks.map(link => {
//          const href = link.getAttribute('href') || '';
//          const isExternal = href.startsWith('http://') || href.startsWith('https://');
//          console.log("Extracted link:", href, "isExternal:", isExternal);
//          return {
//             title: link.textContent?.trim() || href,
//             src: href,
//             isExternal
//          };
//       });

//       // Separate internal and external links
//       page.internalLinks = extractedLinks.filter(link => !link.isExternal);
//       page.externalLinks = extractedLinks.filter(link => link.isExternal);
//    }

// }