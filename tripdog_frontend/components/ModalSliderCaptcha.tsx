import React, {useRef} from "react";
import SliderCaptcha from "rc-slider-captcha";
import {Modal} from "antd";
// 引入生成拼图的库
import createPuzzle from "create-puzzle";

export type Result = {
    bgUrl: string;          // 背景图
    puzzleUrl: string;      // 拼图
    x?: number;             // x 轴偏移值。如果使用该值校验，建议前后阈值增减 5 的范围
    y?: number;             // y 轴偏移值，等高拼图时值始终为 0
};

// 定义 VerifyParam 类型，与 rc-slider-captcha 的类型匹配
type VerifyParam = {
    x: number;
    y: number;
    sliderOffsetX: number;
    duration: number;
    trail: [number, number][];
    targetType: string;
    errorCount: number;
};

const ModalSliderCaptcha: React.FC<{
    open: boolean,                                  // 是否打开
    onCancel: () => void,                           // 关闭时调用
    range?: number,                                 // 误差范围
    format?: "dataURL" | "blob",                    // 拼图库format类型，默认dataURL即base64格式
    onVerify?: (data?: Result)
        => Promise<void | boolean>,                 // 是否校验成功。非后端验证模式下，data存在代表成功，data为空代表失败
    request?: () => Promise<{
        bgUrl: string, puzzleUrl: string
    }>,                                             // 请求后端验证码参数
    modalProps?: Record<string, unknown>,           // Modal组件的属性，见：https://ant.design/components/modal-cn#api
    sliderCaptchaProps?: Record<string, unknown>,   // SliderCaptcha的属性，详情见：https://www.npmjs.com/package/rc-slider-captcha
}> = React.memo(({
                     modalProps, sliderCaptchaProps, open, onCancel,
                     format = "dataURL", range = 5, onVerify, request
                 }) => {
    // 图片尺寸
    const bgSize = {
        width: 280,
        height: 173
    }
    // 拼图宽度
    const puzzleWidth = 70

    const offsetXRef = useRef(0)    // x 轴偏移值
    const handleOffsetX = (res?: Result): Result => {
        offsetXRef.current = res?.x ?? 0

        return {
            bgUrl: res?.bgUrl,
            puzzleUrl: res?.puzzleUrl,
        } as Result
    }

    const requestCaptcha = async () => {
        if (request) {
            return request().then(handleOffsetX)
        } else {
            return createPuzzle("/captcha/puzzle.png", {
                format,
                width: puzzleWidth,
                height: puzzleWidth,
                bgWidth: 280,
                bgHeight: 173,
                quality: 1.0,       // 图片质量，默认0.8
            }).then(handleOffsetX)
        }
    }
    const onVerifyCaptcha = async (data: VerifyParam) => {
        if (request) {
            // 后端验证码模式下
            if (onVerify) {
                let isOK = false
                await onVerify(data as unknown as Result).then(res => {
                    if (res) {
                        // 后端校验通过，验证成功
                        isOK = true
                    }
                })
                if (isOK) {
                    return Promise.resolve()
                }
            }
        } else {
            // 非后端验证模式下
            // 注意：在非后端验证模式下，我们无法直接验证 VerifyParam 中的 x 值
            // 这里我们假设验证总是成功，因为 createPuzzle 生成的拼图应该总是能正确完成
            if (onVerify) {
                onVerify()
            }
            return Promise.resolve()
        }
        return Promise.reject()
    }

    return (
        <Modal {...{
            title: "安全验证",
            zIndex: 1024,
            style: {
                maxWidth: "100%",
            },
            styles: {
                content: {
                    padding: 20
                }
            },
            centered: true,
            width: 320,
            footer: false,
            ...modalProps
        }}
               onCancel={onCancel}
               open={open}>
            <SliderCaptcha request={requestCaptcha}
                           onVerify={onVerifyCaptcha}
                           bgSize={bgSize}
                           tipText={{
                               default: "向右拖动完成拼图",
                               loading: "‍努力中...",
                           }}
                           puzzleSize={{
                               width: puzzleWidth,
                           }}
                           style={{
                               "--rcsc-primary": "#6153FC",
                               "--rcsc-primary-light": "#efecfc"
                           } as React.CSSProperties}
                           loadingDelay={300}
                           limitErrorCount={3}
                           {...sliderCaptchaProps}
            />
        </Modal>
    )
});

ModalSliderCaptcha.displayName = "ModalSliderCaptcha";

export default ModalSliderCaptcha;