package com.suppleit.backend.service;

import com.suppleit.backend.dto.FavoriteDto;
import com.suppleit.backend.mapper.FavoriteMapper;
import com.suppleit.backend.mapper.MemberMapper;
import com.suppleit.backend.mapper.ProductMapper;
import com.suppleit.backend.model.Favorite;
import com.suppleit.backend.model.Member;
import com.suppleit.backend.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final MemberMapper memberMapper;
    private final ProductMapper productMapper;

    // 사용자의 즐겨찾기 목록 조회
    public List<FavoriteDto> getUserFavorites(String email) {
        Member member = memberMapper.getMemberByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email);
        }
        
        List<Favorite> favorites = favoriteMapper.getFavoritesByMemberId(member.getMemberId());
        return favorites.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 즐겨찾기 추가
    @Transactional
    public void addFavorite(String email, FavoriteDto favoriteDto) {
        // 회원 정보 조회
        Member member = memberMapper.getMemberByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email);
        }
        
        // 제품 정보 확인 및 저장
        Product product = productMapper.getProductById(favoriteDto.getPrdId());
        if (product == null) {
            // 제품이 존재하지 않으면 새로 저장
            product = new Product();
            product.setPrdId(favoriteDto.getPrdId());
            product.setProductName(favoriteDto.getProductName());
            product.setCompanyName(favoriteDto.getCompanyName());
            
            productMapper.insertProduct(product);
            log.info("새 제품 저장: {}", favoriteDto.getProductName());
        }
        
        // 이미 즐겨찾기한 제품인지 확인
        Favorite existingFavorite = favoriteMapper.getFavoriteByMemberAndProduct(
                member.getMemberId(), favoriteDto.getPrdId());
        
        if (existingFavorite != null) {
            log.info("이미 즐겨찾기한 제품입니다: {}", favoriteDto.getProductName());
            return;
        }
        
        // 즐겨찾기 추가
        Favorite favorite = new Favorite();
        favorite.setMemberId(member.getMemberId());
        favorite.setPrdId(favoriteDto.getPrdId());
        
        favoriteMapper.insertFavorite(favorite);
        log.info("즐겨찾기 추가 완료: {} - {}", email, favoriteDto.getProductName());
    }

    // 즐겨찾기 삭제
    @Transactional
    public void removeFavorite(String email, Long prdId) {
        // 회원 정보 조회
        Member member = memberMapper.getMemberByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email);
        }
        
        // 즐겨찾기 삭제
        favoriteMapper.deleteFavorite(member.getMemberId(), prdId);
        log.info("즐겨찾기 삭제 완료: {} - {}", email, prdId);
    }

    // Entity -> DTO 변환
private FavoriteDto convertToDto(Favorite favorite) {
    FavoriteDto dto = new FavoriteDto();
    dto.setFavoriteId(favorite.getFavoriteId());
    dto.setPrdId(favorite.getPrdId());
    
    // 제품 정보 추가
    Product product = productMapper.getProductById(favorite.getPrdId());
    if (product != null) {
        dto.setProductName(product.getProductName());
        dto.setCompanyName(product.getCompanyName());
        // null 체크를 추가하여 NPE 방지
        if (product.getMainFunction() != null) {
            dto.setMainFunction(product.getMainFunction());
        }
        if (product.getExpirationPeriod() != null) {
            dto.setExpirationPeriod(product.getExpirationPeriod());
        }
    }
    
    return dto;
}
}