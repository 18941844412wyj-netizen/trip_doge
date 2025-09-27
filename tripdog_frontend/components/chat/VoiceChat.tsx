"use client"

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {useEdgeSpeech, useSpeechRecognition} from '@lobehub/tts/react';
import {Tooltip, Spin, App} from 'antd';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    User,
    X, RotateCw, History, Brain, Compass
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './VoiceChat.css'

import {Character} from "@/types";
import {useQwenTTS} from '@/services/qwenTTS';


// 消息类型
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean; // 添加流式标记
}

export default function VoiceChat({character}: { character: Character }) {
    // 状态管理
    const {message} = App.useApp();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentAIResponse, setCurrentAIResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false); // 添加流式状态
    const [showHistory, setShowHistory] = useState(false); // 添加历史记录显示状态
    const [inputValue, setInputValue] = useState(''); // 添加输入框状态
    const [ttsService, setTtsService] = useState<'edge' | 'qwen'>('edge'); // 添加 TTS 服务选择状态
    // const audioRef = useRef<HTMLAudioElement>(null!);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null); // 用于中断流式请求
    const [pendingTTSText, setPendingTTSText] = useState('');
    const [selectedEdgeVoice, setSelectedEdgeVoice] = useState('zh-CN-YunxiaNeural');
    const [selectedQwenVoice, setSelectedQwenVoice] = useState('Cherry');

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

    // Edge TTS (原有实现)
    const {
        setText: setEdgeTTSText,
        isGlobalLoading: isTTSLoading,
        start: startEdgeTTS,
        canStart: canStartEdgeTTS,
    } = useEdgeSpeech('', {
        options: {
            voice: selectedEdgeVoice,
        },
    });

    // 通义千问 TTS
    const {
        setText: setQwenTTSText,
        isGlobalLoading: isQwenTTSLoading,
        start: startQwenTTS,
        error: qwenTTSError
    } = useQwenTTS('', {
        voice: selectedQwenVoice,
        model: 'qwen3-tts-flash-realtime'
    });

    // 定义可用的语音选项
    const edgeVoiceOptions = [
        {value: 'zh-CN-XiaochenNeural', label: '晓晨 (女)'},
        {value: 'zh-CN-XiaohanNeural', label: '晓涵 (女)'},
        {value: 'zh-CN-XiaomengNeural', label: '晓梦 (女)'},
        {value: 'zh-CN-XiaomoNeural', label: '晓墨 (女)'},
        {value: 'zh-CN-XiaoqiuNeural', label: '晓秋 (女)'},
        {value: 'zh-CN-XiaoruiNeural', label: '晓睿 (女)'},
        {value: 'zh-CN-XiaoshuangNeural', label: '晓双 (女)'},
        {value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女)'},
        {value: 'zh-CN-XiaoxuanNeural', label: '晓萱 (女)'},
        {value: 'zh-CN-XiaoyanNeural', label: '晓颜 (女)'},
        {value: 'zh-CN-XiaoyiNeural', label: '晓艺 (女)'},
        {value: 'zh-CN-XiaoyouNeural', label: '晓悠 (女)'},
        {value: 'zh-CN-XiaozhenNeural', label: '晓珍 (女)'},
        {value: 'zh-CN-YunfengNeural', label: '云枫 (男)'},
        {value: 'zh-CN-YunhaoNeural', label: '云浩 (男)'},
        {value: 'zh-CN-YunjianNeural', label: '云健 (男)'},
        {value: 'zh-CN-YunxiaNeural', label: '云夏 (男)'},
        {value: 'zh-CN-YunxiNeural', label: '云希 (男)'},
        {value: 'zh-CN-YunyangNeural', label: '云扬 (男)'},
        {value: 'zh-CN-YunyeNeural', label: '云野 (男)'},
        {value: 'zh-CN-YunzeNeural', label: '云泽 (男)'},
    ];

    const qwenVoiceOptions = [
        {value: 'Cherry', label: 'Cherry (女)'},
        {value: 'Serena', label: 'Serena (女)'},
        {value: 'Ethan', label: 'Ethan (男)'},
        {value: 'Chelsie', label: 'Chelsie (女)'},
    ];

    // 监听通义千问 TTS 错误
    useEffect(() => {
        if (qwenTTSError) {
            message.error(`通义千问 TTS 错误: ${qwenTTSError.message}`);
        }
    }, [message, qwenTTSError]);

    const needPlayWordRef = useRef('');

    // 获取当前使用的 TTS 状态
    const getCurrentTTSState = useCallback(() => {
        if (ttsService === 'qwen') {
            return {
                isTTSLoading: isQwenTTSLoading,
                setTTSText: setQwenTTSText,
                startTTS: startQwenTTS,
                selectedVoice: selectedQwenVoice
            };
        } else {
            return {
                isTTSLoading: isTTSLoading,
                setTTSText: setEdgeTTSText,
                startTTS: startEdgeTTS,
                canStartTTS: canStartEdgeTTS,
                selectedVoice: selectedEdgeVoice
            };
        }
    }, [ttsService, isQwenTTSLoading, setQwenTTSText, startQwenTTS, isTTSLoading, setEdgeTTSText, startEdgeTTS, canStartEdgeTTS, selectedEdgeVoice, selectedQwenVoice]);

    useEffect(() => {
        const {isTTSLoading, setTTSText, startTTS} = getCurrentTTSState();

        if (pendingTTSText && autoPlay && !isTTSLoading) {
            console.log('开始播放:', pendingTTSText, isTTSLoading);
            if (needPlayWordRef.current) {
                setTTSText(needPlayWordRef.current + pendingTTSText);
                needPlayWordRef.current = ''
            } else {
                setTTSText(pendingTTSText);
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
            console.log('等待播放:', pendingTTSText, isTTSLoading);
            needPlayWordRef.current += pendingTTSText;
        }
    }, [pendingTTSText, autoPlay, getCurrentTTSState]);

    // 解析SSE流数据
    const parseSSEStream = (text: string) => {
        const lines = text.split('\n');
        let content = '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]' || data === 'end') {
                    return {done: true, content};
                }
                try {
                    const parsed = JSON.parse(data);
                    // 处理新的流格式: {"type": "message", "content": "文本"}
                    if (parsed.type === 'message') {
                        content += parsed.content;
                    } else if (parsed.type === 'end') {
                        return {done: true, content};
                    }
                } catch (e) {
                    // 忽略解析错误
                    console.error('解析SSE数据时出错:', e);
                }
            }
        }
        return {done: false, content};
    };

    // 流式获取AI回答
    const getAIResponseStream = useCallback(async (userMessage: string, messageId: string): Promise<string> => {
        // 创建新的AbortController
        abortControllerRef.current = new AbortController();

        // let fullResponse = '';
        let finalResponse = ''
        setIsStreaming(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${character.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    message: userMessage
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

            while (true) {
                const {done, value} = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                const {done: streamDone, content} = parseSSEStream(buffer);

                if (content) {
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

                    // 实时进行TTS播放 - 仅在有内容且自动播放开启时触发
                    if (autoPlay && content.trim()) {
                        setPendingTTSText(prev => prev + content);
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

            return finalResponse;

        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('AI回答错误:', error);
                return finalResponse || '抱歉，连接出现问题，请稍后重试。';
            }
            // 如果是用户主动中断，不显示错误信息
            return finalResponse;
        } finally {
            setIsStreaming(false);
        }
    }, [autoPlay, character.id]);

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

            // 清空待播放文本队列
            setPendingTTSText('');

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
    }, [getAIResponseStream, message]);

    // 处理发送消息
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isProcessingAI || isStreaming) return;

        const text = inputValue.trim();
        setInputValue('');
        await handleProcessMessage(text);
    };

    // 切换录音
    const toggleRecording = () => {
        // 如果AI正在处理或流式传输，则不允许录音
        if (isProcessingAI || isStreaming) return;

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

    // 获取录音按钮的样式类
    const getRecordingButtonClass = () => {
        const baseClasses = `
          relative w-28 h-28 md:w-34 md:h-34 rounded-full 
          flex flex-col items-center justify-center gap-2
          transition-all duration-300 transform active:scale-95
          before:content-[''] before:absolute before:inset-0 before:rounded-full
          before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-50
          after:content-[''] after:absolute after:inset-[2px] after:rounded-full
          after:bg-gradient-to-t after:from-white/20 after:to-transparent
        `;

        if (isRecording) {
            return `${baseClasses} 
              bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
              shadow-[0_8px_24px_rgba(59,130,246,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] 
              scale-110 animate-pulse`;
        }

        return `${baseClasses}
          bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
          shadow-[0_6px_20px_rgba(59,130,246,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)] 
          hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] 
          hover:scale-105 hover:-translate-y-1`;
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
        <div className="voice-root-min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col">
            {/* 头部 */}
            <div className='hidden md:block relative top-0 w-full mx-auto'>
                <div
                    className="m-2 rounded-full flex items-center justify-between p-4 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                    <div className="flex items-center gap-3">
                        {/* 角色头像 */}
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                            style={{background: character.bgGradient}}
                        >
                                <span className="font-bold text-white drop-shadow-md">
                                    {character.avatar}
                                </span>
                        </div>

                        {/* 角色信息 */}
                        <div>
                            <h3 className="font-bold text-gray-800">{character.name}</h3>
                            <p className="text-xs text-gray-600 line-clamp-1">{character.description}</p>
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        {/* TTS 服务切换按钮 */}
                        <Tooltip title={`当前使用: ${ttsService === 'qwen' ? '通义千问' : 'Edge'} TTS`}>
                            <button
                                onClick={() => setTtsService(ttsService === 'qwen' ? 'edge' : 'qwen')}
                                className={`w-12 h-12 rounded-full flex items-center justify-center mr-2
                                            transition-all duration-300 transform active:scale-95
                                            shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                            ${ttsService === 'qwen'
                                    ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-[0_4px_12px_rgba(72,187,120,0.3)]'
                                    : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                }
                                            hover:scale-105 hover:-translate-y-0.5`}
                            >
                                {ttsService === 'qwen' ? <Brain size={18}/> : <Compass size={18}/>}
                            </button>
                        </Tooltip>

                        {/* Edge TTS 语音选择 */}
                        {ttsService === 'edge' && (
                            <div className="mr-2">
                                <select
                                    value={selectedEdgeVoice}
                                    onChange={(e) => setSelectedEdgeVoice(e.target.value)}
                                    className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] transition-all duration-300"
                                >
                                    {edgeVoiceOptions.map((voice) => (
                                        <option key={voice.value} value={voice.value}>
                                            {voice.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 通义千问 TTS 语音选择 */}
                        {ttsService === 'qwen' && (
                            <div className="mr-2">
                                <select
                                    value={selectedQwenVoice}
                                    onChange={(e) => setSelectedQwenVoice(e.target.value)}
                                    className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] transition-all duration-300"
                                >
                                    {qwenVoiceOptions.map((voice) => (
                                        <option key={voice.value} value={voice.value}>
                                            {voice.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 历史记录按钮 */}
                        {/* 音量按钮 - 粘土风格 */}
                        <Tooltip title={autoPlay ? "自动播放开启" : "自动播放关闭"}>
                            <button
                                onClick={() => setAutoPlay(!autoPlay)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center mr-2
                                            transition-all duration-300 transform active:scale-95
                                            shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                            ${autoPlay
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                                }
                                            hover:scale-105 hover:-translate-y-0.5`}
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
                                className="w-12 h-12 rounded-full flex items-center justify-center mr-2
                          bg-gradient-to-br from-orange-300 to-orange-400 text-white
                          shadow-[0_4px_12px_rgba(251,146,60,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                          transition-all duration-300 transform active:scale-95
                          hover:scale-105 hover:-translate-y-0.5"
                            >
                                <RotateCw size={18}/>
                            </button>
                        </Tooltip>)}

                        {messages.length > 0 && (<Tooltip title="历史记录">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="w-12 h-12 rounded-full flex items-center justify-center
                            bg-gradient-to-br from-purple-300 to-purple-400 text-white
                            shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                            transition-all duration-300 transform active:scale-95
                            hover:scale-105 hover:-translate-y-0.5"
                            >
                                <History size={18}/>
                            </button>
                        </Tooltip>)}

                    </div>
                </div>
            </div>

            {/* 聊天框 */}
            <div className='flex-1'>
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center relative px-4">
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
                                disabled={isRecognizing || isProcessingAI || isStreaming}
                                className={getRecordingButtonClass()}
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
                                            <span
                                                className="text-white text-xs font-bold drop-shadow-sm">点击说话</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* 添加文本输入框，允许在初始状态下打字 */}
                        {(!isProcessingAI && !isStreaming && !isRecognizing) && (<div className="mt-6 w-full max-w-md">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="输入消息..."
                                    className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium
                                    bg-white/70 backdrop-blur-sm text-gray-800
                                    shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                    border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isProcessingAI || isStreaming || isRecognizing || !inputValue.trim()}
                                    className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-white
                                    transition-all duration-300 transform active:scale-95
                                    shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                    hover:scale-105 hover:-translate-y-0.5
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isProcessingAI || isStreaming || isRecognizing || !inputValue.trim()
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                                        : 'bg-gradient-to-br from-purple-300 to-purple-400'
                                    }
                                `}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-5 h-5"
                                    >
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </div>)}

                        <div className="mt-8 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl
                         shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                         border border-white/30">
                            <p className="text-gray-600 text-center text-sm md:text-base font-medium animate-fadeIn">
                                {(isRecognizing) || (isProcessingAI && !isStreaming) ? (recognizedText ? recognizedText : '正在倾听...') : (isProcessingAI || isStreaming ? 'AI正在思考中...' : '点击按钮开始对话，或在上方输入框输入文字')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className='h-[calc(100vh-148px)] md:h-[calc(100vh-182px)] w-full'>
                        <div className="h-full space-y-4 p-4 overflow-y-scroll clay-scroll">
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
                                            : <div className="text-purple-600">{character.avatar}</div>
                                        }
                                    </div>
                                    <div className={`
                  flex-1 px-4 py-3 rounded-2xl text-sm font-medium
                  shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                  transition-all duration-200 hover:scale-[1.02]
                  ${msg.role === 'assistant'
                                        ? 'rounded-tl-lg cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800'
                                        : 'rounded-br-lg bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800'
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

                                            {/*{msg.isStreaming && (*/}
                                            {/*    <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse rounded-full"/>*/}
                                            {/*)}*/}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 font-normal">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8"></div>
                                </div>
                            ))}
                            {(isRecognizing || (isProcessingAI && !isStreaming)) && (
                                <div className="flex items-start gap-3 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                            shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                            bg-gradient-to-br from-blue-100 to-blue-200">
                                        <User size={14} className="text-blue-600"/>
                                    </div>
                                    <div className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium
                                          shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                          transition-all duration-200 hover:scale-[1.02]
                                          rounded-br-lg bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
                                        <div className="flex items-start gap-1">
                                            {recognizedText ? recognizedText : '正在倾听...'}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8"></div>
                                </div>
                            )}

                            <div ref={messagesEndRef}/>
                        </div>
                    </div>
                )}
            </div>

            {/* 工具栏 - 聊天框 */}
            <>{messages.length > 0 && (<div className="relative bottom-0 mx-auto w-full">
                <div className="mb-2 ml-2 mr-2 backdrop-blur-md p-3 rounded-full
                       shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                    {/* 文本输入区域 */}
                    <div className="flex items-center gap-2">
                        <Tooltip title="点击说话">
                            <div className="relative">
                                <button
                                    onClick={toggleRecording}
                                    disabled={isProcessingAI || isStreaming}
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center text-white
                                        transition-all duration-300 transform active:scale-95
                                        shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                        hover:scale-105 hover:-translate-y-0.5
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${isProcessingAI || isStreaming
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                                        : 'bg-gradient-to-br from-purple-300 to-purple-400'
                                    }
                                    `}
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
                        </Tooltip>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="输入消息..."
                                disabled={isProcessingAI || isStreaming || isRecognizing}
                                className="w-full px-4 py-3 rounded-2xl text-sm font-medium
                                    bg-white/70 backdrop-blur-sm text-gray-800
                                    shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                    border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <Tooltip title="发送消息">
                            <button
                                onClick={handleSendMessage}
                                disabled={isProcessingAI || isStreaming || isRecognizing || !inputValue.trim()}
                                className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-white
                                    transition-all duration-300 transform active:scale-95
                                    shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                    hover:scale-105 hover:-translate-y-0.5
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isProcessingAI || isStreaming || isRecognizing || !inputValue.trim()
                                    ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                                    : 'bg-gradient-to-br from-purple-300 to-purple-400'
                                }
                                `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>)}</>

            {showHistory && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col
                                 border border-white/30">
                        <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm
                                     shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                     border-b border-white/30 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-gray-800">对话历史</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center
                                         bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600
                                         shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                         transition-all duration-300 transform active:scale-95
                                         hover:scale-105 hover:-translate-y-0.5"
                            >
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-white/50 backdrop-blur-sm">
                            {messages.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">暂无对话历史</p>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                                             shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                                                    style={{background: character.bgGradient}}
                                                >
                                                    <span className="font-bold text-white text-xs drop-shadow-md">
                                                        {character.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                                                    msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-br-none shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]'
                                                        : 'bg-gradient-to-br from-pink-50 to-pink-100 text-gray-800 rounded-bl-none shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-white/30'
                                                }`}
                                            >
                                                {msg.role === 'assistant' ? (
                                                    <div className="prose prose-sm max-w-none">
                                                        <ReactMarkdown>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p>{msg.content}</p>
                                                )}
                                                <p className="text-xs mt-1 opacity-70">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0
                                                            shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]">
                                                    <User size={14} className="text-white"/>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {messages.length > 0 && (
                            <div className="p-4 bg-white/70 backdrop-blur-sm
                                         shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]
                                         border-t border-white/30">
                                <button
                                    onClick={() => {
                                        setMessages([]);
                                        setShowHistory(false);
                                    }}
                                    className="w-full py-2 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-xl font-medium
                                             shadow-[0_4px_12px_rgba(239,68,68,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]
                                             transition-all duration-300 transform active:scale-95
                                             hover:scale-[1.02] hover:-translate-y-0.5"
                                >
                                    清空历史记录
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}