'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CreditScoreCardProps {
  score: number;
  previousScore?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated: string;
}

export function CreditScoreCard({ score, previousScore, riskLevel, lastUpdated }: CreditScoreCardProps) {
  const scoreChange = previousScore ? score - previousScore : 0;
  const scorePercentage = (score / 850) * 100;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'very_high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = () => {
    if (scoreChange > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (scoreChange < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Credit Score</span>
          <Badge className={getRiskColor(riskLevel)}>
            {riskLevel.replace('_', ' ').toUpperCase()} RISK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {score}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            {getTrendIcon()}
            <span>
              {scoreChange !== 0 && (
                <>
                  {Math.abs(scoreChange)} point{Math.abs(scoreChange) !== 1 ? 's' : ''} 
                  {scoreChange > 0 ? ' increase' : ' decrease'}
                </>
              )}
              {scoreChange === 0 && 'No change'}
            </span>
          </div>
        </div>

        <Progress 
          value={scorePercentage} 
          className="h-3"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Poor (300)</span>
          <span>Excellent (850)</span>
        </div>

        <div className="pt-4 border-t text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}