package com.example.{:packagename:}.config;

import java.util.function.Supplier;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

/**
 * CSRF handler for single-page apps, straight from the Spring Security reference
 * documentation: the token is exposed as an {@code XSRF-TOKEN} cookie that the
 * React API client echoes back in the {@code X-XSRF-TOKEN} header.
 *
 * <p>BREACH protection (XOR) only applies when the token is rendered into a
 * response; a token sent as a plain header is resolved without XOR decoding.</p>
 */
final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       Supplier<CsrfToken> csrfToken) {
        xor.handle(request, response, csrfToken);
        // force the deferred token to load so the XSRF-TOKEN cookie is written on every response
        csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String headerValue = request.getHeader(csrfToken.getHeaderName());
        // header value (from the cookie) is the raw token; form parameters would be XOR-encoded
        return (StringUtils.hasText(headerValue) ? this.plain : this.xor)
                .resolveCsrfTokenValue(request, csrfToken);
    }
}
