package com.tripdog.config;

import com.tripdog.interceptor.LoginInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
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

    /**
     * 跨域配置
     * 注意: 由于使用了专门的 CorsConfig，这里的配置可能会被覆盖
     * 建议主要使用 CorsConfig 进行 CORS 配置
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 允许所有路径
                .allowedOrigins(
                        "http://localhost:3000",    // React 默认端口
                        "http://localhost:8080",    // Vue 默认端口
                        "http://localhost:5173",    // Vite 默认端口
                        "http://localhost:4200",    // Angular 默认端口
                        "http://127.0.0.1:3000",
                        "http://127.0.0.1:8080",
                        "http://127.0.0.1:5173",
                        "http://127.0.0.1:4200",
                        "https://trip-doge-frontend.zeabur.app"  // 生产环境
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 允许的HTTP方法
                .allowedHeaders("*") // 允许所有请求头
                .allowCredentials(true) // 允许携带凭证（如cookies、session等）
                .maxAge(3600); // 预检请求的缓存时间（秒）
    }

}
