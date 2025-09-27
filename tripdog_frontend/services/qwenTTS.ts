import {useState, useRef, useCallback, useEffect} from 'react';

// 通义千问语音合成 Hook (非实时版本)
export const useQwenTTS = (initialText = '', options: {
    voice?: string;
    model?: string;
    language_type?: string;
} = {}) => {
    const {
        voice = 'Cherry',
        model = 'qwen3-tts-flash',
        language_type = 'Chinese'
    } = options;

    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const textRef = useRef(initialText);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    // 创建音频上下文
    const createAudioContext = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window).AudioContext)();
        }
        return audioContextRef.current;
    };

    // 设置要合成的文本
    const setText = useCallback((text: string) => {
        textRef.current = text;
    }, []);

    // 开始语音合成
    const start = useCallback(async () => {
        if (!textRef.current) {
            setError(new Error('请输入要合成的文本'));
            return;
        }

        setIsGlobalLoading(true);
        setIsPlaying(true);
        setError(null);

        try {
            // 调用后端API获取语音
            const response = await fetch('/api/qwen-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: textRef.current,
                    voice: voice,
                    model: model,
                    language_type: language_type
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            // 检查是否有音频数据
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Received empty audio data');
            }

            // 创建新的音频上下文
            const audioContext = await createAudioContext();

            // 解码WAV音频数据
            let audioBuffer: AudioBuffer;
            try {
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            } catch (decodeError) {
                console.error('Audio decoding failed:', decodeError);
                // 尝试创建一个短的静音缓冲区作为后备
                audioBuffer = audioContext.createBuffer(1, 1, 22050);
                setError(new Error('音频解码失败，播放静音'));
            }

            // 播放音频
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            // 保存引用以便停止播放
            sourceRef.current = source;

            // 监听播放完成事件
            source.onended = () => {
                setIsPlaying(false);
                setIsGlobalLoading(false);
                sourceRef.current = null;
            };
        } catch (err) {
            console.error('语音合成出错:', err);
            setError(err as Error);
            setIsPlaying(false);
            setIsGlobalLoading(false);
        }
    }, [model, voice, language_type]);

    // 停止语音合成
    const stop = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            sourceRef.current = null;
        }
        
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsPlaying(false);
        setIsGlobalLoading(false);
    }, []);

    // 清理资源
    const cleanup = useCallback(() => {
        stop();
    }, [stop]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

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