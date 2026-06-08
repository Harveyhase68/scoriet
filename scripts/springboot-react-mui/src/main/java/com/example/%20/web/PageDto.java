package com.example.{:packagename:}.web;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/** Stable JSON shape for paged results (instead of serializing Spring's Page directly). */
public record PageDto<T>(List<T> content, int page, int size,
                         long totalElements, int totalPages, boolean first, boolean last) {

    public static <E, T> PageDto<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageDto<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
