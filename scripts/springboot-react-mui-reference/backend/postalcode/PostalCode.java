package com.example.{:packagename:}.postalcode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "postal_codes")
public class PostalCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pc_id")
    private Long id;

    @Column(name = "pc_country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "pc_postal_code", nullable = false, length = 32)
    private String postalCode;

    @Column(name = "pc_city", nullable = false, length = 128)
    private String city;

    @Column(name = "pc_state", length = 128)
    private String state;

    /** Display label used in dropdowns and lists, e.g. "1010 Vienna (AT)". */
    public String getLabel() {
        return postalCode + " " + city + " (" + countryCode + ")";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }
}
