package com.example.{:packagename:}.{:filesingularlower:};

{:for nmaxforeignkeys:}
import com.example.{:packagename:}.{:foreign.referencedtablesingularlower:}.{:foreign.referencedtablesingularpascalcase:}Repository;
{:endfor:}
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class {:filesingularpascalcase:}Service {

    private final {:filesingularpascalcase:}Repository {:filesingularcamelcase:}Repository;
{:for nmaxforeignkeys:}
    private final {:foreign.referencedtablesingularpascalcase:}Repository {:foreign.referencedtablesingularcamelcase:}Repository;
{:endfor:}

    public {:filesingularpascalcase:}Service({:filesingularpascalcase:}Repository {:filesingularcamelcase:}Repository{:for nmaxforeignkeys:},
            {:foreign.referencedtablesingularpascalcase:}Repository {:foreign.referencedtablesingularcamelcase:}Repository{:endfor:}) {
        this.{:filesingularcamelcase:}Repository = {:filesingularcamelcase:}Repository;
{:for nmaxforeignkeys:}
        this.{:foreign.referencedtablesingularcamelcase:}Repository = {:foreign.referencedtablesingularcamelcase:}Repository;
{:endfor:}
    }

    @Transactional(readOnly = true)
    public Page<{:filesingularpascalcase:}> search(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
        return {:filesingularcamelcase:}Repository.search(search, pageable);
    }

    @Transactional(readOnly = true)
    public {:filesingularpascalcase:} get(Long id) {
        return {:filesingularcamelcase:}Repository.{:if hasforeignkeys:}findWithDetailsById{:else:}findById{:endif:}(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "{:filesingularpascalcase:} %d not found".formatted(id)));
    }

    public {:filesingularpascalcase:} create({:filesingularpascalcase:}Request request) {
        return apply(new {:filesingularpascalcase:}(), request);
    }

    public {:filesingularpascalcase:} update(Long id, {:filesingularpascalcase:}Request request) {
        return apply(get(id), request);
    }

    private {:filesingularpascalcase:} apply({:filesingularpascalcase:} entity, {:filesingularpascalcase:}Request request) {
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.javatype eq "String":}
        entity.set{:item.pascalcase:}(trimToNull(request.get{:item.pascalcase:}()));
{:else:}
        entity.set{:item.pascalcase:}(request.get{:item.pascalcase:}());
{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
        entity.set{:foreign.referencedtablesingularpascalcase:}(request.get{:foreign.referencedtablesingularpascalcase:}Id() == null
                ? null : {:foreign.referencedtablesingularcamelcase:}Repository.getReferenceById(request.get{:foreign.referencedtablesingularpascalcase:}Id()));
{:endfor:}
        return {:filesingularcamelcase:}Repository.save(entity);
    }

    public void delete(Long id) {
        {:filesingularcamelcase:}Repository.delete(get(id));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
