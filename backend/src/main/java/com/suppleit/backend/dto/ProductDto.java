// src/main/java/com/suppleit/backend/dto/ProductDto.java
package com.suppleit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long prdId;
    private String productName;
    private String companyName;
    private String registrationNo;
    private String expirationPeriod;
    private String srvUse;
    private String mainFunction;
    private String preservation;
    private String intakeHint;
    private String baseStandard;
}