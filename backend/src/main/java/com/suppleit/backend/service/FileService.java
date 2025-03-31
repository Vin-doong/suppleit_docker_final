package com.suppleit.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileService {

    @Value("${app.upload.image-dir}")
    private String imageUploadDir;

    @Value("${app.upload.attachment-dir}")
    private String attachmentUploadDir;

    // 애플리케이션 시작 시 업로드 디렉토리 생성
    @PostConstruct
    public void init() {
        try {
            Path imagePath = Paths.get(imageUploadDir);
            Path attachmentPath = Paths.get(attachmentUploadDir);
            
            System.out.println("이미지 업로드 경로: " + imagePath.toAbsolutePath());
            System.out.println("첨부파일 업로드 경로: " + attachmentPath.toAbsolutePath());
            
            Files.createDirectories(imagePath);
            Files.createDirectories(attachmentPath);
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉토리를 생성할 수 없습니다: " + e.getMessage(), e);
        }
    }

    // 이미지 저장
    public String saveImage(MultipartFile file) throws IOException {
        // 이미지 파일 검증
        if (!isImageFile(file)) {
            throw new IllegalArgumentException("유효한 이미지 파일만 업로드 가능합니다.");
        }
        return saveFile(file, imageUploadDir, "img");
    }

    // 첨부파일 저장
    public String saveAttachment(MultipartFile file) throws IOException {
        return saveFile(file, attachmentUploadDir, "file");
    }

    // 파일 저장 공통 로직
    private String saveFile(MultipartFile file, String baseDir, String prefix) throws IOException {
        // 날짜 기반 디렉토리 생성
        LocalDate now = LocalDate.now();
        String datePath = now.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path uploadPath = Paths.get(baseDir + datePath);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 고유한 파일명 생성
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String uniqueFileName = prefix + "_" + UUID.randomUUID().toString() + fileExtension;
        
        // 파일 저장
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath);
        
        // 상대 경로 반환 (DB 저장용)
        return datePath + "/" + uniqueFileName;
    }
    
    // 이미지 파일 검증
    private boolean isImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && contentType.startsWith("image/");
    }
    
    // 이미지 전체 경로 가져오기
    public Path getImagePath(String relativePath) {
        return Paths.get(imageUploadDir + relativePath);
    }
    
    // 첨부파일 전체 경로 가져오기
    public Path getAttachmentPath(String relativePath) {
        return Paths.get(attachmentUploadDir + relativePath);
    }
    
    // 이미지 삭제
    public void deleteImage(String relativePath) throws IOException {
        if (relativePath != null && !relativePath.isEmpty()) {
            Path filePath = Paths.get(imageUploadDir + relativePath);
            Files.deleteIfExists(filePath);
        }
    }
    
    // 첨부파일 삭제
    public void deleteAttachment(String relativePath) throws IOException {
        if (relativePath != null && !relativePath.isEmpty()) {
            Path filePath = Paths.get(attachmentUploadDir + relativePath);
            Files.deleteIfExists(filePath);
        }
    }
    
    // 파일 확장자 확인
    public boolean isImageByExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return false;
        }
        String lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg") || 
               lowerFileName.endsWith(".png") || lowerFileName.endsWith(".gif") || 
               lowerFileName.endsWith(".bmp") || lowerFileName.endsWith(".svg");
    }
}