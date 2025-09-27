package com.tripdog.controller;

import java.io.File;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.common.utils.FileUploadUtils;
import com.tripdog.common.utils.ThreadLocalUtils;
import com.tripdog.config.MinioConfig;
import com.tripdog.model.dto.FileUploadDTO;
import com.tripdog.model.dto.UploadDTO;
import com.tripdog.model.vo.UserInfoVO;
import com.tripdog.service.impl.UserSessionService;
import com.tripdog.utils.TokenUtils;
import io.minio.MinioClient;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import static com.tripdog.common.Constants.ROLE_ID;
import static com.tripdog.common.Constants.USER_ID;
import static dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument;

/**
 * @author: iohw
 * @date: 2025/9/26 15:14
 * @description:
 */
@RestController
@RequestMapping("/doc")
@RequiredArgsConstructor
@Tag(name = "文档管理", description = "文档上传、解析和向量化相关接口")
public class DocController {
    final EmbeddingStoreIngestor ingestor;
    final MinioClient minioClient;
    final MinioConfig minioConfig;
    final UserSessionService userSessionService;

    @PostMapping("/parse")
    @Operation(summary = "文档上传并解析",
              description = "上传文件到MinIO存储，然后解析文档内容并创建向量嵌入用于AI检索")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "文档上传并解析成功"),
        @ApiResponse(responseCode = "10001", description = "参数错误"),
        @ApiResponse(responseCode = "10105", description = "用户未登录"),
        @ApiResponse(responseCode = "10000", description = "系统异常")
    })
    public Result<String> upload(UploadDTO uploadDTO, HttpServletRequest request) {
        // 从请求中提取token并获取用户信息
        String token = TokenUtils.extractToken(request);
        if (token == null) {
            return Result.error(ErrorCode.USER_NOT_LOGIN);
        }
        
        UserInfoVO userInfoVO = userSessionService.getSession(token);
        if(userInfoVO == null) {
            return Result.error(ErrorCode.USER_NOT_LOGIN);
        }
        ThreadLocalUtils.set(ROLE_ID, uploadDTO.getRoleId());
        ThreadLocalUtils.set(USER_ID, userInfoVO.getId());

        MultipartFile file = uploadDTO.getFile();

        // 上传文件到MinIO
        FileUploadDTO fileUploadDTO = FileUploadUtils.upload2Minio(
            file,
            userInfoVO.getId(),
            minioClient,
            minioConfig.getBucketName(),
            "/doc"
        );

        // 先上传到本地临时目录用于解析
        FileUploadDTO localFileDTO = FileUploadUtils.upload2Local(file, "/tmp");
        File localFile = new File(localFileDTO.getFilePath());

        try {
            // 解析文档并创建向量嵌入
            DocumentParser parser = new ApacheTikaDocumentParser();
            Document doc = loadDocument(localFile.getAbsolutePath(), parser);
            ingestor.ingest(doc);

            return Result.success("文档上传并解析成功，文件路径: " + fileUploadDTO.getFilePath());
        } finally {
            // 清理本地临时文件
            FileUploadUtils.deleteLocalFile(localFile);
        }
    }
}
