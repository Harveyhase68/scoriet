// Mirrors the DTO records of the Spring Boot REST API.

{:for nmaxtables:}
export interface {:filesingularpascalcase:} {
  id: number
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:else:}
  {:item.camelcase:}: {:item.jstype:}{:if item.notnull:}{:else:} | null{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
  {:foreign.referencedtablesingularcamelcase:}: {:foreign.referencedtablesingularpascalcase:} | null
{:endfor:}
}

/** Body for POST /api/{:filename:} and PUT /api/{:filename:}/{id}. */
export interface {:filesingularpascalcase:}Request {
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
  {:item.camelcase:}: {:item.jstype:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
  {:foreign.referencedtablesingularcamelcase:}Id: number | null
{:endfor:}
}

{:endfor:}
export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface SetupStatus {
  installed: boolean
  datasourceUrl: string
  connectionError: string | null
}

export interface UserInfo {
  username: string
  displayName: string | null
  role: string | null
}
