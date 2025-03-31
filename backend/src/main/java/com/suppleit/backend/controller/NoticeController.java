package com.suppleit.backend.controller;

import com.suppleit.backend.dto.NoticeDto;
import com.suppleit.backend.service.FileService;
import com.suppleit.backend.service.NoticeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
@Slf4j
public class NoticeController extends JwtSupportController {

    private final NoticeService noticeService;
    private final FileService fileService;

    // 공지사항 전체 조회
    @GetMapping
    public ResponseEntity<List<NoticeDto>> getAllNotices() {
        log.info("공지사항 전체 조회 요청");
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    // 특정 공지사항 조회
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeDto> getNotice(@PathVariable("noticeId") Long noticeId) {
        log.info("공지사항 상세 조회 요청: {}", noticeId);
        return ResponseEntity.ok(noticeService.getNoticeById(noticeId));
    }

    // 공지사항 이미지 조회
    @GetMapping("/image/{year}/{month}/{day}/{fileName:.+}")
    public ResponseEntity<Resource> getImage(
            @PathVariable("year") String year,
            @PathVariable("month") String month,
            @PathVariable("day") String day,
            @PathVariable("fileName") String fileName) {
        try {
            log.info("이미지 조회 요청: {}/{}/{}/{}", year, month, day, fileName);
            String imagePath = year + "/" + month + "/" + day + "/" + fileName;
            Path path = fileService.getImagePath(imagePath);
            Resource resource = new UrlResource(path.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                MediaType mediaType = determineMediaType(fileName);
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .body(resource);
            } else {
                log.warn("이미지 파일이 존재하지 않음: {}", imagePath);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("이미지 조회 오류: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // 이미지 직접 다운로드
    @GetMapping("/image/download/{year}/{month}/{day}/{fileName:.+}")
    public ResponseEntity<Resource> downloadImage(
            @PathVariable("year") String year,
            @PathVariable("month") String month,
            @PathVariable("day") String day,
            @PathVariable("fileName") String fileName) {
        try {
            log.info("이미지 다운로드 요청: {}/{}/{}/{}", year, month, day, fileName);
            String imagePath = year + "/" + month + "/" + day + "/" + fileName;
            Path path = fileService.getImagePath(imagePath);
            Resource resource = new UrlResource(path.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString())
                        .replaceAll("\\+", "%20");
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                        .header(HttpHeaders.CONTENT_TYPE, determineMediaType(fileName).toString())
                        .body(resource);
            } else {
                log.warn("이미지 파일이 존재하지 않음: {}", imagePath);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("이미지 다운로드 오류: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // 첨부파일 다운로드
    @GetMapping("/attachment/{noticeId}/{fileName:.+}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable("noticeId") Long noticeId, 
            @PathVariable("fileName") String fileName) {
        try {
            log.info("첨부파일 다운로드 요청: {}/{}", noticeId, fileName);
            NoticeDto notice = noticeService.getNoticeById(noticeId);
            
            if (notice == null || notice.getAttachmentPath() == null) {
                log.warn("첨부파일이 없는 공지사항: {}", noticeId);
                return ResponseEntity.notFound().build();
            }
            
            Path path = fileService.getAttachmentPath(notice.getAttachmentPath());
            Resource resource = new UrlResource(path.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString())
                        .replaceAll("\\+", "%20");
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .body(resource);
            } else {
                log.warn("첨부파일이 존재하지 않음: {}", notice.getAttachmentPath());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("첨부파일 다운로드 오류: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // 공지사항 등록
    @PostMapping
    public ResponseEntity<?> createNotice(
            @RequestPart("notice") NoticeDto notice, 
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @RequestPart(value = "contentImages", required = false) List<MultipartFile> contentImages,
            HttpServletRequest request) {
        try {
            log.info("공지사항 등록 요청: {}, 본문 이미지: {}개", 
                notice.getTitle(), 
                contentImages != null ? contentImages.size() : 0);
            
            if (notice.getContent() != null && notice.getContent().length() > 16000) {
                log.warn("컨텐츠 길이 초과 ({}자), 16000자로 제한합니다.", notice.getContent().length());
                notice.setContent(notice.getContent().substring(0, 16000));
            }
            
            String email = extractEmailFromToken(request);
            Long memberId = noticeService.getMemberIdByEmail(email);
            notice.setMemberId(memberId);
            noticeService.createNotice(notice, image, attachment, contentImages);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공지사항이 등록되었습니다.",
                "noticeId", notice.getNoticeId()
            ));
        } catch (Exception e) {
            log.error("공지사항 등록 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 공지사항 수정
    @PutMapping("/{noticeId}")
    public ResponseEntity<?> updateNotice(
            @PathVariable("noticeId") Long noticeId, 
            @RequestPart("notice") NoticeDto notice,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @RequestPart(value = "contentImages", required = false) List<MultipartFile> contentImages,
            HttpServletRequest request) {
        try {
            log.info("공지사항 수정 요청: {}, 본문 이미지: {}개", 
                noticeId, 
                contentImages != null ? contentImages.size() : 0);
            
            if (notice.getContent() != null && notice.getContent().length() > 16000) {
                log.warn("컨텐츠 길이 초과 ({}자), 16000자로 제한합니다.", notice.getContent().length());
                notice.setContent(notice.getContent().substring(0, 16000));
            }
            
            String email = extractEmailFromToken(request);
            Long memberId = noticeService.getMemberIdByEmail(email);
            notice.setMemberId(memberId);
            notice.setLastModifiedBy(memberId);
            
            noticeService.updateNotice(noticeId, notice, image, attachment, contentImages);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공지사항이 수정되었습니다."
            ));
        } catch (Exception e) {
            log.error("공지사항 수정 오류: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // 공지사항 삭제
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<?> deleteNotice(@PathVariable("noticeId") Long noticeId) {
        try {
            log.info("공지사항 삭제 요청: {}", noticeId);
            noticeService.deleteNotice(noticeId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공지사항이 삭제되었습니다."
            ));
        } catch (Exception e) {
            log.error("공지사항 삭제 오류: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // 파일 확장자에 따른 미디어 타입 추정 메서드
    private MediaType determineMediaType(String fileName) {
        if (fileName == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        
        String lowerCaseFileName = fileName.toLowerCase();
        
        if (lowerCaseFileName.endsWith(".jpg") || lowerCaseFileName.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (lowerCaseFileName.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (lowerCaseFileName.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        } else if (lowerCaseFileName.endsWith(".svg")) {
            return MediaType.valueOf("image/svg+xml");
        } else if (lowerCaseFileName.endsWith(".bmp")) {
            return MediaType.valueOf("image/bmp");
        } else if (lowerCaseFileName.endsWith(".webp")) {
            return MediaType.valueOf("image/webp");
        } else {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}