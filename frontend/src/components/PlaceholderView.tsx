import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderView({ title, description, icon: Icon }: PlaceholderViewProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">Fonctionnalité en développement</h3>
          <p className="text-gray-600">
            Cette section sera bientôt disponible
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
