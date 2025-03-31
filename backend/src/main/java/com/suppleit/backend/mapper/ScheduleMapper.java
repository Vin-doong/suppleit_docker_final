package com.suppleit.backend.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.suppleit.backend.dto.ScheduleDto;

@Mapper
public interface ScheduleMapper {
    // 일정 추가
    void insertSchedule(ScheduleDto scheduleDto);
    
    // 특정 일정 조회
    ScheduleDto getScheduleById(@Param("scheduleId") Long scheduleId);
    
    // 회원별 일정 조회
    List<ScheduleDto> getSchedulesByMemberId(@Param("memberId") Long memberId);
    
    // 회원별, 시간대별 일정 조회
    List<ScheduleDto> getSchedulesByMemberIdAndTime(
        @Param("memberId") Long memberId, 
        @Param("intakeTime") String intakeTime
    );
    
    // 일정 수정
    void updateSchedule(ScheduleDto scheduleDto);
    
    // 일정 삭제
    void deleteSchedule(@Param("scheduleId") Long scheduleId);
}