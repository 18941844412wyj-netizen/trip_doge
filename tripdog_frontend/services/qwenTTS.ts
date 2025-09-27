import {useState, useRef, useCallback} from 'react';

// 通义千问实时语音合成 Hook
export const useQwenTTS = (initialText = '', options: {
    voice?: string;
    model?: string;
} = {}) => {
    const {
        voice = 'Cherry',
        model = 'qwen3-tts-flash-realtime'
    } = options;

    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const audioQueueRef = useRef<Array<{ audio: Int16Array, sampleRate: number }>>([]);
    const isProcessingRef = useRef(false);
    const textRef = useRef(initialText);

    // 创建音频上下文
    const createAudioContext = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.AudioContext)();
        }
        return audioContextRef.current;
    };

    // 播放音频数据
    const playAudio = async (audioData: Int16Array, sampleRate: number) => {
        if (!audioContextRef.current) return;

        try {
            // 将 Int16Array 转换为 Float32Array
            const floatArray = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                floatArray[i] = audioData[i] / 32768;
            }

            // 创建音频缓冲区
            const audioBuffer = audioContextRef.current.createBuffer(1, floatArray.length, sampleRate);
            audioBuffer.getChannelData(0).set(floatArray);

            // 播放音频
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();

            // 等待音频播放完成
            return new Promise<void>((resolve) => {
                source.onended = () => resolve();
            });
        } catch (err) {
            console.error('播放音频时出错:', err);
        }
    };

    // 处理音频队列
    const processAudioQueue = useCallback(async () => {
        if (isProcessingRef.current || audioQueueRef.current.length === 0) {
            return;
        }

        isProcessingRef.current = true;

        while (audioQueueRef.current.length > 0) {
            const {audio, sampleRate} = audioQueueRef.current.shift()!;
            await playAudio(audio, sampleRate);
        }

        isProcessingRef.current = false;
    }, [])

    // 设置要合成的文本
    const setText = useCallback((text: string) => {
        textRef.current = text;
    }, []);

    // 开始语音合成
    const start = useCallback(async () => {
        if (!textRef.current) return;

        setIsGlobalLoading(true);
        setIsPlaying(true);
        setError(null);
        audioQueueRef.current = [];

        try {
            // 创建音频上下文
            await createAudioContext();

            // 获取 API Key
            const apiKey = process.env.NEXT_PUBLIC_BAILIAN_API_KEY;
            if (!apiKey) {
                throw new Error('未找到 API Key，请设置 NEXT_PUBLIC_BAILIAN_API_KEY 环境变量');
            }

            // 构建 WebSocket URL
            const wsUrl = `wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=${model}`;

            // 创建 WebSocket 连接
            websocketRef.current = new WebSocket(wsUrl);

            // 设置请求头
            websocketRef.current.onopen = () => {
                if (websocketRef.current) {
                    websocketRef.current.send(JSON.stringify({
                        type: "session.update",
                        session: {
                            voice: voice,
                            response_format: "pcm",
                            sample_rate: 24000
                        }
                    }));

                    // 发送文本
                    websocketRef.current.send(JSON.stringify({
                        type: "input.append",
                        text: textRef.current
                    }));

                    websocketRef.current.send(JSON.stringify({
                        type: "input.commit"
                    }));
                }
            };

            // 处理消息
            websocketRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case "response.audio.delta":
                            if (data.delta && data.delta.audio && data.delta.sample_rate) {
                                // 解码 Base64 音频数据
                                const binaryString = atob(data.delta.audio);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }

                                // 转换为 Int16Array
                                const audioData = new Int16Array(bytes.buffer);
                                const sampleRate = data.delta.sample_rate;

                                // 添加到播放队列
                                audioQueueRef.current.push({audio: audioData, sampleRate});
                                await processAudioQueue();
                            }
                            break;

                        case "response.done":
                            // 等待所有音频播放完成
                            const checkQueue = setInterval(() => {
                                if (audioQueueRef.current.length === 0 && !isProcessingRef.current) {
                                    clearInterval(checkQueue);
                                    setIsPlaying(false);
                                    setIsGlobalLoading(false);
                                }
                            }, 100);
                            break;

                        case "error":
                            throw new Error(data.error?.message || '语音合成出错');
                    }
                } catch (err) {
                    console.error('处理 WebSocket 消息时出错:', err);
                    setError(err as Error);
                    setIsPlaying(false);
                    setIsGlobalLoading(false);
                }
            };

            // 处理错误
            websocketRef.current.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                setError(new Error('WebSocket 连接错误'));
                setIsPlaying(false);
                setIsGlobalLoading(false);
            };

            // 处理连接关闭
            websocketRef.current.onclose = () => {
                setIsPlaying(false);
                setIsGlobalLoading(false);
            };

        } catch (err) {
            console.error('启动语音合成时出错:', err);
            setError(err as Error);
            setIsPlaying(false);
            setIsGlobalLoading(false);
        }
    }, [model, voice, processAudioQueue]);

    // 停止语音合成
    const stop = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        audioQueueRef.current = [];
        isProcessingRef.current = false;
        setIsPlaying(false);
        setIsGlobalLoading(false);
    }, []);

    // 清理资源
    const cleanup = useCallback(() => {
        stop();
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [stop]);

    return {
        setText,
        start,
        stop,
        cleanup,
        isGlobalLoading,
        isPlaying,
        error
    };
};