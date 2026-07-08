package com.zenthera.mapper.common;

import org.springframework.data.domain.Page;

import com.zenthera.dto.common.PageResponse;

public final class PageResponseMapper {

    private PageResponseMapper() {
        // Evita instanciar la clase
    }

    public static <T> PageResponse<T> from(Page<T> page) {

        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

}