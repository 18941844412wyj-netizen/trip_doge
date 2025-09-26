package com.tripdog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * CORS跨域配置类
 * 为了更好地控制跨域请求，单独提取CORS配置
 *
 * @author tripdog
 * @date 2025/09/26
 */
@Configuration
public class CorsConfig {

    /**
     * 配置CORS
     *
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 允许的源域名（生产环境应该指定具体域名）
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));

        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"
        ));

        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList(
                "Origin", "Content-Type", "Accept", "Authorization",
                "Access-Control-Allow-Origin", "Access-Control-Allow-Headers",
                "Access-Control-Allow-Methods", "X-Requested-With", "Cache-Control"
        ));

        // 允许暴露的响应头
        configuration.setExposedHeaders(Arrays.asList(
                "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials",
                "Content-Disposition"
        ));

        // 允许携带凭证（cookies, session等）
        configuration.setAllowCredentials(true);

        // 预检请求的有效期，单位秒
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
