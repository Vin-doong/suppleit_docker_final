package com.suppleit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthFunctionalFoodDto {
    private String prduct;        // 제품명
    private String entrps;        // 업체명
    private String sttemntNo;     // 품목제조신고번호
    private String registDt;      // 등록일자
    private String distbPd;       // 유통기한
    private String sungsang;      // 성상
    private String srvUse;        // 섭취방법
    private String prsrvPd;       // 보관방법
    private String intakeHint;    // 섭취 시 주의사항
    private String mainFnctn;     // 주요기능
    private String baseStandard;  // 기준규격
}