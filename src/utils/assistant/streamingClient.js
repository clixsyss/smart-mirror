/**
 * Streaming Client for OpenAI API
 * Handles streaming responses with function calling support
 */

export class StreamingClient {
  constructor(apiKey, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  /**
   * Stream chat completion with function calling
   */
  async *streamChatCompletion(messages, tools = [], onToolCall = null) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        stream: true,
        temperature: 0.5,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const choice = parsed.choices?.[0];
              
              if (!choice) continue;

              // Handle function calls
              if (choice.delta?.tool_calls) {
                for (const toolCall of choice.delta.tool_calls) {
                  if (onToolCall) {
                    yield { type: 'tool_call', toolCall };
                  }
                }
                continue;
              }

              // Handle text content
              const content = choice.delta?.content;
              if (content) {
                yield { type: 'content', content };
              }

              // Handle finish reason
              if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls) {
                for (const toolCall of choice.message.tool_calls) {
                  if (onToolCall) {
                    yield { type: 'tool_call_complete', toolCall };
                  }
                }
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Non-streaming chat completion (fallback)
   */
  async chatCompletion(messages, tools = []) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.5,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }
}
