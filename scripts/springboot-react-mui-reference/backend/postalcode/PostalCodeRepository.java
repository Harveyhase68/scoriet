package com.example.{:packagename:}.postalcode;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostalCodeRepository extends JpaRepository<PostalCode, Long> {

    List<PostalCode> findAllByOrderByCountryCodeAscPostalCodeAsc();
}
