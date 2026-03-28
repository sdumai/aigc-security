/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOLC_ARK_API_KEY?: string;
  /** 生产环境后端 API 根地址，例如 http://10.102.32.144:3001，为空时使用相对路径 /api */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
