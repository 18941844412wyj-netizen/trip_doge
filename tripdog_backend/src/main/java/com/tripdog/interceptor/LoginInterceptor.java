package com.tripdog.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.model.vo.UserInfoVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import static com.tripdog.common.Constants.USER_SESSION_KEY;

/**
 * 登录拦截器
 */
@Component
@Slf4j
public class LoginInterceptor implements HandlerInterceptor {
    // 基础过期时间（秒），例如 30 分钟
    private static final int BASE_TIMEOUT = 30 * 60;
    // 触发续期的阈值（秒），例如 10 分钟
    private static final int RENEW_THRESHOLD = 10 * 60;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 获取请求URI和方法
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        log.debug("登录拦截器检查: {} {}", method, requestURI);

        // 对于OPTIONS请求（预检请求），直接放行
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // 检查是否是需要登录的接口
        if (isExcludedPath(requestURI)) {
            return true;
        }

        // 检查用户是否已登录
        HttpSession session = request.getSession(false);
        if (session == null) {
            writeErrorResponse(response, ErrorCode.USER_NOT_LOGIN);
            return false;
        }

        UserInfoVO loginUser = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        if (loginUser == null) {
            writeErrorResponse(response, ErrorCode.USER_NOT_LOGIN);
            return false;
        }

        // Session续期逻辑：如果剩余时间少于10分钟，就续期10分钟
        renewSessionIfNeeded(session);

        // 将用户信息放入请求属性中，便于Controller使用
        request.setAttribute("loginUser", loginUser);
        return true;
    }

    /**
     * 判断是否是不需要登录的路径
     */
    private boolean isExcludedPath(String requestURI) {
        // 不需要登录的路径
        String[] excludePaths = {
            "/api/user/register",
            "/api/user/login",
            "/api/user/sendEmail",
            "/api/roles/list"
        };

        for (String path : excludePaths) {
            if (requestURI.startsWith(path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Session续期逻辑
     * 如果 session 剩余时间小于阈值，则重置为 BASE_TIMEOUT
     */
    private void renewSessionIfNeeded(HttpSession session) {
        try {
            if (session == null) {
                return;
            }

            int maxInactiveInterval = session.getMaxInactiveInterval();
            long lastAccessedTime = session.getLastAccessedTime();
            long currentTime = System.currentTimeMillis();

            // 已经过去的时间（秒）
            long elapsedTime = (currentTime - lastAccessedTime) / 1000;
            // 剩余时间（秒）
            long remainingTime = maxInactiveInterval - elapsedTime;

            if (remainingTime > 0 && remainingTime < RENEW_THRESHOLD) {
                session.setMaxInactiveInterval(BASE_TIMEOUT);
                log.debug("Session续期成功：剩余{}秒，重置为{}秒", remainingTime, BASE_TIMEOUT);
            }
        } catch (Exception e) {
            log.warn("Session续期失败: {}", e.getMessage());
        }
    }

    /**
     * 写入错误响应
     */
    private void writeErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws Exception {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Result<Void> result = Result.error(errorCode);
        String jsonResult = objectMapper.writeValueAsString(result);
        response.getWriter().write(jsonResult);
    }

}
