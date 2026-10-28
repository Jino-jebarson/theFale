/// <reference types="vite/client" />

declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "mammoth" {
  const mammoth: {
    extractRawText: (input: { arrayBuffer?: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>;
  };
  export default mammoth;
}

