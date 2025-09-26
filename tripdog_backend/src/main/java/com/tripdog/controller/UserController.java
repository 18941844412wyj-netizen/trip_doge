package com.tripdog.controller;

import com.tripdog.common.Constants;
import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.model.dto.EmailCodeDTO;
import com.tripdog.model.dto.UserLoginDTO;
import com.tripdog.model.dto.UserRegisterDTO;
import com.tripdog.model.vo.EmailCodeVO;
import com.tripdog.model.vo.UserInfoVO;
import com.tripdog.service.EmailService;
import com.tripdog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EmailService emailService;

    private static final String USER_SESSION_KEY = "loginUser";


    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result<UserInfoVO> register(@RequestBody @Validated UserRegisterDTO registerDTO) {
        try {
            UserInfoVO userInfoVO = userService.register(registerDTO);
            return Result.success(userInfoVO);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<UserInfoVO> login(@RequestBody @Validated UserLoginDTO loginDTO, HttpServletRequest request) {
        try {
            UserInfoVO userInfoVO = userService.login(loginDTO);

            // 将用户信息保存到session中
            HttpSession session = request.getSession();
            session.setAttribute(USER_SESSION_KEY, userInfoVO);

            return Result.success(userInfoVO);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 发送邮箱验证码
     */
    @PostMapping("/sendEmail")
    public Result<EmailCodeVO> sendEmailCode(@RequestBody @Validated EmailCodeDTO emailCodeDTO) {
        try {
            // 生成并发送验证码
            String code = emailService.generateAndSendCode(emailCodeDTO.getEmail());
            if (code == null) {
                return Result.error(ErrorCode.EMAIL_CODE_SEND_FAILED);
            }

            EmailCodeVO emailCodeVO = new EmailCodeVO(code);
            return Result.success(emailCodeVO);
        } catch (Exception e) {
            return Result.error(ErrorCode.EMAIL_CODE_SEND_FAILED);
        }
    }

    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return Result.success("退出登录成功");
    }

    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/info")
    public Result<UserInfoVO> getCurrentUser(HttpServletRequest request) {
        UserInfoVO loginUser = (UserInfoVO) request.getAttribute(Constants.USER_SESSION_KEY);
        return Result.success(loginUser);
    }

}
