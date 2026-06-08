package com.example.{:packagename:}.{:filesingularlower:};
{:if form_set_name ne '':}

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Form backing object for the combined create / edit {:filesingularlower:} dialog.
 * id == null means "create", otherwise "edit".
 */
public class {:filesingularpascalcase:}Form {

    private Long id;

{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.javatype eq "String":}
{:if item.notnull:}
    @NotBlank
{:endif:}
{:if item.size gt 0:}
    @Size(max = {:item.size:})
{:endif:}
{:elseif item.notnull:}
    @NotNull
{:endif:}
    private {:item.javatype:} {:item.camelcase:};

{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
    private Long {:foreign.referencedtablesingularcamelcase:}Id;

{:endfor:}
    public static {:filesingularpascalcase:}Form of({:filesingularpascalcase:} entity) {
        {:filesingularpascalcase:}Form form = new {:filesingularpascalcase:}Form();
        form.id = entity.getId();
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
        form.{:item.camelcase:} = entity.get{:item.pascalcase:}();
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
        form.{:foreign.referencedtablesingularcamelcase:}Id = entity.get{:foreign.referencedtablesingularpascalcase:}() != null ? entity.get{:foreign.referencedtablesingularpascalcase:}().getId() : null;
{:endfor:}
        return form;
    }

    public boolean isNew() {
        return id == null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
    public {:item.javatype:} get{:item.pascalcase:}() {
        return {:item.camelcase:};
    }

    public void set{:item.pascalcase:}({:item.javatype:} {:item.camelcase:}) {
        this.{:item.camelcase:} = {:item.camelcase:};
    }

{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
    public Long get{:foreign.referencedtablesingularpascalcase:}Id() {
        return {:foreign.referencedtablesingularcamelcase:}Id;
    }

    public void set{:foreign.referencedtablesingularpascalcase:}Id(Long {:foreign.referencedtablesingularcamelcase:}Id) {
        this.{:foreign.referencedtablesingularcamelcase:}Id = {:foreign.referencedtablesingularcamelcase:}Id;
    }

{:endfor:}
}
{:endif:}
