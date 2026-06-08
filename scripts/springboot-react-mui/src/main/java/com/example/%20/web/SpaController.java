package com.example.{:packagename:}.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the React app for all client-side routes: the browser requests e.g.
 * /customers directly (deep link, reload), but routing happens in the SPA, so
 * every app route must return the built index.html. One route per table with a
 * UI; /print/** covers all print views.
 */
@Controller
public class SpaController {

    @GetMapping({"/", "/login", "/setup", "/print/**"
{:for nmaxtables:}
{:if form_set_name ne '':}
            , "/{:filename:}"
{:endif:}
{:endfor:}
    })
    public String index() {
        return "forward:/index.html";
    }
}
