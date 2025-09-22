"use client"

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {useOpenAITTS, AudioPlayer, AudioVisualizer, useSpeechRecognition} from '@lobehub/tts/react';
import {Button, Drawer, Badge, Tooltip, message, Spin} from 'antd';
import {
    Mic,
    MicOff,
    History,
    Volume2,
    VolumeX,
    MessageSquare,
    Bot,
    User,
    X
} from 'lucide-react';

// 配置接口
interface VoiceAssistantConfig {
    OPENAI_API_KEY: string;
    OPENAI_PROXY_URL?: string;
}

// 消息类型
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const MinimalVoiceAssistant: React.FC<{ config: VoiceAssistantConfig }> = ({config}) => {
    // 状态管理
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentAIResponse, setCurrentAIResponse] = useState('');
    const [currentUserInput, setCurrentUserInput] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null!);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                setCurrentUserInput(text);
                await handleProcessMessage(text);
            }
        },
        onRecognitionError: async (error: Error) => {
            await message.error(`识别失败: ${error.message}`);
        },
    });

    // 文字转语音 (TTS)
    const {
        setText: setTTSText,
        isGlobalLoading: isTTSLoading,
        audio: ttsAudio,
        start: startTTS,
        stop: stopTTS,
    } = useOpenAITTS('', {
        api: config,
        options: {
            voice: 'nova', // "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
            model: 'tts-1',
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
                        {role: 'system', content: '你是一个友好简洁的AI助手。请用简短清晰的语言回答，避免冗长的解释。'},
                        ...messages.slice(-10).map(msg => ({role: msg.role, content: msg.content})),
                        {role: 'user', content: userMessage}
                    ],
                    max_tokens: 200,
                    temperature: 0.7,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            if (typeof content !== 'string') {
                console.error('Unexpected API response format:', data);
                return '抱歉，我无法生成回复。';
            }

            return content;
        } catch (error) {
            console.error('AI回答错误:', error);
            return '抱歉，连接出现问题，请稍后重试。';
        }
    }, [config, messages]);


    // 处理消息（即时发送和播放）
    const handleProcessMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // 立即添加用户消息
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setCurrentUserInput('');
        setIsProcessingAI(true);

        try {
            // 获取AI回答
            const aiResponse = await getAIResponse(text);
            setCurrentAIResponse(aiResponse);

            // 添加AI回答
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            // 即时播放语音
            setTTSText(aiResponse);
            // 小延迟确保文本已设置
            setTimeout(() => {
                startTTS();
            }, 500);
        } catch (error) {
            message.error('处理失败，请重试');
            console.error('处理错误:', error)
        } finally {
            setIsProcessingAI(false);
        }
    }, [getAIResponse, setTTSText, startTTS]);

    // 播放历史消息
    const playHistoryMessage = (content: string) => {
        setTTSText(content);
        setTimeout(() => {
            startTTS();
        }, 100);
    };

    // 切换录音
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
            setCurrentUserInput('');
            setCurrentAIResponse('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* 主界面 - 居中的圆形按钮 */}
            <div className="flex flex-col items-center justify-center min-h-screen px-4 relative">
                {/* 顶部控制栏 - 固定位置 */}
                <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-medium text-gray-800">AI 语音助手</h1>
                            <div className="flex items-center gap-2">
                                {/* 自动播放开关 */}
                                <Tooltip title={autoPlay ? "自动播放开启" : "自动播放关闭"}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={autoPlay ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                                        onClick={() => setAutoPlay(!autoPlay)}
                                        className={`${autoPlay ? 'text-blue-500' : 'text-gray-400'}`}
                                    />
                                </Tooltip>

                                {/* 历史记录按钮 */}
                                <Tooltip title="对话历史">
                                    <Badge count={messages.length} size="small" offset={[-5, 5]}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<History size={18}/>}
                                            onClick={() => setShowHistory(true)}
                                            className="text-gray-600"
                                        />
                                    </Badge>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 中心区域 */}
                <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
                    {/* 当前对话显示 */}
                    {(currentUserInput || currentAIResponse || isProcessingAI || recognizedText) && (
                        <div className="w-full space-y-4 mb-8 animate-fadeIn">
                            {/* 用户输入 */}
                            {(currentUserInput || recognizedText) && (
                                <div className="flex items-start gap-3 justify-end">
                                    <div
                                        className="bg-blue-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                                        <p className="text-sm md:text-base">{currentUserInput || recognizedText}</p>
                                    </div>
                                    <div
                                        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-blue-600"/>
                                    </div>
                                </div>
                            )}

                            {/* AI回复或加载状态 */}
                            {(isProcessingAI || currentAIResponse) && (
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-purple-600"/>
                                    </div>
                                    <div
                                        className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                                        {isProcessingAI ? (
                                            <div className="flex items-center gap-2">
                                                <Spin size="small"/>
                                                <span className="text-sm text-gray-500">思考中...</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm md:text-base text-gray-800">{currentAIResponse}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 主要录音按钮 */}
                    <div className="relative">
                        {/* 脉冲动画背景 */}
                        {isRecording && (
                            <>
                                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                                <div
                                    className="absolute inset-0 bg-red-400 rounded-full animate-ping animation-delay-200 opacity-15"></div>
                            </>
                        )}

                        {/* 录音按钮 */}
                        <button
                            onClick={toggleRecording}
                            disabled={isRecognizing || isProcessingAI}
                            className={`
                relative w-32 h-32 md:w-40 md:h-40 rounded-full 
                flex flex-col items-center justify-center gap-2
                transition-all duration-300 transform active:scale-95
                ${isRecording
                                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-2xl scale-110'
                                : isRecognizing || isProcessingAI
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl hover:shadow-2xl hover:scale-105'
                            }
              `}
                        >
                            {isRecognizing ? (
                                <div className="text-white">
                                    <Spin size="large" className="text-white"/>
                                </div>
                            ) : isRecording ? (
                                <>
                                    <MicOff size={32} className="text-white"/>
                                    <span className="text-white text-xs font-medium">{formattedTime}</span>
                                </>
                            ) : (
                                <>
                                    <Mic size={32} className="text-white"/>
                                    <span className="text-white text-xs font-medium">点击说话</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* 提示文字 */}
                    {!currentUserInput && !currentAIResponse && !isProcessingAI && !recognizedText && (
                        <p className="text-gray-400 text-center text-sm md:text-base animate-fadeIn">
                            点击按钮开始对话，我会立即回复你
                        </p>
                    )}

                    {/* 音频播放器和可视化 - 底部固定 */}
                    {ttsAudio && (
                        <div
                            className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4">
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
                                <AudioPlayer
                                    audio={ttsAudio}
                                    isLoading={isTTSLoading}
                                    onLoadingStop={stopTTS}
                                    className="flex-1 w-full"
                                />
                                <AudioVisualizer
                                    audioRef={audioRef}
                                    isLoading={isTTSLoading}
                                    barStyle={{
                                        count: 15,
                                        width: 3,
                                        gap: 2,
                                        minHeight: 10,
                                        maxHeight: 40,
                                        borderRadius: 2,
                                    }}
                                    className="hidden md:flex"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 历史记录抽屉 */}
            <Drawer
                title={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={20}/>
                            <span>对话历史</span>
                        </div>
                        <Button
                            type="text"
                            size="small"
                            onClick={() => setMessages([])}
                            className="text-red-500 hover:text-red-600"
                        >
                            清空
                        </Button>
                    </div>
                }
                placement="right"
                onClose={() => setShowHistory(false)}
                open={showHistory}
                width={400}
                className="history-drawer"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare size={48} className="mb-3"/>
                        <p>暂无对话记录</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${
                                    msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                  ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}
                `}>
                                    {msg.role === 'user'
                                        ? <User size={14} className="text-blue-600"/>
                                        : <Bot size={14} className="text-purple-600"/>
                                    }
                                </div>
                                <div className={`
                  flex-1 px-3 py-2 rounded-lg text-sm
                  ${msg.role === 'user'
                                    ? 'bg-blue-50 text-gray-800'
                                    : 'bg-gray-50 text-gray-800 cursor-pointer hover:bg-gray-100'
                                }
                `}
                                     onClick={() => msg.role === 'assistant' && playHistoryMessage(msg.content)}
                                >
                                    <p>{msg.content}</p>
                                    {msg.role === 'assistant' && (
                                        <button
                                            className="mt-1 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                            <Volume2 size={12}/>
                                            播放
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef}/>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

// 主应用组件
export default function App() {
    const config: VoiceAssistantConfig = {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        OPENAI_PROXY_URL: process.env.NEXT_PUBLIC_OPENAI_PROXY_URL || 'https://api.openai.com',
    };

    if (!config.OPENAI_API_KEY) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center">
                        <div
                            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={32} className="text-red-500"/>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">配置缺失</h3>
                        <p className="text-gray-600 text-sm">
                            请在环境变量中设置 NEXT_PUBLIC_OPENAI_API_KEY
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <MinimalVoiceAssistant config={config}/>;
}
