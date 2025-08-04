import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Construction className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle>Seite in Entwicklung</CardTitle>
            <CardDescription>
              Diese Seite wird bald verfügbar sein.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-600">
            <p>
              Bitte setzen Sie die Entwicklung mit weiteren Anweisungen fort, 
              um den Inhalt dieser Seite zu erstellen.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
