import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="h-full bg-gray-800 text-gray-100 p-4">
      <Card className="h-full bg-gray-700 border-gray-600">
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
          <div className="text-6xl">💥</div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-400">
              Oops! Etwas ist schiefgelaufen
            </h2>

            <Message
              severity="error"
              text="Ein unerwarteter Fehler ist aufgetreten. Keine Sorge - Ihre Daten sind sicher."
              className="w-full max-w-md"
            />
          </div>

          <div className="bg-gray-800 p-4 rounded border border-gray-600 max-w-lg w-full">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Fehlerdetails:</h3>
            <pre className="text-xs text-red-300 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  Stack Trace anzeigen
                </summary>
                <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap break-words max-h-32 overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              label="Erneut versuchen"
              icon="pi pi-refresh"
              onClick={resetError}
              className="bg-blue-600 hover:bg-blue-700"
            />

            <Button
              label="Seite neu laden"
              icon="pi pi-replay"
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700"
              outlined
            />
          </div>

          <div className="text-xs text-gray-400 max-w-md">
            Tipp: Wenn das Problem weiterhin besteht, versuchen Sie die Seite neu zu laden
            oder kontaktieren Sie den Support.
          </div>
        </div>
      </Card>
    </div>
  );
}