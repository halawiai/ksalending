import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/navigation/language-toggle';
import { PartnerLogin } from '@/components/navigation/partner-login';
import { 
  Users, 
  Building2, 
  University, 
  Languages,
  Star,
  ArrowRight, 
  CheckCircle,
  Shield, 
  TrendingUp,
  Zap, 
  Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-900">KSA Lending</h1>
                <p className="text-xs text-emerald-600">Nervous System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              <PartnerLogin />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Central Nervous System for Saudi Lending
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-emerald-900 mb-8 leading-tight">
            KSA Lending
            <span className="block text-4xl md:text-6xl text-teal-700 mt-2">
              Nervous System
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-700 max-w-4xl mx-auto leading-relaxed mb-8">
            The intelligent central platform connecting Saudi Arabia's lending ecosystem through 
            real-time risk assessment, comprehensive entity management, and data-driven financial insights.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              SAMA Compliant
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Nafath Integrated
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Real-time Processing
            </div>
          </div>
        </div>

        {/* Entity Type Selection */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
              Choose Your Entity Type
            </h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              Select your entity type to access tailored credit assessment and lending services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Individual Card */}
            <Card className="group border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-emerald-900 mb-2">Individuals</CardTitle>
                <CardDescription className="text-emerald-600 text-base leading-relaxed">
                  Personal credit assessment, income verification, and individual lending solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Nafath Identity Verification
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    SIMAH Credit Reports
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Income Assessment
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl group-hover:shadow-lg transition-all duration-300">
                  <Link href="/onboarding/individual">
                    Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Company Card */}
            <Card className="group border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-emerald-900 mb-2">Companies</CardTitle>
                <CardDescription className="text-emerald-600 text-base leading-relaxed">
                  Business credit evaluation, commercial risk assessment, and corporate lending
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Commercial Registration
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Financial Statements Analysis
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Business Risk Scoring
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl group-hover:shadow-lg transition-all duration-300">
                  <Link href="/onboarding/company">
                    Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Institution Card */}
            <Card className="group border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <University className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-emerald-900 mb-2">Institutions</CardTitle>
                <CardDescription className="text-emerald-600 text-base leading-relaxed">
                  Financial institution management, regulatory compliance, and system oversight
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    SAMA Regulatory Compliance
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Portfolio Management
                  </div>
                  <div className="flex items-center text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
                    Risk Analytics Platform
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl group-hover:shadow-lg transition-all duration-300">
                  <Link href="/onboarding/institution">
                    Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              Advanced capabilities designed for the Saudi lending ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Real-time Decisions</h3>
              <p className="text-sm text-emerald-600">Instant credit assessments and lending decisions</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Financial Inclusion</h3>
              <p className="text-sm text-emerald-600">Expanding access to credit across Saudi Arabia</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Secure & Compliant</h3>
              <p className="text-sm text-emerald-600">SAMA-compliant with advanced security measures</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Data-Driven Insights</h3>
              <p className="text-sm text-emerald-600">Advanced analytics and risk assessment</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Lending Experience?
          </h2>
          <p className="text-xl mb-8 text-emerald-100 max-w-2xl mx-auto">
            Join the central nervous system connecting Saudi Arabia's lending ecosystem
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-4 rounded-xl">
              <Link href="/login">
                Sign In to Platform
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl">
              <Link href="/onboarding/individual">
                Start Assessment
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-emerald-900 text-emerald-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h3 className="font-bold text-white">KSA Lending</h3>
                  <p className="text-xs text-emerald-300">Nervous System</p>
                </div>
              </div>
              <p className="text-sm text-emerald-300">
                The central platform for Saudi Arabia's lending ecosystem
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Entity Types</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/onboarding/individual" className="hover:text-white transition-colors">Individuals</Link></li>
                <li><Link href="/onboarding/company" className="hover:text-white transition-colors">Companies</Link></li>
                <li><Link href="/onboarding/institution" className="hover:text-white transition-colors">Institutions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Compliance</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-emerald-300">SAMA Regulated</span></li>
                <li><span className="text-emerald-300">Nafath Integrated</span></li>
                <li><span className="text-emerald-300">ISO 27001 Certified</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-800 mt-8 pt-8 text-center text-sm text-emerald-300">
            <p>&copy; 2024 KSA Lending Nervous System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}