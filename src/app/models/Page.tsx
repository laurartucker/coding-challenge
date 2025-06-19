import Image from './Image';
import Link from './Link';

type Page = {
    title: string;
    url: string;
    images: Image[];
    internalLinks: Link[];
    externalLinks: Link[];
    totalImageCount: number;
  };
  
  export default Page;