package com.suppleit.backend.dto;

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
public class FavoriteDto {
    private Long favoriteId;
    private Long prdId;
    private String productName;
    private String companyName;
    private String mainFunction;
    private String expirationPeriod;
}