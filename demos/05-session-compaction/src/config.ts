import { readFile } from "node:fs/promises";

/**
 * 提供商配置接口
 * 定义与 AI 提供商通信所需的配置参数
 */
export interface ProviderConfig {
  baseURL: string; /** API 服务的基础 URL 地址 */
  apiKey: string; /** 用于身份验证的 API 密钥 */
  model: string; /** 要使用的 AI 模型名称 */
  contextWindow: number; /** 模型上下文窗口大小 */
}

/**
 * 加载并验证提供商配置
 *
 * @returns Promise<ProviderConfig> 完整的提供商配置对象
 * @throws 当 provider.json 缺失或必需字段不完整时抛出错误
 * @example
 * ```ts
 * const config = await loadConfig();
 * // 使用配置初始化 AI 客户端
 * ```
 */
export async function loadConfig(): Promise<ProviderConfig> {
  const content = await readFile("provider.json", "utf8");
  const config = JSON.parse(content) as Partial<ProviderConfig>;

  if (
    !config.baseURL ||
    !config.apiKey ||
    !config.model ||
    typeof config.contextWindow !== "number" ||
    !Number.isInteger(config.contextWindow) ||
    config.contextWindow <= 0
  ) {
    throw new Error(
      "provider.json 配置不完整，需要提供 baseURL、apiKey、model 和正整数 contextWindow。",
    );
  }

  return {
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    model: config.model,
    contextWindow: config.contextWindow,
  };
}
