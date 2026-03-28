/**
 * 生产环境部署时，前端与后端分离：前端在 5670（http-server），后端在 3001。
 * 通过 VITE_API_BASE 指定后端地址，开发时为空走 Vite 代理。
 */
export const apiBase = (import.meta.env.VITE_API_BASE as string) ?? "";
