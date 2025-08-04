import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Activity() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Aktivität</h1>
        <p className="text-gray-600 mt-1">Übersicht über alle System- und Benutzeraktivitäte</p>
      </div>
      
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle>Seite in Entwicklung</CardTitle>
          <CardDescription>Diese Seite wird bald verfügbar sein.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
