package com.example.{:packagename:}.{:filesingularlower:};

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
{:if hasforeignkeys:}
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
{:endif:}

public interface {:filesingularpascalcase:}Repository extends JpaRepository<{:filesingularpascalcase:}, Long> {

{:if hasforeignkeys:}
    @EntityGraph(attributePaths = {{:for nmaxforeignkeys:}"{:foreign.referencedtablesingularcamelcase:}", {:endfor:}})
{:endif:}
    @Query("""
            SELECT e FROM {:filesingularpascalcase:} e
            WHERE :search IS NULL OR :search = ''
{:for nmaxitems:}
{:if item.isforeign:}
{:else:}
{:if item.javatype eq "String":}
               OR LOWER(COALESCE(e.{:item.camelcase:}, '')) LIKE LOWER(CONCAT('%', :search, '%'))
{:endif:}
{:endif:}
{:endfor:}
            """)
    Page<{:filesingularpascalcase:}> search(@Param("search") String search, Pageable pageable);

{:if hasforeignkeys:}
    /** Loads foreign-key associations eagerly (open-in-view is disabled). */
    @EntityGraph(attributePaths = {{:for nmaxforeignkeys:}"{:foreign.referencedtablesingularcamelcase:}", {:endfor:}})
    Optional<{:filesingularpascalcase:}> findWithDetailsById(Long id);
{:endif:}
}
