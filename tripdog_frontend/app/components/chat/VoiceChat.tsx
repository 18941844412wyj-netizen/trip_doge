"use client"

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
    useSpeechRecognition,
    useOpenAITTS,
    AudioPlayer,
    AudioVisualizer,
    useAudioPlayer,
    useEdgeSpeech
} from '@lobehub/tts/react';
import {Icon} from '@lobehub/ui';
import {Button, Input, Card, Space, message, Spin} from 'antd';
import {Mic, StopCircle, Volume2, Send, Bot, User} from 'lucide-react';
import {Flexbox} from 'react-layout-kit';

// 配置接口
interface VoiceAssistantConfig {
    OPENAI_API_KEY: string;
    OPENAI_PROXY_URL?: string;
    serviceUrl?: string;
}

// 消息类型
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const VoiceAssistant: React.FC<{ config: VoiceAssistantConfig }> = ({config}) => {
    // 状态管理
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [autoPlayResponse, setAutoPlayResponse] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null!);

    // 语音识别 (STT)
    const {
        text: recognizedText,
        start: startRecording,
        stop: stopRecording,
        isLoading: isRecognizing,
        isRecording,
        formattedTime,
    } = useSpeechRecognition('zh-CN', {
        autoStop: true,
        onRecognitionFinish: async (text: string) => {
            if (text) {
                setCurrentInput(text);
                // 自动发送识别的文本
                await handleSendMessage(text);
            }
        },
        onRecognitionError: async (error: Error) => {
            message.error(`语音识别失败: ${error.message}`);
        },
    });

    // 文字转语音 (TTS)
    const {
        setText: setTTSText,
        isGlobalLoading: isTTSLoading,
        audio: ttsAudio,
        start: startTTS,
        stop: stopTTS
    } = useEdgeSpeech('', {
        api: config,
        options: {
            voice: 'zh-CN-YunxiaNeural', // 可以改为其他声音: nova, shimmer, echo, fable, onyx
            //model: 'tts-1',
        },
    });

    // 调用AI获取回答
    const getAIResponse = useCallback(async (userMessage: string): Promise<string> => {
        try {
            const response = await fetch(`${config.OPENAI_PROXY_URL || 'https://api.openai.com/v1'}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {role: 'system', content: '你是一个友好的AI助手，请用简洁清晰的语言回答问题。'},
                        ...messages.map(msg => ({role: msg.role, content: msg.content})),
                        {role: 'user', content: userMessage}
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '抱歉，我无法生成回复。';
        } catch (error) {
            console.error('AI回答错误:', error);
            return '抱歉，获取AI回复时出现错误，请检查API配置。';
        }
    }, [config, messages]);

    // 更新 handleSendMessage 的 useCallback 依赖数组
    const handleSendMessage = useCallback(async (text?: string) => {
        const messageText = text || currentInput;
        if (!messageText.trim()) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setCurrentInput('');
        setIsProcessingAI(true);

        try {
            const aiResponse = await getAIResponse(messageText);

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            if (autoPlayResponse) {
                setTTSText(aiResponse);
                setTimeout(() => {
                    startTTS();
                }, 500);
            }
        } catch {
            message.error('处理消息时出现错误');
        } finally {
            setIsProcessingAI(false);
        }
    }, [currentInput, autoPlayResponse, setTTSText, startTTS, getAIResponse]);

    // 手动播放消息语音
    const playMessageAudio = (content: string) => {
        setTTSText(content);
        setTimeout(() => {
            startTTS();
        }, 100);
    };

    return (
        <Flexbox gap={16} style={{maxWidth: 800, margin: '0 auto', padding: 20}}>
            {/* 标题栏 */}
            <Card>
                <Flexbox horizontal justify="space-between" align="center">
                    <h2 style={{margin: 0}}>🎙️ AI语音助手</h2>
                    <Space>
                        <Button
                            size="small"
                            type={autoPlayResponse ? 'primary' : 'default'}
                            onClick={() => setAutoPlayResponse(!autoPlayResponse)}
                        >
                            {autoPlayResponse ? '自动播放回复' : '手动播放'}
                        </Button>
                    </Space>
                </Flexbox>
            </Card>

            {/* 对话历史 */}
            <Card style={{minHeight: 400, maxHeight: 500, overflowY: 'auto'}}>
                <Flexbox gap={12}>
                    {messages.length === 0 ? (
                        <div style={{textAlign: 'center', color: '#999', padding: 40}}>
                            点击麦克风开始语音对话，或直接输入文字
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <Flexbox
                                key={msg.id}
                                horizontal
                                gap={8}
                                align="flex-start"
                                style={{
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {msg.role === 'assistant' && (
                                    <Icon icon={Bot} style={{color: '#1890ff', marginTop: 4}}/>
                                )}
                                <Card
                                    size="small"
                                    style={{
                                        maxWidth: '70%',
                                        backgroundColor: msg.role === 'user' ? '#e6f7ff' : '#f6f6f6',
                                    }}
                                    onClick={() => msg.role === 'assistant' && playMessageAudio(msg.content)}
                                    hoverable={msg.role === 'assistant'}
                                >
                                    <div>{msg.content}</div>
                                    {msg.role === 'assistant' && (
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<Icon icon={Volume2}/>}
                                            style={{marginTop: 8}}
                                        >
                                            播放
                                        </Button>
                                    )}
                                </Card>
                                {msg.role === 'user' && (
                                    <Icon icon={User} style={{color: '#52c41a', marginTop: 4}}/>
                                )}
                            </Flexbox>
                        ))
                    )}
                    {isProcessingAI && (
                        <Flexbox horizontal gap={8} align="center">
                            <Icon icon={Bot} style={{color: '#1890ff'}}/>
                            <Card size="small" style={{backgroundColor: '#f6f6f6'}}>
                                <Spin size="small"/> AI正在思考...
                            </Card>
                        </Flexbox>
                    )}
                </Flexbox>
            </Card>

            {/* 输入区域 */}
            <Card>
                <Flexbox gap={12}>
                    {/* 文本输入框 */}
                    <Input.TextArea
                        placeholder="输入消息或使用语音识别..."
                        value={currentInput || recognizedText}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onPressEnter={async (e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                await handleSendMessage();
                            }
                        }}
                        rows={3}
                        disabled={isRecording || isRecognizing}
                    />

                    {/* 控制按钮 */}
                    <Flexbox horizontal gap={8}>
                        {/* 语音识别按钮 */}
                        {isRecording ? (
                            <Button
                                danger
                                icon={<Icon icon={StopCircle}/>}
                                onClick={stopRecording}
                                style={{flex: 1}}
                            >
                                停止录音 {formattedTime}
                            </Button>
                        ) : isRecognizing ? (
                            <Button loading style={{flex: 1}}>
                                识别中...
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<Icon icon={Mic}/>}
                                onClick={startRecording}
                                style={{flex: 1}}
                                disabled={isProcessingAI}
                            >
                                开始录音
                            </Button>
                        )}

                        {/* 发送按钮 */}
                        <Button
                            type="primary"
                            icon={<Icon icon={Send}/>}
                            onClick={() => handleSendMessage()}
                            disabled={!currentInput.trim() || isProcessingAI}
                            loading={isProcessingAI}
                        >
                            发送
                        </Button>
                    </Flexbox>

                    {/* 音频播放器和可视化 */}
                    {ttsAudio && (
                        <Flexbox gap={8}>
                            <Flexbox gap={8}>
                                <AudioPlayer
                                    audio={ttsAudio}
                                    isLoading={isTTSLoading}
                                    onLoadingStop={stopTTS}
                                    style={{ width: '100%' }}
                                />
                                <AudioVisualizer
                                    audioRef={audioRef}
                                    isLoading={isTTSLoading}
                                    barStyle={{
                                        count: 20,
                                        width: 4,
                                        gap: 2,
                                        minHeight: 20,
                                        maxHeight: 60,
                                        borderRadius: 2,
                                    }}
                                />
                            </Flexbox>
                        </Flexbox>
                    )}
                </Flexbox>
            </Card>
        </Flexbox>
    );
};

// 使用示例
export default function VoiceChat() {
    const config: VoiceAssistantConfig = {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        OPENAI_PROXY_URL: process.env.NEXT_PUBLIC_OPENAI_PROXY_URL || 'https://api.openai.com',
    };

    if (!config.OPENAI_API_KEY) {
        return (
            <Card style={{maxWidth: 600, margin: '50px auto'}}>
                <h3>配置缺失</h3>
                <p>请在环境变量中设置 REACT_APP_OPENAI_API_KEY</p>
            </Card>
        );
    }

    return <VoiceAssistant config={config}/>;
}