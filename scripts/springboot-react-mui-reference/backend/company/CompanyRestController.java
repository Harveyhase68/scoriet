package com.example.{:packagename:}.company;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Company lookup for the customer form dropdown. */
@RestController
@RequestMapping("/api/companies")
public class CompanyRestController {

    private final CompanyRepository companyRepository;

    public CompanyRestController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @GetMapping
    public List<CompanyDto> list() {
        return companyRepository.findAllByOrderByNameAsc()
                .stream().map(CompanyDto::of).toList();
    }
}
