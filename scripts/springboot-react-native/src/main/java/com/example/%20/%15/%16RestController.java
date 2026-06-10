package com.example.{:packagename:}.{:filesingularlower:};

import java.net.URI;
import java.util.List;

import com.example.{:packagename:}.web.PageDto;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** {:filesingularpascalcase:} CRUD API used by the React frontend. */
@RestController
@RequestMapping("/api/{:tablename:}")
public class {:filesingularpascalcase:}RestController {

    private final {:filesingularpascalcase:}Service {:filesingularcamelcase:}Service;

    public {:filesingularpascalcase:}RestController({:filesingularpascalcase:}Service {:filesingularcamelcase:}Service) {
        this.{:filesingularcamelcase:}Service = {:filesingularcamelcase:}Service;
    }

    @GetMapping
    public PageDto<{:filesingularpascalcase:}Dto> list(@RequestParam(defaultValue = "") String search,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        return PageDto.of({:filesingularcamelcase:}Service.search(search, Math.max(page, 0), size), {:filesingularpascalcase:}Dto::of);
    }

    /** Unpaged list for the print view (current search filter applied). */
    @GetMapping("/all")
    public List<{:filesingularpascalcase:}Dto> all(@RequestParam(defaultValue = "") String search) {
        return {:filesingularcamelcase:}Service.search(search, 0, Integer.MAX_VALUE)
                .map({:filesingularpascalcase:}Dto::of).getContent();
    }

    @GetMapping("/{id}")
    public {:filesingularpascalcase:}Dto get(@PathVariable Long id) {
        return {:filesingularpascalcase:}Dto.of({:filesingularcamelcase:}Service.get(id));
    }

    @PostMapping
    public ResponseEntity<{:filesingularpascalcase:}Dto> create(@Valid @RequestBody {:filesingularpascalcase:}Request request) {
        {:filesingularpascalcase:} entity = {:filesingularcamelcase:}Service.create(request);
        return ResponseEntity.created(URI.create("/api/{:tablename:}/" + entity.getId()))
                .body({:filesingularpascalcase:}Dto.of({:filesingularcamelcase:}Service.get(entity.getId())));
    }

    @PutMapping("/{id}")
    public {:filesingularpascalcase:}Dto update(@PathVariable Long id, @Valid @RequestBody {:filesingularpascalcase:}Request request) {
        {:filesingularcamelcase:}Service.update(id, request);
        return {:filesingularpascalcase:}Dto.of({:filesingularcamelcase:}Service.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        {:filesingularcamelcase:}Service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
