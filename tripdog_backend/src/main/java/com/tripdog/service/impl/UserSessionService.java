package com.tripdog.service.impl;

import com.tripdog.common.RedisService;
import com.tripdog.model.vo.UserInfoVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 用户Session管理服务
 * 基于Redis实现用户登录状态管理，替代HttpSession
 *
 * @author tripdog
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionService {

    private final RedisService redisService;

    /**
     * Session超时时间（30分钟）
     */
    private static final long SESSION_TIMEOUT = 30;
    private static final String SESSION_KEY_PREFIX = "user:session:";
    private static final String USER_TOKEN_PREFIX = "user:token:";

    /**
     * 创建用户Session
     *
     * @param userInfo 用户信息
     * @return 生成的token
     */
    public String createSession(UserInfoVO userInfo) {
        // 生成唯一的token
        String token = generateToken();

        // 构建Redis key
        String sessionKey = SESSION_KEY_PREFIX + token;
        String userTokenKey = USER_TOKEN_PREFIX + userInfo.getId();

        try {
            // 如果用户已经有token，先删除旧的session
            String existingToken = redisService.getString(userTokenKey);
            if (existingToken != null) {
                redisService.delete(SESSION_KEY_PREFIX + existingToken);
                log.info("删除用户 {} 的旧session: {}", userInfo.getId(), existingToken);
            }

            // 保存用户信息到Redis，设置过期时间
            redisService.setObject(sessionKey, userInfo, SESSION_TIMEOUT, TimeUnit.MINUTES);

            // 保存用户ID到token的映射，便于管理
            redisService.setString(userTokenKey, token, SESSION_TIMEOUT, TimeUnit.MINUTES);

            log.info("为用户 {} 创建session成功，token: {}", userInfo.getId(), token);
            return token;

        } catch (Exception e) {
            log.error("创建用户session失败，用户ID: {}", userInfo.getId(), e);
            throw new RuntimeException("创建用户session失败", e);
        }
    }

    /**
     * 获取用户Session信息
     *
     * @param token 用户token
     * @return 用户信息，如果session不存在或已过期返回null
     */
    public UserInfoVO getSession(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        String sessionKey = SESSION_KEY_PREFIX + token;

        try {
            UserInfoVO userInfo = redisService.getObject(sessionKey, UserInfoVO.class);
            if (userInfo != null) {
                // Session续期
                renewSession(token);
                log.debug("获取用户session成功，用户ID: {}", userInfo.getId());
            }
            return userInfo;

        } catch (Exception e) {
            log.error("获取用户session失败，token: {}", token, e);
            return null;
        }
    }

    /**
     * 续期Session
     *
     * @param token 用户token
     */
    public void renewSession(String token) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        String sessionKey = SESSION_KEY_PREFIX + token;

        try {
            // 检查session是否存在
            if (redisService.hasKey(sessionKey)) {
                // 获取用户信息
                UserInfoVO userInfo = redisService.getObject(sessionKey, UserInfoVO.class);
                if (userInfo != null) {
                    // 重新设置过期时间
                    redisService.expire(sessionKey, SESSION_TIMEOUT, TimeUnit.MINUTES);

                    // 同时续期用户token映射
                    String userTokenKey = USER_TOKEN_PREFIX + userInfo.getId();
                    redisService.expire(userTokenKey, SESSION_TIMEOUT, TimeUnit.MINUTES);

                    log.debug("用户session续期成功，用户ID: {}", userInfo.getId());
                }
            }
        } catch (Exception e) {
            log.error("续期用户session失败，token: {}", token, e);
        }
    }

    /**
     * 删除用户Session（登出）
     *
     * @param token 用户token
     */
    public void removeSession(String token) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        String sessionKey = SESSION_KEY_PREFIX + token;

        try {
            // 先获取用户信息
            UserInfoVO userInfo = redisService.getObject(sessionKey, UserInfoVO.class);

            // 删除session
            redisService.delete(sessionKey);

            // 删除用户token映射
            if (userInfo != null) {
                String userTokenKey = USER_TOKEN_PREFIX + userInfo.getId();
                redisService.delete(userTokenKey);
                log.info("删除用户session成功，用户ID: {}", userInfo.getId());
            }

        } catch (Exception e) {
            log.error("删除用户session失败，token: {}", token, e);
        }
    }

    /**
     * 删除用户的所有Session
     *
     * @param userId 用户ID
     */
    public void removeUserSessions(Long userId) {
        if (userId == null) {
            return;
        }

        String userTokenKey = USER_TOKEN_PREFIX + userId;

        try {
            // 获取用户当前的token
            String token = redisService.getString(userTokenKey);
            if (token != null) {
                String sessionKey = SESSION_KEY_PREFIX + token;
                redisService.delete(sessionKey);
            }

            // 删除用户token映射
            redisService.delete(userTokenKey);

            log.info("删除用户所有session成功，用户ID: {}", userId);

        } catch (Exception e) {
            log.error("删除用户所有session失败，用户ID: {}", userId, e);
        }
    }

    /**
     * 检查Session是否存在且有效
     *
     * @param token 用户token
     * @return 是否有效
     */
    public boolean isSessionValid(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String sessionKey = SESSION_KEY_PREFIX + token;
        return redisService.hasKey(sessionKey);
    }

    /**
     * 获取Session剩余时间（秒）
     *
     * @param token 用户token
     * @return 剩余时间，-1表示session不存在
     */
    public long getSessionRemainingTime(String token) {
        if (token == null || token.trim().isEmpty()) {
            return -1;
        }

        String sessionKey = SESSION_KEY_PREFIX + token;
        return redisService.getExpire(sessionKey, TimeUnit.SECONDS);
    }

    /**
     * 生成唯一token
     */
    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
    }
}
