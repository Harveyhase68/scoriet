package com.example.{:packagename:}.{:filesingularlower:};

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request body for create/edit (POST /api/{:tablename:}, PUT /api/{:tablename:}/{id}). */
public class {:filesingularpascalcase:}Request {

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
