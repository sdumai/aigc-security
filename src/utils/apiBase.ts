/**
 * 生产环境部署时，前端与后端分离：前端在 53177（http-server），后端在 3001。
 * 开发环境不配置 VITE_API_BASE 时走 Vite 代理，避免页面里散落硬编码地址。
 */
const rawApiBase = ((import.meta.env.VITE_API_BASE as string | undefined) ?? "").trim();

export const apiBase = rawApiBase.replace(/\/+$/, "");

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
};
