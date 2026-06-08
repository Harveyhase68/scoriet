package com.example.{:packagename:}.{:filesingularlower:};

{:for nmaxforeignkeys:}
import com.example.{:packagename:}.{:foreign.referencedtablesingularlower:}.{:foreign.referencedtablesingularpascalcase:};
{:endfor:}
import jakarta.persistence.*;

@Entity
@Table(name = "{:tablename:}")
public class {:filesingularpascalcase:} {

{:for nmaxitems:}
{:if item.isforeign:}
{:else:}
{:if item.isprimary:}
    @Id
{:if item.autoincrement:}
    @GeneratedValue(strategy = GenerationType.IDENTITY)
{:endif:}
    @Column(name = "{:item.name:}")
    private {:item.javatype:} id;

{:elseif item.istimestamp:}
{:if item.namenoprefix eq "created_at":}
    @org.hibernate.annotations.CreationTimestamp
{:elseif item.namenoprefix eq "updated_at":}
    @org.hibernate.annotations.UpdateTimestamp
{:endif:}
    @Column(name = "{:item.name:}"{:if item.namenoprefix eq "created_at":}, updatable = false{:endif:})
    private {:item.javatype:} {:item.camelcase:};

{:else:}
    @Column(name = "{:item.name:}"{:if item.notnull:}, nullable = false{:endif:}{:if item.javatype eq "String" and item.size gt 0:}, length = {:item.size:}{:endif:}{:if item.isunique:}, unique = true{:endif:})
    private {:item.javatype:} {:item.camelcase:};

{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "{:foreign.name:}")
    private {:foreign.referencedtablesingularpascalcase:} {:foreign.referencedtablesingularcamelcase:};

{:endfor:}
    /** Human-readable label built from the text columns — used in dropdowns / FK cells. */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.javatype eq "String":}
        if ({:item.camelcase:} != null) sb.append({:item.camelcase:}).append(' ');
{:endif:}
{:endif:}
{:endfor:}
        String label = sb.toString().trim();
        return label.isEmpty() ? "#" + id : label;
    }

    // --- getters and setters ---

{:for nmaxitems:}
{:if item.isforeign:}
{:else:}
{:if item.isprimary:}
    public {:item.javatype:} getId() {
        return id;
    }

    public void setId({:item.javatype:} id) {
        this.id = id;
    }

{:else:}
    public {:item.javatype:} get{:item.pascalcase:}() {
        return {:item.camelcase:};
    }

    public void set{:item.pascalcase:}({:item.javatype:} {:item.camelcase:}) {
        this.{:item.camelcase:} = {:item.camelcase:};
    }

{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
    public {:foreign.referencedtablesingularpascalcase:} get{:foreign.referencedtablesingularpascalcase:}() {
        return {:foreign.referencedtablesingularcamelcase:};
    }

    public void set{:foreign.referencedtablesingularpascalcase:}({:foreign.referencedtablesingularpascalcase:} {:foreign.referencedtablesingularcamelcase:}) {
        this.{:foreign.referencedtablesingularcamelcase:} = {:foreign.referencedtablesingularcamelcase:};
    }

{:endfor:}
}
