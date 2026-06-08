package com.example.{:packagename:}.postalcode;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Postal code lookup for the customer form dropdown. */
@RestController
@RequestMapping("/api/postal-codes")
public class PostalCodeRestController {

    private final PostalCodeRepository postalCodeRepository;

    public PostalCodeRestController(PostalCodeRepository postalCodeRepository) {
        this.postalCodeRepository = postalCodeRepository;
    }

    @GetMapping
    public List<PostalCodeDto> list() {
        return postalCodeRepository.findAllByOrderByCountryCodeAscPostalCodeAsc()
                .stream().map(PostalCodeDto::of).toList();
    }
}
