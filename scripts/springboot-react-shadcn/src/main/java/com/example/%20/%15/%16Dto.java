package com.example.{:packagename:}.{:filesingularlower:};

{:for nmaxforeignkeys:}
import com.example.{:packagename:}.{:foreign.referencedtablesingularlower:}.{:foreign.referencedtablesingularpascalcase:}Dto;
{:endfor:}

public record {:filesingularpascalcase:}Dto(
        Long id
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:else:}
        , {:item.javatype:} {:item.camelcase:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
        , {:foreign.referencedtablesingularpascalcase:}Dto {:foreign.referencedtablesingularcamelcase:}
{:endfor:}
) {

    public static {:filesingularpascalcase:}Dto of({:filesingularpascalcase:} e) {
        return new {:filesingularpascalcase:}Dto(
                e.getId()
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:else:}
                , e.get{:item.pascalcase:}()
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
                , e.get{:foreign.referencedtablesingularpascalcase:}() == null ? null : {:foreign.referencedtablesingularpascalcase:}Dto.of(e.get{:foreign.referencedtablesingularpascalcase:}())
{:endfor:}
        );
    }
}
