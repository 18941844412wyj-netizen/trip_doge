"use client"

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {useEdgeSpeech, useSpeechRecognition} from '@lobehub/tts/react';
import {Tooltip, message, Spin} from 'antd';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Bot,
    User,
    X, RotateCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './VoiceChat.css'

import {Character} from "@/types";

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

const MinimalVoiceAssistant: React.FC<{ config: VoiceAssistantConfig, character: Character }> = ({
                                                                                                     config,
                                                                                                     character
                                                                                                 }) => {
    // 状态管理
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentAIResponse, setCurrentAIResponse] = useState('');
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
            if (needPlayWordRef) {
                setTTSText(needPlayWordRef.current + pendingTTSText);
                needPlayWordRef.current = ''
            } else {
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
        } else if (pendingTTSText) {
            console.log('等待播放:', pendingTTSText, canStartTTS, isTTSLoading);
            needPlayWordRef.current += pendingTTSText;
        }
    }, [pendingTTSText, autoPlay, isTTSLoading, setTTSText, startTTS, canStartTTS]);


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
                        {role: 'system', content: character.systemPrompt},
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
    }, [autoPlay, character, config, isTTSLoading, messages]);

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
        <div className="voice-root-min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center voice-root-min-h-screen relative px-4">
                    <div className="relative">
                        {/* 脉冲动画背景 - 粘土风格 */}
                        {isRecording && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-br from-red-300 to-red-400
                             rounded-full animate-ping opacity-25
                             shadow-[0_0_20px_rgba(239,68,68,0.4)]"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-red-300 to-red-400
                             rounded-full animate-ping animation-delay-200 opacity-20
                             shadow-[0_0_30px_rgba(239,68,68,0.3)]"></div>
                            </>
                        )}

                        {/* 录音按钮 - 粘土立体效果 */}
                        <button
                            onClick={toggleRecording}
                            disabled={isRecognizing || (isProcessingAI && !isStreaming)}
                            className={`
              relative w-32 h-32 md:w-40 md:h-40 rounded-full 
              flex flex-col items-center justify-center gap-2
              transition-all duration-300 transform active:scale-95
              before:content-[''] before:absolute before:inset-0 before:rounded-full
              before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-50
              after:content-[''] after:absolute after:inset-[2px] after:rounded-full
              after:bg-gradient-to-t after:from-white/20 after:to-transparent
              ${isRecording
                                ? `bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
                   shadow-[0_8px_24px_rgba(59,130,246,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] 
                   scale-110 animate-pulse`
                                : isRecognizing || (isProcessingAI && !isStreaming)
                                    ? `bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 cursor-not-allowed
                   shadow-[0_4px_16px_rgba(107,114,128,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]`
                                    : `bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
                   shadow-[0_6px_20px_rgba(59,130,246,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)] 
                   hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] 
                   hover:scale-105 hover:-translate-y-1`
                            }
            `}
                        >
                            <div className="relative z-10 text-center">
                                {isRecognizing ? (
                                    <div className="text-white">
                                        <Spin size="large" className="text-white"/>
                                    </div>
                                ) : isRecording ? (
                                    <div className='flex flex-col justify-center items-center'>
                                        <MicOff size={32} className="text-white drop-shadow-sm"/>
                                        <span
                                            className="text-white text-xs font-bold drop-shadow-sm">{formattedTime}</span>
                                    </div>
                                ) : (
                                    <div className='flex flex-col justify-center items-center'>
                                        <Mic size={32} className="text-white drop-shadow-sm"/>
                                        <span className="text-white text-xs font-bold drop-shadow-sm">点击说话</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl
                         shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                         border border-white/30">
                        <p className="text-gray-600 text-center text-sm md:text-base font-medium animate-fadeIn">
                            {(isRecognizing) || (isProcessingAI && !isStreaming) ? (recognizedText ? recognizedText : '正在倾听...') : ('点击按钮开始对话，我会立即回复你 ✨')}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 p-4 voice-chat-min-h-screen">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${
                                msg.role === 'user' ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                            shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)] 
                                            ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                                : 'bg-gradient-to-br from-purple-100 to-purple-200'}`}>
                                {msg.role === 'user'
                                    ? <User size={14} className="text-blue-600"/>
                                    : <Bot size={14} className="text-purple-600"/>
                                }
                            </div>
                            <div className={`
                  flex-1 px-4 py-3 rounded-2xl text-sm font-medium
                  shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                  transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800
                  ${msg.role === 'user'
                                ? 'rounded-br-lg'
                                : 'rounded-tl-lg cursor-pointer'
                            }
                `}>
                                <div className="flex items-start gap-1">
                                    {msg.role === 'assistant' ? (
                                        <div className='prose prose-sm max-w-none'>
                                            <ReactMarkdown>
                                                {msg.content || (msg.isStreaming ? '生成中...' : '')}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p>{msg.content || (msg.isStreaming ? '生成中...' : '')}</p>
                                    )}

                                    {msg.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse rounded-full"/>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-normal">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="w-8 h-8"></div>
                        </div>
                    ))}
                    <div ref={messagesEndRef}/>
                </div>
            )}

            {/* 工具栏 - 粘土风格 */}
            <div className="absolute bottom-0 mx-auto px-4 py-4 w-full">
                <div className="max-w-md mx-auto bg-white/70 backdrop-blur-md rounded-2xl p-3
                       shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                       border border-white/30">
                    <div className="flex items-center justify-center gap-6">

                        {/* 音量按钮 - 粘土风格 */}
                        <Tooltip title={autoPlay ? "自动播放开启" : "自动播放关闭"}>
                            <button
                                onClick={() => setAutoPlay(!autoPlay)}
                                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 transform active:scale-95
                  shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.5)]
                  ${autoPlay
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                                }
                  hover:scale-105 hover:-translate-y-0.5
                `}
                            >
                                {autoPlay ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                            </button>
                        </Tooltip>

                        {/* 刷新按钮 - 粘土风格 */}
                        {messages.length > 0 && (<Tooltip title="重新开始">
                            <button
                                onClick={() => {
                                    setMessages([]);
                                    setCurrentAIResponse('');
                                }}
                                className="w-12 h-12 rounded-full flex items-center justify-center
                          bg-gradient-to-br from-orange-300 to-orange-400 text-white
                          shadow-[0_4px_12px_rgba(251,146,60,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                          transition-all duration-300 transform active:scale-95
                          hover:scale-105 hover:-translate-y-0.5"
                            >
                                <RotateCw size={18}/>
                            </button>
                        </Tooltip>)}


                        {/* 历史记录按钮 - 粘土风格 */}
                        {messages.length > 0 && (<Tooltip title="点击说话">
                            <div className="relative">
                                <button
                                    onClick={toggleRecording}
                                    className="w-12 h-12 rounded-full flex items-center justify-center
                            bg-gradient-to-br from-purple-300 to-purple-400 text-white
                            shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                            transition-all duration-300 transform active:scale-95
                            hover:scale-105 hover:-translate-y-0.5"
                                >
                                    {isRecognizing ? (
                                        <div className="text-white">
                                            <Spin size="small" className="text-white"/>
                                        </div>
                                    ) : isRecording ? (
                                        <div className='flex flex-col'>
                                            <MicOff size={18} className="text-white drop-shadow-sm"/>
                                        </div>
                                    ) : (
                                        <>
                                            <Mic size={18} className="text-white drop-shadow-sm"/>
                                        </>
                                    )}
                                </button>
                            </div>
                        </Tooltip>)}
                    </div>
                </div>
            </div>

            {/* 历史记录抽屉 - 粘土风格 */}
            {/*<Drawer*/}
            {/*    title={*/}
            {/*        <div className="flex items-center justify-between">*/}
            {/*            <div className="flex items-center gap-2">*/}
            {/*                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200*/}
            {/*                 rounded-full flex items-center justify-center*/}
            {/*                 shadow-[0_2px_8px_rgba(147,51,234,0.2)]">*/}
            {/*                    <MessageSquare size={16} className="text-purple-600"/>*/}
            {/*                </div>*/}
            {/*                <span className="font-bold text-gray-800">对话历史</span>*/}
            {/*            </div>*/}
            {/*            <button*/}
            {/*                onClick={() => setMessages([])}*/}
            {/*                className="px-3 py-1 bg-gradient-to-br from-red-400 to-red-500 text-white text-sm*/}
            {/*            rounded-full shadow-[0_2px_8px_rgba(239,68,68,0.3)]*/}
            {/*            hover:scale-105 transition-all duration-200"*/}
            {/*            >*/}
            {/*                清空*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    }*/}
            {/*    placement="right"*/}
            {/*    onClose={() => setShowHistory(false)}*/}
            {/*    open={showHistory}*/}
            {/*    width={400}*/}
            {/*    className="clay-drawer"*/}
            {/*    styles={{*/}
            {/*        body: {*/}
            {/*            background: 'linear-gradient(to bottom right, #fef7ed, #fdf2f8)',*/}
            {/*            padding: '16px'*/}
            {/*        }*/}
            {/*    }}*/}
            {/*>*/}

            {/*</Drawer>*/}
        </div>
    );
};

// 主应用组件保持不变
export default function VoiceChat({character}: { character: Character }) {
    const config: VoiceAssistantConfig = {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        OPENAI_PROXY_URL: process.env.NEXT_PUBLIC_OPENAI_PROXY_URL || 'https://api.openai.com',
    };

    if (!config.OPENAI_API_KEY) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
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

    return <MinimalVoiceAssistant config={config} character={character}/>;
}