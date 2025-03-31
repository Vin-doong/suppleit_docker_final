package com.suppleit.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.suppleit.backend.dto.ApiResponse;
import com.suppleit.backend.dto.ScheduleDto;
import com.suppleit.backend.mapper.MemberMapper;
import com.suppleit.backend.model.Member;
import com.suppleit.backend.service.ScheduleService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@Slf4j
public class ScheduleController extends JwtSupportController {
    private final ScheduleService scheduleService;
    private final MemberMapper memberMapper;

    // 모든 일정 조회
    @GetMapping
    public ResponseEntity<?> getAllSchedules(HttpServletRequest request) {
        try {
            String email = extractEmailFromToken(request);
            Member member = memberMapper.getMemberByEmail(email);
            
            List<ScheduleDto> schedules = scheduleService.getSchedulesByMemberId(member.getMemberId());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("일정 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("일정 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }
    
    // 특정 일정 조회
    @GetMapping("/{scheduleId}")
    public ResponseEntity<?> getScheduleById(
        @PathVariable("scheduleId") Long scheduleId,
        HttpServletRequest request
    ) {
        try {
            String email = extractEmailFromToken(request);
            Member member = memberMapper.getMemberByEmail(email);
            
            ScheduleDto schedule = scheduleService.getScheduleById(scheduleId);
            
            // 권한 확인 (자신의 일정만 볼 수 있음)
            if (!schedule.getMemberId().equals(member.getMemberId())) {
                return ResponseEntity.status(403).body(
                    ApiResponse.error("접근 권한이 없습니다.")
                );
            }
            
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("일정 상세 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("일정 상세 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }
    
    // 시간대별 일정 조회
    @GetMapping("/time/{intakeTime}")
    public ResponseEntity<?> getSchedulesByTime(
        @PathVariable("intakeTime") String intakeTime, 
        HttpServletRequest request
    ) {
        try {
            String email = extractEmailFromToken(request);
            Member member = memberMapper.getMemberByEmail(email);
            
            List<ScheduleDto> schedules = scheduleService.getSchedulesByTime(member.getMemberId(), intakeTime);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("시간대별 일정 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("시간대별 일정 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    // 일정 생성
    @PostMapping
    public ResponseEntity<?> createSchedule(
        @RequestBody ScheduleDto scheduleDto, 
        HttpServletRequest request
    ) {
        try {
            String email = extractEmailFromToken(request);
            
            Member member = memberMapper.getMemberByEmail(email);
            scheduleDto.setMemberId(member.getMemberId());
            
            ScheduleDto createdSchedule = scheduleService.createSchedule(scheduleDto);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            log.error("일정 생성 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("일정 생성 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }
    
    // 일정 수정
    @PutMapping("/{scheduleId}")
    public ResponseEntity<?> updateSchedule(
        @PathVariable("scheduleId") Long scheduleId,
        @RequestBody ScheduleDto scheduleDto,
        HttpServletRequest request
    ) {
        try {
            String email = extractEmailFromToken(request);
            Member member = memberMapper.getMemberByEmail(email);
            
            // 기존 일정 조회
            ScheduleDto existingSchedule = scheduleService.getScheduleById(scheduleId);
            
            // 권한 확인 (자신의 일정만 수정 가능)
            if (!existingSchedule.getMemberId().equals(member.getMemberId())) {
                return ResponseEntity.status(403).body(
                    ApiResponse.error("접근 권한이 없습니다.")
                );
            }
            
            // ID 설정
            scheduleDto.setScheduleId(scheduleId);
            scheduleDto.setMemberId(member.getMemberId());
            
            ScheduleDto updatedSchedule = scheduleService.updateSchedule(scheduleDto);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            log.error("일정 수정 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("일정 수정 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }
    
    // 일정 삭제
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<?> deleteSchedule(
        @PathVariable("scheduleId") Long scheduleId,
        HttpServletRequest request
    ) {
        try {
            String email = extractEmailFromToken(request);
            Member member = memberMapper.getMemberByEmail(email);
            
            // 기존 일정 조회
            ScheduleDto existingSchedule = scheduleService.getScheduleById(scheduleId);
            
            // 권한 확인 (자신의 일정만 삭제 가능)
            if (!existingSchedule.getMemberId().equals(member.getMemberId())) {
                return ResponseEntity.status(403).body(
                    ApiResponse.error("접근 권한이 없습니다.")
                );
            }
            
            scheduleService.deleteSchedule(scheduleId);
            return ResponseEntity.ok(
                ApiResponse.success("일정이 성공적으로 삭제되었습니다.")
            );
        } catch (Exception e) {
            log.error("일정 삭제 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error("일정 삭제 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }
}