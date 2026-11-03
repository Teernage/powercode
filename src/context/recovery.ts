import { createHash } from 'node:crypto';

export type FailureKind =
  | 'edit_mismatch'
  | 'edit_ambiguous'
  | 'not_found'
  | 'permission'
  | 'timeout'
  | 'output_limit'
  | 'command_failed'
  | 'unknown';

export class ToolExecutionError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

const HINTS: Record<FailureKind, string> = {
  edit_mismatch:
    '先 read_file 读取最新内容，再提取准确的 old_text；不要原样重复编辑。',
  edit_ambiguous:
    'old_text 命中多处；读取文件并补充相邻上下文，确认唯一后再编辑。',
  not_found: '先 list_files 或 search_files 确认真实路径，不要连续猜文件名。',
  permission:
    '保留当前权限限制，向用户说明被拒绝的操作；不要换工具绕过，也不要自行提权。',
  timeout:
    '先确认命令是否仍有进程或部分写入，再缩小验证范围；不要直接重跑或改成后台运行。',
  output_limit:
    '输出超过缓冲区上限；先确认副作用，再缩小检查范围或改用摘要输出。',
  command_failed:
    '根据退出状态和日志定位原因；检查脚本、依赖和语法后再决定是否重试。',
  unknown: '原因尚未识别；保留原始错误，先做只读检查，无法确认时说明阻塞点。',
};

export function classifyFailure(name: string, error: unknown): FailureKind {
  if (error instanceof ToolExecutionError) return error.kind;
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: unknown } | null)?.code;
  if (
    code === 'EACCES' ||
    code === 'EPERM' ||
    /当前模式不允许|只能操作当前项目|permission denied/i.test(message)
  )
    return 'permission';
  if (code === 'ENOENT') return 'not_found';
  if (name === 'edit_file' && /没有找到 old_text/.test(message))
    return 'edit_mismatch';
  if (name === 'edit_file' && /old_text 出现了/.test(message))
    return 'edit_ambiguous';
  return 'unknown';
}

// 只排序 JSON 对象键，不改字符串、数组顺序或 shell 命令。
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

export function callKey(name: string, args: string): string {
  let normalized = args;
  try {
    normalized = JSON.stringify(canonical(JSON.parse(args)));
  } catch {}
  return createHash('sha256')
    .update(JSON.stringify([name, normalized]))
    .digest('hex');
}

export class RecoveryManager {
  private readonly failures = new Map<string, number>();
  private totalFailures = 0;

  onSuccess(name: string, args: string): void {
    this.failures.delete(callKey(name, args));
  }

  onFailure(name: string, args: string, error: unknown) {
    const kind = classifyFailure(name, error);
    const key = callKey(name, args);
    const count = (this.failures.get(key) ?? 0) + 1;
    this.failures.set(key, count);
    this.totalFailures += 1;
    const stop = kind === 'permission' || count >= 3 || this.totalFailures >= 6;
    const raw = error instanceof Error ? error.message : String(error);
    const output = [
      `工具执行失败：${raw.slice(0, 4000)}`,
      `[Harness 恢复提示] 类型：${kind}`,
      HINTS[kind],
      `同一调用失败 ${count}/3 次；本次累计失败 ${this.totalFailures}/6 次。`,
      stop
        ? '已暂停本次运行，未验证的 TODO 不能标为完成。'
        : '请先检查原因，再决定下一步。',
    ].join('\n');
    return { kind, count, totalFailures: this.totalFailures, stop, output };
  }
}