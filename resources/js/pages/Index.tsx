import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Users,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for last logins
const mockLogins = [
  { id: 1, date: "2024-01-15 14:32:15", user: "admin@example.com", ip: "192.168.1.100" },
  { id: 2, date: "2024-01-15 13:45:22", user: "user@company.com", ip: "10.0.0.156" },
  { id: 3, date: "2024-01-15 12:18:45", user: "manager@corp.com", ip: "172.16.0.45" },
  { id: 4, date: "2024-01-15 11:55:33", user: "dev@startup.io", ip: "203.0.113.42" },
  { id: 5, date: "2024-01-15 10:22:17", user: "support@help.com", ip: "198.51.100.78" },
  { id: 6, date: "2024-01-15 09:41:29", user: "sales@business.net", ip: "192.0.2.123" },
  { id: 7, date: "2024-01-15 08:15:55", user: "hr@people.org", ip: "203.0.113.195" },
  { id: 8, date: "2024-01-15 07:33:41", user: "finance@money.biz", ip: "198.51.100.234" },
];

export default function Index() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  //const totalPages = Math.ceil(mockLogins.length / itemsPerPage);
  const totalPages = useMemo(() => Math.ceil(mockLogins.length / itemsPerPage), []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogins = mockLogins.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über System-Aktivitäten und Benutzer-Logins</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% seit letztem Monat</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5% seit gestern</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sicherheitswarnungen</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 neue heute</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Sitzungszeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24m</div>
            <p className="text-xs text-muted-foreground">-2m seit gestern</p>
          </CardContent>
        </Card>
      </div>

        {/* Last Logins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Logins</CardTitle>
            <CardDescription>
              Übersicht der neuesten Benutzer-Anmeldungen im System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Datum</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Benutzer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">IP-Adresse</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogins.map((login, index) => (
                    <tr 
                      key={login.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                        {login.date}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {login.user}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                        {login.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Seite {currentPage} von {totalPages} ({mockLogins.length} Einträge gesamt)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}
