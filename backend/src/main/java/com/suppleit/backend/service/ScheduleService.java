package com.suppleit.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.suppleit.backend.dto.ScheduleDto;
import com.suppleit.backend.mapper.ScheduleMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {
    private final ScheduleMapper scheduleMapper;
    
    // 사용자별 모든 스케줄 조회
    public List<ScheduleDto> getSchedulesByMemberId(Long memberId) {
        return scheduleMapper.getSchedulesByMemberId(memberId);
    }
    
    // 특정 스케줄 조회
    public ScheduleDto getScheduleById(Long scheduleId) {
        return scheduleMapper.getScheduleById(scheduleId);
    }
    
    // 시간대별 스케줄 조회
    public List<ScheduleDto> getSchedulesByTime(Long memberId, String intakeTime) {
        return scheduleMapper.getSchedulesByMemberIdAndTime(memberId, intakeTime);
    }
    
    // 스케줄 생성 (유효성 검사 포함)
    @Transactional
    public ScheduleDto createSchedule(ScheduleDto scheduleDto) {
        // 시작일 유효성 검사 (null 체크 추가)
        if (scheduleDto.getIntakeStart() != null) {
            validateStartDate(scheduleDto.getIntakeStart());
        } else {
            // 시작일이 없으면 현재 날짜로 설정
            scheduleDto.setIntakeStart(LocalDate.now());
        }
        
        // 복용 종료일 계산
        calculateIntakeEndDate(scheduleDto);
        
        scheduleMapper.insertSchedule(scheduleDto);
        log.info("일정 생성 완료: {}", scheduleDto.getScheduleId());
        
        return scheduleDto;
    }
    
    // 스케줄 수정
    @Transactional
    public ScheduleDto updateSchedule(ScheduleDto scheduleDto) {
        // 시작일 유효성 검사 (null 체크 추가)
        if (scheduleDto.getIntakeStart() != null) {
            // 시작일이 현재보다 과거인 경우 유효성 검사 스킵 (기존 일정 수정 시)
            if (scheduleDto.getIntakeStart().isAfter(LocalDate.now())) {
                validateStartDate(scheduleDto.getIntakeStart());
            }
        } else {
            // 시작일이 없으면 현재 날짜로 설정
            scheduleDto.setIntakeStart(LocalDate.now());
        }
        
        // 복용 종료일 계산
        calculateIntakeEndDate(scheduleDto);
        
        scheduleMapper.updateSchedule(scheduleDto);
        log.info("일정 수정 완료: {}", scheduleDto.getScheduleId());
        
        return scheduleMapper.getScheduleById(scheduleDto.getScheduleId());
    }
    
    // 스케줄 삭제
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        scheduleMapper.deleteSchedule(scheduleId);
        log.info("일정 삭제 완료: {}", scheduleId);
    }
    
    // 시작일 유효성 검사 - 현재 날짜보다 이전인지 체크
    private void validateStartDate(LocalDate startDate) {
        if (startDate.isBefore(LocalDate.now())) {
            log.warn("시작일이 현재 날짜보다 이전입니다: {}", startDate);
            // 경고만 남기고 오류는 발생시키지 않음 (과거 일정도 등록 가능하도록)
        }
    }
    
    // 복용 종료일 계산
    private void calculateIntakeEndDate(ScheduleDto scheduleDto) {
        if (scheduleDto.getIntakeEnd() == null && scheduleDto.getIntakeDistance() != null) {
            // 시작일 + 복용기간 - 1 = 종료일 (시작일 포함)
            LocalDate endDate = scheduleDto.getIntakeStart().plusDays(scheduleDto.getIntakeDistance() - 1);
            scheduleDto.setIntakeEnd(endDate);
            log.debug("종료일 계산됨: {} -> {}", scheduleDto.getIntakeStart(), endDate);
        }
    }
}