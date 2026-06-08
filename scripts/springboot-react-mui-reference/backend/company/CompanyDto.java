package com.example.{:packagename:}.company;

public record CompanyDto(Long id, String name, String vatNumber,
                         String website, String phone, String industry) {

    public static CompanyDto of(Company company) {
        return new CompanyDto(company.getId(), company.getName(), company.getVatNumber(),
                company.getWebsite(), company.getPhone(), company.getIndustry());
    }
}
