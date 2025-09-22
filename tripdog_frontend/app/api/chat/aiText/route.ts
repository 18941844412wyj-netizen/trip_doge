import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_PROXY_URL || 'https://api.openai.com/v1',
});

export async function POST(request: NextRequest) {
    try {
        const { text, history = [] } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        // 构建消息历史
        const messages = [
            {
                role: 'system',
                content: '你是一个友好的AI助手，请用简洁清晰的语言回答问题。'
            },
            ...history.slice(-6), // 保留最近的3轮对话
            { role: 'user', content: text }
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            max_tokens: 150,
        });

        const response = completion.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';

        return NextResponse.json({ response });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to get AI response' },
            { status: 500 }
        );
    }
}