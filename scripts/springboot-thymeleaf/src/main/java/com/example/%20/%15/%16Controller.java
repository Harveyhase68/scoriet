package com.example.{:packagename:}.{:filesingularlower:};
{:if form_set_name ne '':}

{:for nmaxforeignkeys:}
import com.example.{:packagename:}.{:foreign.referencedtablesingularlower:}.{:foreign.referencedtablesingularpascalcase:}Repository;
{:endfor:}
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

/**
 * {:filesingularpascalcase:} UI. The list page is refreshed via htmx fragments, the
 * combined create/edit form lives in a Bootstrap modal loaded on demand.
 */
@Controller
@RequestMapping("/{:tablename:}")
public class {:filesingularpascalcase:}Controller {

    /** htmx event fired after every successful mutation; the table listens for it. */
    private static final String EVENT_CHANGED = "crud-changed";

    private final {:filesingularpascalcase:}Service {:filesingularcamelcase:}Service;
{:for nmaxforeignkeys:}
    private final {:foreign.referencedtablesingularpascalcase:}Repository {:foreign.referencedtablesingularcamelcase:}Repository;
{:endfor:}

    public {:filesingularpascalcase:}Controller({:filesingularpascalcase:}Service {:filesingularcamelcase:}Service{:for nmaxforeignkeys:},
            {:foreign.referencedtablesingularpascalcase:}Repository {:foreign.referencedtablesingularcamelcase:}Repository{:endfor:}) {
        this.{:filesingularcamelcase:}Service = {:filesingularcamelcase:}Service;
{:for nmaxforeignkeys:}
        this.{:foreign.referencedtablesingularcamelcase:}Repository = {:foreign.referencedtablesingularcamelcase:}Repository;
{:endfor:}
    }

    // --- list -----------------------------------------------------------

    @GetMapping
    public String list(@RequestParam(defaultValue = "") String search,
                       @RequestParam(defaultValue = "0") int page,
                       Model model) {
        addTableModel(model, search, page);
        return "{:tablename:}/list";
    }

    /** htmx endpoint: returns only the table fragment (search / paging / refresh). */
    @GetMapping("/table")
    public String table(@RequestParam(defaultValue = "") String search,
                        @RequestParam(defaultValue = "0") int page,
                        Model model) {
        addTableModel(model, search, page);
        return "{:tablename:}/list :: table";
    }

    // --- combined create / edit form (modal) -----------------------------

    @GetMapping("/form")
    public String createForm(Model model) {
        return form(new {:filesingularpascalcase:}Form(), model);
    }

    @GetMapping("/{id}/form")
    public String editForm(@PathVariable Long id, Model model) {
        return form({:filesingularpascalcase:}Form.of({:filesingularcamelcase:}Service.get(id)), model);
    }

    @PostMapping("/save")
    public Object save(@Valid @ModelAttribute("form") {:filesingularpascalcase:}Form form,
                       BindingResult bindingResult,
                       Model model) {
        if (bindingResult.hasErrors()) {
            // 422 + re-rendered modal body; htmx swaps it back into the dialog
            addFormModel(model);
            return new ModelAndView("{:tablename:}/form :: modal", model.asMap(), HttpStatus.UNPROCESSABLE_ENTITY);
        }
        {:filesingularcamelcase:}Service.save(form);
        return htmxTrigger();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        {:filesingularcamelcase:}Service.delete(id);
        return htmxTrigger();
    }

    // --- print views ------------------------------------------------------

    @GetMapping("/print")
    public String printTable(@RequestParam(defaultValue = "") String search, Model model) {
        model.addAttribute("items",
                {:filesingularcamelcase:}Service.search(search, 0, Integer.MAX_VALUE).getContent());
        model.addAttribute("search", search);
        return "{:tablename:}/print-table";
    }

    @GetMapping("/{id}/print")
    public String printForm(@PathVariable Long id, Model model) {
        model.addAttribute("item", {:filesingularcamelcase:}Service.get(id));
        return "{:tablename:}/print-form";
    }

    // --- helpers ----------------------------------------------------------

    private String form({:filesingularpascalcase:}Form form, Model model) {
        model.addAttribute("form", form);
        addFormModel(model);
        return "{:tablename:}/form :: modal";
    }

    private void addFormModel(Model model) {
{:for nmaxforeignkeys:}
        model.addAttribute("{:foreign.referencedtablesingularcamelcase:}Options", {:foreign.referencedtablesingularcamelcase:}Repository.findAll());
{:endfor:}
    }

    private void addTableModel(Model model, String search, int page) {
        Page<{:filesingularpascalcase:}> items = {:filesingularcamelcase:}Service.search(search, Math.max(page, 0), 10);
        model.addAttribute("items", items);
        model.addAttribute("search", search);
    }

    private static ResponseEntity<Void> htmxTrigger() {
        return ResponseEntity.noContent()
                .header("HX-Trigger", EVENT_CHANGED)
                .build();
    }
}
{:endif:}
