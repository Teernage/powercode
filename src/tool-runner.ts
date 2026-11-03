import type OpenAI from 'openai';
import type { Registry } from './tools/registry.ts';
import type { RecoveryManager } from './context/recovery.ts';


export async function runToolBatch(
  calls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  registry: Registry,
  allowedNames: ReadonlySet<string>,
  recovery: RecoveryManager,
) {
  // 先检查整批类型，避免已执行一半才发现无法配对的调用。
  for (const call of calls) {
    if (call.type !== 'function')
      throw new Error(`暂时不支持工具类型：${call.type}`);
  }
  const messages: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];
  let stop = false;
  let stopReason = '';
  for (const call of calls) {
    if (call.type !== 'function') continue;
    const { name, arguments: args } = call.function;
    let output: string;
    if (stop) {
      output = '本次运行已暂停，此工具调用未执行。';
    } else {
      try {
        output = await registry.execute(name, args, allowedNames);
        recovery.onSuccess(name, args);
        console.log(`✓ ${name} 执行完成`);
      } catch (error) {
        const decision = recovery.onFailure(name, args, error);
        output = decision.output;
        stop = decision.stop;
        if (stop) stopReason = output;
        console.log(`✗ ${name}：${decision.kind}`);
      }
    }
    messages.push({ role: 'tool', tool_call_id: call.id, content: output });
  }
  return { messages, stop, stopReason };
}