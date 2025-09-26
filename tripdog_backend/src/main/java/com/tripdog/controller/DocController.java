package com.tripdog.controller;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tripdog.common.Result;
import com.tripdog.common.utils.FileUploadUtils;
import com.tripdog.common.utils.ThreadLocalUtils;
import com.tripdog.config.MinioConfig;
import com.tripdog.model.dto.FileUploadDTO;
import com.tripdog.model.dto.UploadDTO;
import com.tripdog.model.vo.UserInfoVO;
import io.minio.MinioClient;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import static com.tripdog.common.Constants.ROLE_ID;
import static com.tripdog.common.Constants.USER_ID;
import static com.tripdog.common.Constants.USER_SESSION_KEY;
import static dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument;

/**
 * @author: iohw
 * @date: 2025/9/26 15:14
 * @description:
 */
@RestController
@RequestMapping("/doc")
@RequiredArgsConstructor
public class DocController {
    final EmbeddingStoreIngestor ingestor;
    final MinioClient minioClient;
    final MinioConfig minioConfig;

    @PostMapping("/parse")
    public Result<String> upload(UploadDTO uploadDTO, HttpSession session) {
        UserInfoVO userInfoVO = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
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
