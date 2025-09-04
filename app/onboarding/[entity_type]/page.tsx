'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, FileText, Shield } from 'lucide-react';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const entityType = params.entity_type as string;
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Validate entity type
  const validEntityTypes = ['individual', 'company', 'institution'];
  if (!validEntityTypes.includes(entityType)) {
    router.push('/');
    return null;
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Verification Documents';
      case 3:
        return 'Financial Details';
      case 4:
        return 'Review & Submit';
      default:
        return 'Onboarding';
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case 'individual':
        return 'Individual';
      case 'company':
        return 'Company';
      case 'institution':
        return 'Institution';
      default:
        return 'Entity';
    }
  };

  const getEntityDescription = () => {
    switch (entityType) {
      case 'individual':
        return 'Personal credit assessment and lending services';
      case 'company':
        return 'Business credit evaluation and corporate lending';
      case 'institution':
        return 'Financial institution management and regulatory compliance';
      default:
        return 'Entity onboarding';
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      router.push(`/${entityType}`);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            {getEntityTitle()} Onboarding
          </h1>
          <p className="text-green-700">
            {getEntityDescription()}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-3" />
        </div>

        {/* Main Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>
              Provide the required information for this step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entityType === 'individual' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="national_id">National ID</Label>
                      <Input id="national_id" placeholder="1234567890" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input id="first_name" placeholder="Ahmed" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input id="last_name" placeholder="Al-Saudi" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input id="date_of_birth" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saudi">Saudi Arabian</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input id="phone_number" placeholder="+966 50 123 4567" />
                    </div>
                  </>
                )}
                {entityType === 'company' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="commercial_reg">Commercial Registration</Label>
                      <Input id="commercial_reg" placeholder="1010123456" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input id="company_name" placeholder="Saudi Tech Solutions LLC" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_form">Legal Form</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select legal form" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llc">Limited Liability Company</SelectItem>
                          <SelectItem value="joint_stock">Joint Stock Company</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="establishment_date">Establishment Date</Label>
                      <Input id="establishment_date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry_sector">Industry Sector</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_count">Employee Count</Label>
                      <Input id="employee_count" type="number" placeholder="50" />
                    </div>
                  </>
                )}
                {entityType === 'institution' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input id="license_number" placeholder="LIC-2024-001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="institution_name">Institution Name</Label>
                      <Input id="institution_name" placeholder="Saudi Development Bank" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="institution_type">Institution Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select institution type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Commercial Bank</SelectItem>
                          <SelectItem value="finance_company">Finance Company</SelectItem>
                          <SelectItem value="microfinance">Microfinance Institution</SelectItem>
                          <SelectItem value="cooperative">Credit Cooperative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regulatory_authority">Regulatory Authority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sama">SAMA</SelectItem>
                          <SelectItem value="cma">CMA</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Upload verification documents</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {entityType === 'individual' && 'National ID, Income Certificate, Bank Statements'}
                    {entityType === 'company' && 'Commercial Registration, Financial Statements, Tax Certificate'}
                    {entityType === 'institution' && 'License, Regulatory Approvals, Capital Adequacy Reports'}
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entityType === 'individual' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_income">Monthly Income (SAR)</Label>
                      <Input id="monthly_income" type="number" placeholder="15000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employment_status">Employment Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self_employed">Self Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="employer_name">Employer Name (Optional)</Label>
                      <Input id="employer_name" placeholder="Saudi Aramco" />
                    </div>
                  </>
                )}
                {entityType === 'company' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="annual_revenue">Annual Revenue (SAR)</Label>
                      <Input id="annual_revenue" type="number" placeholder="2500000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_assets">Total Assets (SAR)</Label>
                      <Input id="total_assets" type="number" placeholder="5000000" />
                    </div>
                  </>
                )}
                {entityType === 'institution' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="capital_adequacy_ratio">Capital Adequacy Ratio (%)</Label>
                      <Input id="capital_adequacy_ratio" type="number" step="0.1" placeholder="18.5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_assets">Total Assets (SAR)</Label>
                      <Input id="total_assets" type="number" placeholder="1000000000" />
                    </div>
                  </>
                )}
                <div className="md:col-span-2 text-center p-6 border border-gray-200 rounded-lg bg-green-50">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium text-sm">Secure Financial Information</p>
                  <p className="text-green-600 text-xs mt-1">
                    All financial data is encrypted and SAMA compliant
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center p-8 border border-gray-200 rounded-lg bg-blue-50">
                  <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-blue-800 font-medium">Review Your Information</p>
                  <p className="text-blue-600 text-sm mt-2">
                    Please review all details before submitting
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Entity Type:</span>
                    <span className="capitalize">{entityType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Verification Status:</span>
                    <span className="text-yellow-600">Pending</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Documents:</span>
                    <span className="text-green-600">Ready for Upload</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button 
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700"
          >
            {step === totalSteps ? 'Complete Onboarding' : 'Next'}
            {step < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}