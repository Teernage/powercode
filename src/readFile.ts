import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const MAX_BYTES = 8_000; // 最大字节数

/**
 * 读取文件工具配置
 */
export const READ_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'read_file',
    description: '读取当前项目中的文本文件内容。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件路径，比如 README.md',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
} as const;

/**
 * 获取文件路径
 * @param argumentsJson 参数JSON
 * @returns 文件路径
 */
function getPath(argumentsJson: string): string {
  const input = JSON.parse(argumentsJson) as { path?: unknown };

  if (typeof input.path !== 'string' || input.path.trim() === '') {
    throw new Error('read_file 需要传入文件路径。');
  }

  return input.path;
}


/**
 * 读取文件
 * @param argumentsJson 参数JSON
 * @returns 文件内容
 */
export async function readFileTool(argumentsJson: string): Promise<string> {
  const relativePath = getPath(argumentsJson);

  const workDir = resolve(process.cwd());
  const targetPath = resolve(workDir, relativePath);

  const isOutsideWorkDir =
    targetPath !== workDir && !targetPath.startsWith(`${workDir}${sep}`);

  if (isOutsideWorkDir) {
    throw new Error('只能读取当前项目里的文件。');
  }

  const content = await readFile(targetPath);

  if (content.length > MAX_BYTES) {
    return `${content.subarray(0, MAX_BYTES).toString('utf8')}

...[文件太长了，只返回前 ${MAX_BYTES} 个字节]...`;
  }

  return content.toString('utf8');
}