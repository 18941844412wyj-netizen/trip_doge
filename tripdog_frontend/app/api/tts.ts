
import {EdgeSpeechPayload, EdgeSpeechTTS, OpenAITTS, OpenAITTSPayload} from '@lobehub/tts';
import {NextRequest, NextResponse} from 'next/server';
import {OpenaiVoice} from "@lobehub/tts/es/core/OpenAITTS";

// TTS 提供商管理器
class TTSManager {
    private providers: Map<string, EdgeSpeechTTS | OpenAITTS>;

    constructor() {
        this.providers = new Map<string, EdgeSpeechTTS | OpenAITTS>([
            ['edge', new EdgeSpeechTTS({locale: 'zh-CN'})],
            ['openai', new OpenAITTS({
                OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
                OPENAI_PROXY_URL: process.env.OPENAI_PROXY_URL,
            })]
        ]);
    }

    async synthesize(text: string, voice: string, provider = 'edge') {
        const tts = this.providers.get(provider);

        if (tts instanceof OpenAITTS) {
            const payload: OpenAITTSPayload = {
                input: text,
                options: {
                    model: 'tts-1', // 或根据需要动态传入
                    voice: voice as OpenaiVoice, // OpenaiVoice 枚举类型需匹配
                }
            };
            return await tts.create(payload);
        } else {
            if (!tts) throw new Error('Invalid provider');
            const payload: EdgeSpeechPayload = {
                input: text,
                options: {
                    voice: voice
                }
            };
            return await tts.create(payload);
        }
    }
}

const ttsManager = new TTSManager();

export async function POST(req: NextRequest) {
    const {text, voice, character} = await req.json();


    // 生成语音
    const response = await ttsManager.synthesize(
        text,
        character?.voiceStyle || voice,
        character?.ttsProvider || 'edge'
    );

    // 返回音频流
    return new NextResponse(response.body, {
        headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}