import OpenAI from 'openai';
import type { ProviderConfig } from './config.ts';
import { READ_FILE_TOOL } from './readFile.ts';

export class ChatClient {
  private readonly client: OpenAI;

  constructor(private readonly config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey, // 从配置中获取 API 密钥
      baseURL: config.baseURL, // 从配置中获取 API 基础 URL
    });
  }

  /**
   *  与模型交互，使用工具 READ_FILE_TOOL 读取真实文件内容。
   * @param prompt 用户的问题
   * @returns 模型的回复
   */
  async askWithTools(prompt: string) {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是 power-code，一个研发助手。需要了解项目内容时，优先读取真实文件。请使用中文回答。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [READ_FILE_TOOL],
    });

    return response.choices[0]?.message;
  }


  /**
   *  与模型交互，使用工具 READ_FILE_TOOL 读取真实文件内容。
   * @param prompt 用户的问题
   * @param toolCall 工具调用
   * @param fileContent 文件内容
   * @returns 模型的回复
   */
  async answerAfterReadFile(
    prompt: string,
    toolCall: any,
    fileContent: string,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是 power-code，一个研发助手。请根据工具返回的真实文件内容，用中文回答用户。',
        },
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: null,
          tool_calls: [toolCall],
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: fileContent,
        },
      ],
    });

    return response.choices[0]?.message.content ?? '模型没有返回内容。';
  }
}