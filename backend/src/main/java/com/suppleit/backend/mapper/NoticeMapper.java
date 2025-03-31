package com.suppleit.backend.mapper;

import com.suppleit.backend.dto.NoticeDto;
import com.suppleit.backend.model.Notice;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NoticeMapper {
    // 공지사항 전체 조회
    List<NoticeDto> getAllNotices();

    // 특정 공지사항 조회
    NoticeDto getNoticeById(@Param("noticeId") Long noticeId);
    
    // 조회수 증가 메서드 추가
    void incrementViews(@Param("noticeId") Long noticeId);

    // 공지사항 생성 (관리자만 가능)
    void insertNotice(Notice notice);

    // 공지사항 수정 (관리자만 가능)
    void updateNotice(@Param("noticeId") Long noticeId, @Param("notice") Notice notice);

    // 공지사항 삭제 (관리자만 가능)
    void deleteNotice(@Param("noticeId") Long noticeId);
}