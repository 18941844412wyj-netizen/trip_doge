package com.tripdog.config;

import com.tripdog.interceptor.LoginInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final LoginInterceptor loginInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**")  // 拦截所有/api/**的请求
                .excludePathPatterns(
                        "/api/user/register",      // 注册
                        "/api/user/login",         // 登录
                        "/api/user/sendEmail",     // 发送验证码
                        "/api/roles/list"          // 角色列表（可能需要在未登录时访问）
                );
    }

}
