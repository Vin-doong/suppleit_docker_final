package com.suppleit.backend.service;

import com.suppleit.backend.dto.NoticeDto;
import com.suppleit.backend.mapper.NoticeMapper;
import com.suppleit.backend.mapper.MemberMapper;
import com.suppleit.backend.model.Notice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeService {

    @Value("${notice.content.max-length:16000}")
    private int maxContentLength; // 기본값 16000자

    private final NoticeMapper noticeMapper;
    private final MemberMapper memberMapper;
    private final FileService fileService;

    // 모든 공지사항 조회
    public List<NoticeDto> getAllNotices() {
        return noticeMapper.getAllNotices();
    }

    // 특정 공지사항 조회 (조회수 증가 포함)
    @Transactional
    public NoticeDto getNoticeById(Long noticeId) {
        try {
            // 조회수 증가 먼저 실행 (에러가 발생해도 계속 진행)
            try {
                noticeMapper.incrementViews(noticeId);
                log.info("조회수 증가 완료 - 공지사항 ID: {}", noticeId);
            } catch (Exception e) {
                log.error("조회수 증가 중 오류: {}", e.getMessage());
                // 조회수 증가 실패해도 공지사항 조회는 계속 진행
            }
            
            // 공지사항 조회
            return noticeMapper.getNoticeById(noticeId);
        } catch (Exception e) {
            log.error("공지사항 조회 중 오류: {}", e.getMessage());
            throw e;
        }
    }

    // 본문 내 Base64 이미지 처리 메서드
    private String processBase64Images(String content, List<MultipartFile> contentImages) throws IOException {
        if (content == null || contentImages == null || contentImages.isEmpty()) {
            return content;
        }
        
        // 각 이미지마다 처리
        for (int i = 0; i < contentImages.size(); i++) {
            MultipartFile image = contentImages.get(i);
            String imagePath = fileService.saveImage(image);
            
            // {{IMAGE_PLACEHOLDER_x}}를 실제 이미지 URL로 교체
            String placeholder = "{{IMAGE_PLACEHOLDER_" + i + "}}";
            String imageUrl = "http://localhost:8000/api/notice/image/" + imagePath;
            content = content.replace(placeholder, imageUrl);
            
            log.info("본문 내 이미지 저장 완료: {}, URL: {}", imagePath, imageUrl);
        }
        
        return content;
    }

    // 공지사항 생성 (여러 파일 처리)
    @Transactional
    public void createNotice(NoticeDto noticeDto, MultipartFile image, MultipartFile attachment, 
                          List<MultipartFile> contentImages) throws IOException {
        log.info("공지사항 생성 시작 - 이미지: {}, 첨부파일: {}, 본문 이미지: {}개", 
            image != null ? image.getOriginalFilename() : "없음", 
            attachment != null ? attachment.getOriginalFilename() : "없음",
            contentImages != null ? contentImages.size() : 0);
            
        // 컨텐츠 길이 제한
        limitContentLength(noticeDto);
        
        // 본문 내 Base64 이미지 처리
        if (contentImages != null && !contentImages.isEmpty()) {
            String processedContent = processBase64Images(noticeDto.getContent(), contentImages);
            noticeDto.setContent(processedContent);
        }

        // 이미지와 첨부파일 모두 처리
        processImageAndAttachment(noticeDto, image, attachment);
        
        Notice notice = noticeDto.toEntity();
        noticeMapper.insertNotice(notice);
        
        // noticeId를 DTO에 설정 (반환값이 필요한 경우)
        noticeDto.setNoticeId(notice.getNoticeId());
        log.info("공지사항 생성 완료, ID: {}", notice.getNoticeId());
    }

    // 공지사항 수정 (여러 파일 처리 및 기존 파일 관리)
    @Transactional
    public void updateNotice(Long noticeId, NoticeDto noticeDto, MultipartFile image, MultipartFile attachment,
                          List<MultipartFile> contentImages) throws IOException {
        log.info("공지사항 수정 시작 - ID: {}, 이미지: {}, 첨부파일: {}, 본문 이미지: {}개", 
            noticeId,
            image != null ? image.getOriginalFilename() : "없음", 
            attachment != null ? attachment.getOriginalFilename() : "없음",
            contentImages != null ? contentImages.size() : 0);
            
        // 기존 공지사항 조회
        NoticeDto existingNotice = noticeMapper.getNoticeById(noticeId);
        
        if (existingNotice == null) {
            throw new IllegalArgumentException("해당 공지사항을 찾을 수 없습니다: " + noticeId);
        }

        // 컨텐츠 길이 제한
        limitContentLength(noticeDto);
        
        // 본문 내 Base64 이미지 처리
        if (contentImages != null && !contentImages.isEmpty()) {
            String processedContent = processBase64Images(noticeDto.getContent(), contentImages);
            noticeDto.setContent(processedContent);
        }
        
        // 이미지와 첨부파일 처리
        handleImageUpdate(noticeDto, existingNotice, image);
        handleAttachmentUpdate(noticeDto, existingNotice, attachment);
        
        // 수정자 정보 설정
        noticeDto.setLastModifiedBy(noticeDto.getMemberId());
        
        Notice notice = noticeDto.toEntity();
        noticeMapper.updateNotice(noticeId, notice);
        log.info("공지사항 수정 완료, ID: {}", noticeId);
    }

    // 컨텐츠 길이 제한 메서드
    private void limitContentLength(NoticeDto noticeDto) {
        if (noticeDto.getContent() != null && noticeDto.getContent().length() > maxContentLength) {
            log.warn("컨텐츠 길이 초과 ({}자), {}자로 제한합니다.", noticeDto.getContent().length(), maxContentLength);
            noticeDto.setContent(noticeDto.getContent().substring(0, maxContentLength));
        }
    }

    // 이미지와 첨부파일 모두 처리하는 메서드
    private void processImageAndAttachment(NoticeDto noticeDto, MultipartFile image, MultipartFile attachment) throws IOException {
        // 이미지 처리
        if (image != null && !image.isEmpty()) {
            String imagePath = fileService.saveImage(image);
            noticeDto.setImagePath(imagePath);
            log.info("이미지 저장 완료: {}", imagePath);
        }
        
        // 첨부파일 처리
        if (attachment != null && !attachment.isEmpty()) {
            String attachmentPath = fileService.saveAttachment(attachment);
            noticeDto.setAttachmentPath(attachmentPath);
            noticeDto.setAttachmentName(attachment.getOriginalFilename());
            log.info("첨부파일 저장 완료: {}, 파일명: {}", attachmentPath, attachment.getOriginalFilename());
        }
    }

    // 이미지 업데이트 로직 분리
    private void handleImageUpdate(NoticeDto noticeDto, NoticeDto existingNotice, MultipartFile image) throws IOException {
        // 새 이미지가 업로드된 경우
        if (image != null && !image.isEmpty()) {
            // 기존 이미지 삭제
            if (existingNotice.getImagePath() != null) {
                fileService.deleteImage(existingNotice.getImagePath());
                log.info("기존 이미지 삭제: {}", existingNotice.getImagePath());
            }
            // 새 이미지 저장
            String imagePath = fileService.saveImage(image);
            noticeDto.setImagePath(imagePath);
            log.info("새 이미지 저장: {}", imagePath);
        } 
        // 이미지 제거 요청이 있는 경우
        else if (noticeDto.isRemoveImage() && existingNotice.getImagePath() != null) {
            fileService.deleteImage(existingNotice.getImagePath());
            noticeDto.setImagePath(null);
            log.info("이미지 삭제 완료");
        } 
        // 변경 없음
        else {
            noticeDto.setImagePath(existingNotice.getImagePath());
        }
    }

    // 첨부파일 업데이트 로직 분리
    private void handleAttachmentUpdate(NoticeDto noticeDto, NoticeDto existingNotice, MultipartFile attachment) throws IOException {
        // 새 첨부파일이 업로드된 경우
        if (attachment != null && !attachment.isEmpty()) {
            // 기존 첨부파일 삭제
            if (existingNotice.getAttachmentPath() != null) {
                fileService.deleteAttachment(existingNotice.getAttachmentPath());
                log.info("기존 첨부파일 삭제: {}", existingNotice.getAttachmentPath());
            }
            // 새 첨부파일 저장
            String attachmentPath = fileService.saveAttachment(attachment);
            noticeDto.setAttachmentPath(attachmentPath);
            noticeDto.setAttachmentName(attachment.getOriginalFilename());
            log.info("새 첨부파일 저장: {}, 파일명: {}", attachmentPath, attachment.getOriginalFilename());
        } 
        // 첨부파일 제거 요청이 있는 경우
        else if (noticeDto.isRemoveAttachment() && existingNotice.getAttachmentPath() != null) {
            fileService.deleteAttachment(existingNotice.getAttachmentPath());
            noticeDto.setAttachmentPath(null);
            noticeDto.setAttachmentName(null);
            log.info("첨부파일 삭제 완료");
        } 
        // 변경 없음
        else {
            noticeDto.setAttachmentPath(existingNotice.getAttachmentPath());
            noticeDto.setAttachmentName(existingNotice.getAttachmentName());
        }
    }

    // 공지사항 삭제 (관련 파일 모두 삭제)
    @Transactional
    public void deleteNotice(Long noticeId) throws IOException {
        log.info("공지사항 삭제 시작 - ID: {}", noticeId);
        
        // 이미지 및 첨부파일 삭제를 위해 공지사항 조회
        NoticeDto notice = noticeMapper.getNoticeById(noticeId);
        
        if (notice != null) {
            // 이미지 삭제
            if (notice.getImagePath() != null) {
                fileService.deleteImage(notice.getImagePath());
                log.info("이미지 삭제 완료: {}", notice.getImagePath());
            }
            
            // 첨부파일 삭제
            if (notice.getAttachmentPath() != null) {
                fileService.deleteAttachment(notice.getAttachmentPath());
                log.info("첨부파일 삭제 완료: {}", notice.getAttachmentPath());
            }
        }
        
        noticeMapper.deleteNotice(noticeId);
        log.info("공지사항 삭제 완료, ID: {}", noticeId);
    }

    // 이메일을 통해 member_id 가져오기
    public Long getMemberIdByEmail(String email) {
        return memberMapper.getMemberByEmail(email).getMemberId();
    }
}