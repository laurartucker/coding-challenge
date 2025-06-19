import Image from './Image';
import Link from './Link';

type Page = {
    title: string;
    url: string;
    images: Image[];
    internalLinks: Link[];
    externalLinks: Link[];
  };
  
  export default Page;