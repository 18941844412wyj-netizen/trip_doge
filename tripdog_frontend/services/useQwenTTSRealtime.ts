import { useState, useRef, useCallback, useEffect } from 'react';

export const useQwenTTSRealtime = (initialText = '', options: {
    voice?: string;
    model?: string;
    language_type?: string;
    sampleRate?: number;
} = {}) => {
    const {
        voice = 'Cherry',
        model = 'qwen3-tts-flash-realtime',
        language_type = 'Chinese',
        sampleRate = 16000
    } = options;

    const [isGlobalLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [progress, setProgress] = useState(0);
    const [text, setTextState] = useState(initialText); // 添加文本状态

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isProcessingRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 设置文本的方法
    const setText = useCallback((newText: string) => {
        setTextState(newText);
        console.log('设置文本：', newText)
        setError(null); // 清除之前的错误
    }, []);

    // 初始化音频上下文
    const initAudioContext = useCallback(async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.AudioContext)({
                sampleRate: sampleRate
            });
        }

        // 如果音频上下文被暂停，恢复它
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        return audioContextRef.current;
    }, [sampleRate]);

    // Base64 转 PCM
    const base64ToPCM = (base64: string): Float32Array => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 将 16-bit PCM 转换为 Float32
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);

        for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768.0; // 归一化到 [-1, 1]
        }

        return floatData;
    };

    // 播放音频队列
    const processAudioQueue = useCallback(async () => {
        if (isProcessingRef.current || audioQueueRef.current.length === 0) {
            return;
        }

        isProcessingRef.current = true;
        const audioContext = await initAudioContext();

        while (audioQueueRef.current.length > 0) {
            const audioData = audioQueueRef.current.shift();
            if (!audioData) continue;

            const audioBuffer = audioContext.createBuffer(1, audioData.length, sampleRate);
            audioBuffer.getChannelData(0).set(audioData);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            const startTime = Math.max(audioContext.currentTime, nextStartTimeRef.current);
            source.start(startTime);

            nextStartTimeRef.current = startTime + audioBuffer.duration;

            // 更新进度
            const totalQueued = audioQueueRef.current.length;
            setProgress(totalQueued > 0 ? (1 - totalQueued / (totalQueued + 1)) * 100 : 100);
        }

        isProcessingRef.current = false;
    }, [initAudioContext, sampleRate]);

    // 停止语音合成
    const stop = useCallback(() => {
        // 取消正在进行的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 关闭 EventSource
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        // 清空音频队列
        audioQueueRef.current = [];
        isProcessingRef.current = false;
        nextStartTimeRef.current = 0;

        // 停止音频上下文
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
            audioContextRef.current.suspend();
        }

        setIsPlaying(false);
        setIsLoading(false);
        setProgress(0);
    }, []);

    // 开始实时语音合成（可选传入文本参数）
    const start = useCallback(async (customText?: string) => {
        // 使用传入的文本或状态中的文本
        const textToSpeak = customText || text;

        console.log('开始合成文本：', textToSpeak);
        if (!textToSpeak || textToSpeak.trim().length === 0) {
            setError(new Error('请输入要合成的文本'));
            return;
        }

        // 如果传入了新文本，更新状态
        if (customText && customText !== text) {
            setTextState(customText);
        }

        // 清理之前的状态
        stop();

        setIsLoading(true);
        setIsPlaying(true);
        setError(null);
        setProgress(0);
        audioQueueRef.current = [];
        nextStartTimeRef.current = 0;

        try {
            // 创建 AbortController 用于取消请求
            abortControllerRef.current = new AbortController();

            // 使用 fetch 和 ReadableStream 处理 SSE
            const response = await fetch('/api/qwen-tts-realtime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: textToSpeak,
                    voice: voice,
                    model: model,
                    language_type: language_type
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            setIsPlaying(false);
                            setProgress(100);
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.audio) {
                                // 将 base64 音频数据转换为 PCM 并加入队列
                                const pcmData = base64ToPCM(parsed.audio);
                                audioQueueRef.current.push(pcmData);

                                // 开始处理音频队列
                                processAudioQueue();

                                setIsLoading(false);
                            }

                            if (parsed.is_last) {
                                setTimeout(() => {
                                    setIsPlaying(false);
                                    setProgress(100);
                                }, nextStartTimeRef.current * 1000);
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('实时语音合成出错:', err);
                setError(err as Error);
            }
            setIsPlaying(false);
            setIsLoading(false);
        }
    }, [text, stop, voice, model, language_type, processAudioQueue]);

    // 清理资源
    const cleanup = useCallback(() => {
        stop();

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [stop]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        // 状态
        text,
        isGlobalLoading,
        isPlaying,
        error,
        progress,

        // 方法
        setText,
        start,
        stop,
        cleanup
    };
};