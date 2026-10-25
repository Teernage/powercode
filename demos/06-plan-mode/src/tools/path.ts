
import { resolve, sep } from "node:path";

/**
 *  解析路径
 * @description 解析路径，确保它在工作目录内。
 * @param workDir 工作目录
 * @param relativePath 相对路径
 * @returns 解析后的路径
 */
export function resolveInWorkDir(
  workDir: string,
  relativePath: string,
): string {
  if (!relativePath.trim()) {
    throw new Error("文件路径不能为空。");
  }

  const root = resolve(workDir);
  const target = resolve(root, relativePath);
  const isOutside = target !== root && !target.startsWith(`${root}${sep}`);

  if (isOutside) {
    throw new Error("只能操作当前项目里的文件。");
  }

  return target;
}