package com.suppleit.backend.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleDto {
    private Long scheduleId;
    private String supplementName;
    private String intakeTime; // "아침", "점심", "저녁"
    private LocalDate intakeStart;
    private LocalDate intakeEnd;
    private Integer intakeDistance; // 복용 기간
    private String memo;
    private Long memberId;
}