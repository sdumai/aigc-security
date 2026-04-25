/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOLC_ARK_API_KEY?: string;
  /** 生产环境后端 API 根地址，例如 http://10.102.32.144:3001，为空时使用相对路径 /api */
  readonly VITE_API_BASE?: string;
  /** 开发环境 Vite /api 代理目标，默认 http://localhost:3001 */
  readonly VITE_DEV_API_PROXY_TARGET?: string;
  /** 开发环境是否启用 MSW mock，启用后不访问真实后端 */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
