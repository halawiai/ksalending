'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, Building2, University } from 'lucide-react';
import { EntityType, getEntityConfig } from '@/lib/utils/entity-routing';

interface EntityCardProps {
  entityType: EntityType;
  className?: string;
}

const iconMap = {
  Users,
  Building2,
  University,
};

export function EntityCard({ entityType, className = '' }: EntityCardProps) {
  const config = getEntityConfig(entityType);
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];

  const getGradientClasses = () => {
    switch (config.color) {
      case 'emerald':
        return 'from-emerald-500 to-teal-500';
      case 'teal':
        return 'from-teal-500 to-emerald-500';
      default:
        return 'from-emerald-500 to-teal-500';
    }
  };

  const getButtonGradient = () => {
    switch (config.color) {
      case 'emerald':
        return 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
      case 'teal':
        return 'from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700';
      default:
        return 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
    }
  };

  return (
    <Card className={`group border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${getGradientClasses()} rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-emerald-900 mb-2">{config.title}s</CardTitle>
        <CardDescription className="text-emerald-600 text-base leading-relaxed">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 mb-6">
          {config.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 mr-3 text-emerald-500 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        <Button asChild className={`w-full bg-gradient-to-r ${getButtonGradient()} text-white font-semibold py-3 rounded-xl group-hover:shadow-lg transition-all duration-300`}>
          <Link href={config.onboardingPath}>
            Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}