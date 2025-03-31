package com.suppleit.backend.model;

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
public class Product {
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