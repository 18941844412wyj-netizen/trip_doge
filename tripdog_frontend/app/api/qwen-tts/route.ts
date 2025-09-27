import {NextRequest} from 'next/server';

// POST 请求处理函数
export async function POST(request: NextRequest) {
    try {
        // 获取请求体中的数据
        const {text, voice = 'Cherry', model = 'qwen3-tts-flash', language_type = 'Chinese'} = await request.json();

        // 检查文本是否为空
        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({error: 'Text is required'}),
                {
                    status: 400,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 从环境变量获取 DashScope API Key
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

        // 步骤 1: 调用 DashScope TTS API，不使用 SSE，获取音频 URL
        const dashScopeResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'disable'
                // 重要：移除 'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify({
                model: model,
                input: {
                    text: text
                },
                parameters: {
                    voice: voice,
                    format: 'wav', // 仍然请求 WAV 格式
                    language_type: language_type
                },
            })
        });

        // 检查 DashScope 响应状态
        if (!dashScopeResponse.ok) {
            const errorJson = await dashScopeResponse.json();
            console.error('DashScope TTS API Error:', errorJson);
            return new Response(
                JSON.stringify({error: `DashScope TTS API Error: ${dashScopeResponse.status} - ${errorJson.message || JSON.stringify(errorJson)}`}),
                {
                    status: dashScopeResponse.status,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 步骤 2: 解析 DashScope 响应获取音频 URL
        const dashScopeData = await dashScopeResponse.json();
        const audioUrl = dashScopeData?.output?.audio?.url;

        if (!audioUrl) {
            return new Response(
                JSON.stringify({error: 'Failed to get audio URL from DashScope API response'}),
                {
                    status: 500,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 步骤 3: 从获取到的 URL 下载音频数据
        const audioDownloadResponse = await fetch(audioUrl);

        if (!audioDownloadResponse.ok) {
            const errorText = await audioDownloadResponse.text();
            console.error('Audio Download Error:', errorText);
            return new Response(
                JSON.stringify({error: `Audio Download Error: ${audioDownloadResponse.status} - ${errorText}`}),
                {
                    status: audioDownloadResponse.status,
                    headers: {'Content-Type': 'application/json'}
                }
            );
        }

        // 步骤 4: 获取音频的 arrayBuffer
        const audioBuffer = await audioDownloadResponse.arrayBuffer();

        // 返回音频数据给前端
        return new Response(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav', // 现在可以明确返回 audio/wav
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('TTS处理错误:', error);
        return new Response(
            JSON.stringify({error: 'Internal server error'}),
            {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            }
        );
    }
}