// components/chat/VoiceChat.tsx
'use client';

import {useOpenAISTT} from '@lobehub/tts/react';
import {Icon} from '@lobehub/ui';
import {StoryBook, useControls, useCreateStore} from '@lobehub/ui/storybook';
import {Button, Input} from 'antd';
import {Mic, StopCircle} from 'lucide-react';
import {Flexbox} from 'react-layout-kit';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const OPENAI_PROXY_URL = process.env.OPENAI_PROXY_URL!

export function VoiceChat() {
    const store = useCreateStore();
    const api = useControls(
        {
            OPENAI_API_KEY: {
                label: 'OPENAI_API_KEY',
                value: OPENAI_API_KEY,
            },
            OPENAI_PROXY_URL: {
                label: 'OPENAI_PROXY_URL',
                value: OPENAI_PROXY_URL,
            },
            serviceUrl: '',
        },
        {store},
    );

    const {locale} = useControls(
        {
            locale: 'zh-CN',
        },
        {store},
    );

    const {text, start, stop, isLoading, isRecording, url, formattedTime} = useOpenAISTT(locale, {
        api,
        autoStop: true,
    });
    return (
        <StoryBook levaStore={store}>
            <Flexbox gap={8}>
                {isRecording ? (
                    <Button block icon={<Icon icon={StopCircle}/>} onClick={stop}>
                        Stop {formattedTime}
                    </Button>
                ) : isLoading ? (
                    <Button block loading>
                        Recognition...
                    </Button>
                ) : (
                    <Button block icon={<Icon icon={Mic}/>} onClick={start} type={'primary'}>
                        Recognition
                    </Button>
                )}
                <Input.TextArea placeholder={'Recognition result...'} value={text}/>
                {url && <audio controls src={url}/>}
            </Flexbox>
        </StoryBook>
    );
}
;