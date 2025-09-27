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
