"use client"

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {useEdgeSpeech, useSpeechRecognition} from '@lobehub/tts/react';
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
    isStreaming?: boolean; // 添加流式标记
}

const MinimalVoiceAssistant: React.FC<{ config: VoiceAssistantConfig }> = ({config}) => {
    // 状态管理
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentAIResponse, setCurrentAIResponse] = useState('');
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false); // 添加流式状态
    // const audioRef = useRef<HTMLAudioElement>(null!);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null); // 用于中断流式请求
    const [pendingTTSText, setPendingTTSText] = useState('');

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentAIResponse]); // 添加currentAIResponse依赖

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
    // ... existing code ...
    const {
        setText: setTTSText,
        isGlobalLoading: isTTSLoading,
        start: startTTS,
        canStart: canStartTTS,
    } = useEdgeSpeech('', {
        options: {
            voice: 'zh-CN-YunxiaNeural', // 可以改为其他声音: nova, shimmer, echo, fable, onyx
            //model: 'tts-1',
        },
    });

    const needPlayWordRef = useRef('');

    useEffect(() => {
        if (pendingTTSText && autoPlay && !isTTSLoading) {
            console.log('开始播放:', pendingTTSText, canStartTTS, isTTSLoading);
            if (needPlayWordRef){
                setTTSText(needPlayWordRef.current + pendingTTSText);
                needPlayWordRef.current = ''
            }else {
                setPendingTTSText(pendingTTSText);
            }
            const timer = setTimeout(() => {
                try {
                    startTTS();
                } catch (error) {
                    if (error instanceof Error && error.name !== 'AbortError') {
                        console.error('TTS播放错误:', error);
                    }
                }
                setPendingTTSText(''); // 清空待播放文本
            }, 100);

            return () => {
                clearTimeout(timer);
            };
        }else if(pendingTTSText){
            console.log('等待播放:', pendingTTSText, canStartTTS, isTTSLoading);
            needPlayWordRef.current += pendingTTSText;
        }
    }, [pendingTTSText, autoPlay, isTTSLoading, setTTSText, startTTS, canStartTTS]);

