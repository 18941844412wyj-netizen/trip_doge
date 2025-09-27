import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text, voice = 'Cherry', model = 'qwen3-tts-flash-realtime', language_type = 'Chinese' } = await request.json();

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const apiKey = process.env.DASHSCOPE_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'DASHSCOPE_API_KEY is not configured' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 调用 DashScope TTS API，启用 SSE
        const dashScopeResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable' // 启用 SSE
            },
            body: JSON.stringify({
                model: model,
                input: {
                    text: text
                },
                parameters: {
                    voice: voice,
                    format: 'pcm', // 实时版本使用 PCM 格式
                    sample_rate: 16000,
                    language_type: language_type
                },
            })
        });

        if (!dashScopeResponse.ok) {
            const errorJson = await dashScopeResponse.json();
            console.error('DashScope TTS API Error:', errorJson);
            return new Response(
                JSON.stringify({ error: `DashScope TTS API Error: ${errorJson.message || 'Unknown error'}` }),
                {
                    status: dashScopeResponse.status,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 创建一个 TransformStream 来处理 SSE 数据
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                const reader = dashScopeResponse.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            const data = line.slice(5).trim();

                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                controller.close();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);

                                // 检查是否有音频数据
                                if (parsed.output?.sentence?.audio) {
                                    const eventData = {
                                        audio: parsed.output.sentence.audio,
                                        is_last: parsed.output.sentence.is_last || false,
                                        text: parsed.output.sentence.text || ''
                                    };

                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
                                    );
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('TTS处理错误:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}