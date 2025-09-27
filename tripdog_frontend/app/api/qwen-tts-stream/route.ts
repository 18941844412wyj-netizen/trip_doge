import {NextRequest} from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const {text, voice = 'Cherry', model = 'qwen3-tts-flash', language_type = 'Chinese'} = await request.json();

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({error: 'Text is required'}),
                {
                    status: 400,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        const apiKey = process.env.DASHSCOPE_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({error: 'DASHSCOPE_API_KEY is not configured'}),
                {
                    status: 500,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 调用 DashScope TTS API with SSE enabled
        const dashScopeResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable',  // 启用 SSE 流式输出
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                model: model,
                input: {
                    text: text,
                    voice: voice,
                    language_type: language_type,
                    format: 'pcm'  // 使用 PCM 格式以便流式播放
                },
                parameters: {
                    incremental_output: true  // 启用增量输出
                }
            })
        });

        if (!dashScopeResponse.ok) {
            const errorText = await dashScopeResponse.text();
            console.error('DashScope TTS API Error:', errorText);
            return new Response(
                JSON.stringify({error: `DashScope TTS API Error: ${dashScopeResponse.status}`}),
                {
                    status: dashScopeResponse.status,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 创建一个 TransformStream 来转换 SSE 数据
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
                    const {done, value} = await reader.read();

                    if (done) {
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, {stream: true});
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                controller.close();
                                return;
                            }

                            try {
                                const json = JSON.parse(data);
                                // 提取音频数据
                                if (json.output?.audio?.data) {
                                    const sseMessage = `data: ${JSON.stringify({
                                        audio: json.output.audio.data,
                                        finished: json.output.finish_reason === 'stop'
                                    })}\n\n`;
                                    controller.enqueue(encoder.encode(sseMessage));
                                }
                            } catch (e) {
                                console.error('Failed to parse SSE data:', e);
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
        console.error('TTS Stream Error:', error);
        return new Response(
            JSON.stringify({error: 'Internal server error', details: error}),
            {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            }
        );
    }
}