// ... existing code ...


    // 解析SSE流数据
    const parseSSEStream = (text: string) => {
        const lines = text.split('\n');
        let content = '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                    return {done: true, content};
                }
                try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                        content += delta;
                    }
                } catch (e) {
                    // 忽略解析错误
                    console.error('解析SSE数据时出错:', e);
                }
            }
        }
        return {done: false, content};
    };

    function splitAtFirstValidSentenceEnding(text: string, minSentenceLength: number = 1) {
        // 增强正则表达式，处理中英文标点，并考虑以下情况：
        // 1. 多个连续的句末标点 (e.g., "Hello!!")。
        // 2. 忽略英文省略号 "..." 和 Unicode 省略号 "…" (U+2026), "‥" (U+2025)。
        // 3. 忽略数字中的小数点 (e.g., "1.2")。
        // 4. 忽略常见英文缩写中的点 (e.g., "Mr. Smith", "e.g.").
        // 5. 考虑中文全角句号 `．` (U+FF0E)。
        // 6. 确保标点后不是紧跟着字母或数字 (e.g., "word.next" vs "word. Next")。

        const sentenceEndingRegex = new RegExp(
            // 负向后行断言 (Negative Lookbehind) - 排除非句末标点的情况
            '(?<!\\.\\.)' + // 排除英文省略号 "..." 中的第二个和第三个点
            '(?<![…‥])' + // 排除 Unicode 省略号 "…" (U+2026) 和 "‥" (U+2025)
            '(?<!\\d\\.)' + // 排除数字中的小数点，如 "1.2"
            // 排除常见英文缩写，如 "Mr."。"\\b" 确保是单词边界，避免误判如 "data.xml"
            '(?<!\\b(?:Mr|Dr|Mrs|Ms|Jr|Sr|Prof|e\\.g|i\\.e|etc|vs|v|viz|cf)\\.)' +

            // 匹配句末标点符号本身，允许连续的相同或不同句末标点
            '[。！？.!?．]+' + // 匹配一个或多个句号、问号、感叹号、英文句号 `.`、中文全角句号 `．`

            // 负向先行断言 (Negative Lookahead) - 确保标点后不紧跟字母或数字
            // 这有助于区分 "word.next" (不应分割) 和 "word. Next" (应分割)
            '(?![0-9a-zA-Z])'
        );

        const match = text.match(sentenceEndingRegex);

        if (match && match.index !== undefined) {
            // match[0] 包含了匹配到的完整标点符号串 (e.g., "!", "!!", "。")
            // 修正 endIndex 的计算，应加上匹配到的标点长度
            const endIndex = match.index + match[0].length;

            const firstSentence = text.substring(0, endIndex).trim();
            const remainingText = text.substring(endIndex).trim();

            // 确保句子有最小长度（避免太短的片段，如仅有标点的片段）
            // 这里的 minSentenceLength 现在是可配置的参数
            if (firstSentence.length < minSentenceLength) {
                // 如果第一个“句子”过短，则认为没有找到有效的句末进行分割
                return {
                    hasSentenceEnding: false,
                    firstSentence: text, // 返回原文本作为一个整体
                    remainingText: ""
                };
            }

            return {
                hasSentenceEnding: true,
                firstSentence: firstSentence,
                remainingText: remainingText
            };
        }

        // 如果整个文本中都没有找到任何有效的句末标点
        return {
            hasSentenceEnding: false,
            firstSentence: text,
            remainingText: ""
        };
    }

    // 流式获取AI回答
    const getAIResponseStream = useCallback(async (userMessage: string, messageId: string): Promise<string> => {
        // 创建新的AbortController
        abortControllerRef.current = new AbortController();

        // let fullResponse = '';
        let finalResponse = ''
        setIsStreaming(true);

        try {
            const response = await fetch(`${config.OPENAI_PROXY_URL || 'https://api.openai.com/v1'}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
                },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {role: 'system', content: '你是一个友好简洁的AI助手。请用简短清晰的语言回答，避免冗长的解释。'},
                        ...messages.slice(-10).map(msg => ({role: msg.role, content: msg.content})),
                        {role: 'user', content: userMessage}
                    ],
                    max_tokens: 800,
                    temperature: 1.5,
                    stream: true, // 启用流式输出
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                return `API请求失败: ${response.status} ${response.statusText}`
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                return '无法读取响应流'
            }

            let buffer = '';
            let fullResponse = '';

            while (true) {
                const {done, value} = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                const {done: streamDone, content} = parseSSEStream(buffer);

                if (content) {
                    fullResponse += content;
                    finalResponse += content
                    // 实时更新当前AI响应
                    setCurrentAIResponse(finalResponse);

                    // 实时更新消息列表中的内容
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const messageIndex = newMessages.findIndex(m => m.id === messageId);
                        if (messageIndex !== -1) {
                            newMessages[messageIndex].content = finalResponse;
                        }
                        return newMessages;
                    });

                    const {
                        hasSentenceEnding,
                        firstSentence,
                        remainingText
                    } = splitAtFirstValidSentenceEnding(fullResponse)

                    console.log({
                        hasSentenceEnding,
                        firstSentence,
                        remainingText
                    })
                    if (hasSentenceEnding && autoPlay && !isTTSLoading) {
                        console.log('自动播放')
                        setPendingTTSText(firstSentence);
                        fullResponse = remainingText
                    }
                }

                if (streamDone) {
                    break;
                }

                // 清理已处理的buffer内容
                const lastNewlineIndex = buffer.lastIndexOf('\n');
                if (lastNewlineIndex !== -1) {
                    buffer = buffer.slice(lastNewlineIndex + 1);
                }
            }

            if (fullResponse && autoPlay && !isTTSLoading) {
                setPendingTTSText(finalResponse);
            }
            return finalResponse;

        } catch {
            console.error('AI回答错误:');
            return finalResponse || '抱歉，连接出现问题，请稍后重试。';
        } finally {
            setIsStreaming(false);
        }
    }, [autoPlay, config, isTTSLoading, messages]);

    // 处理消息（流式发送和播放）
    const handleProcessMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // 中断之前的流式请求（如果有）
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

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
        setCurrentAIResponse(''); // 清空当前AI响应

        try {
            // 先添加一个空的AI消息占位
            const assistantMessageId = `assistant-${Date.now()}`;
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
            };
            setMessages(prev => [...prev, assistantMessage]);

            // 获取流式AI回答
            const finalResponse = await getAIResponseStream(text, assistantMessageId);

            // 标记流式完成
            setMessages(prev => {
                const newMessages = [...prev];
                const messageIndex = newMessages.findIndex(m => m.id === assistantMessageId);
                if (messageIndex !== -1) {
                    newMessages[messageIndex].isStreaming = false;
                    newMessages[messageIndex].content = finalResponse;
                }
                return newMessages;
            });

        } catch (error) {
            message.error('处理失败，请重试');
            console.error('处理错误:', error);
        } finally {
            setIsProcessingAI(false);
        }
    }, [getAIResponseStream]);

    // 切换录音
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            // 中断当前的流式请求
            if (abortControllerRef.current && isStreaming) {
                abortControllerRef.current.abort();
            }
            startRecording();
            setCurrentUserInput('');
            setCurrentAIResponse('');
        }
    };

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* 主界面 - 居中的圆形按钮 */}
            <div className="flex flex-col items-center justify-center min-h-screen px-4 relative">
                {/* 顶部控制栏 - 固定位置 */}
                <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-medium text-gray-800 block md:hidden">TripDoge</h1>
                            <div className="hidden md:block"></div>
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

                            {/* AI回复或加载状态 - 支持流式显示 */}
                            {(isProcessingAI || currentAIResponse) && (
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-purple-600"/>
                                    </div>
                                    <div
                                        className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                                        {isProcessingAI && !currentAIResponse ? (
                                            <div className="flex items-center gap-2">
                                                <Spin size="small"/>
                                                <span className="text-sm text-gray-500">思考中...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-1">
                                                <p className="text-sm md:text-base text-gray-800">{currentAIResponse}</p>
                                                {isStreaming && (
                                                    <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse"/>
                                                )}
                                            </div>
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
                            disabled={isRecognizing || (isProcessingAI && !isStreaming)}
                            className={`
                relative w-32 h-32 md:w-40 md:h-40 rounded-full 
                flex flex-col items-center justify-center gap-2
                transition-all duration-300 transform active:scale-95
                ${isRecording
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl scale-110'
                                : isRecognizing || (isProcessingAI && !isStreaming)
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
                                >
                                    <div className="flex items-start gap-1">
                                        <p>{msg.content || (msg.isStreaming ? '生成中...' : '')}</p>
                                        {msg.isStreaming && (
                                            <span className="inline-block w-1.5 h-3 bg-gray-600 animate-pulse"/>
                                        )}
                                    </div>
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

// 主应用组件保持不变
export default function VoiceChat() {
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