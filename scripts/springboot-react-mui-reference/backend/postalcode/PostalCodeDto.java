package com.example.{:packagename:}.postalcode;

public record PostalCodeDto(Long id, String countryCode, String postalCode,
                            String city, String state, String label) {

    public static PostalCodeDto of(PostalCode pc) {
        return new PostalCodeDto(pc.getId(), pc.getCountryCode(), pc.getPostalCode(),
                pc.getCity(), pc.getState(), pc.getLabel());
    }
}
