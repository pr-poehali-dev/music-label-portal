import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminFix() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fixPasswords = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/05c06730-31f5-43a6-a240-50721bb848c6', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Исправление паролей</h1>
        <p className="mb-4 text-gray-600">
          Эта страница обновит все пароли в базе данных на правильный bcrypt хэш для пароля "12345"
        </p>
        
        <Button 
          onClick={fixPasswords} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Обновление...' : 'Обновить пароли'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Результат:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
