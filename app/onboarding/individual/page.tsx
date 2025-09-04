'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Shield, 
  Briefcase, 
  CreditCard, 
  FileCheck,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { 
  basicInfoSchema, 
  identitySchema, 
  employmentSchema, 
  financialSchema, 
  consentSchema 
} from '@/lib/utils/individual-validation';
import { toast } from 'sonner';
import { NafathAuth, NafathVerificationData } from '@/components/auth/nafath-auth';

const STEPS = [
  { number: 1, title: 'Basic Information', icon: User, description: 'Personal details and contact information' },
  { number: 2, title: 'Identity Verification', icon: Shield, description: 'Nafath verification and document upload' },
  { number: 3, title: 'Employment Details', icon: Briefcase, description: 'Work information and income details' },
  { number: 4, title: 'Financial Information', icon: CreditCard, description: 'Banking and financial commitments' },
  { number: 5, title: 'Consent & Privacy', icon: FileCheck, description: 'Legal agreements and final submission' },
];

export default function IndividualOnboardingPage() {
  const router = useRouter();
  const { 
    currentStep, 
    formData, 
    isSubmitting, 
    errors,
    setCurrentStep, 
    updateFormData, 
    setSubmitting, 
    setErrors,
    saveProgress 
  } = useOnboardingStore();

  const [localFormData, setLocalFormData] = useState(formData);

  const [nafathVerified, setNafathVerified] = useState(false);
  const [nafathData, setNafathData] = useState<NafathVerificationData | null>(null);

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const validateCurrentStep = () => {
    try {
      switch (currentStep) {
        case 1:
          basicInfoSchema.parse(localFormData);
          break;
        case 2:
          identitySchema.parse(localFormData);
          break;
        case 3:
          employmentSchema.parse(localFormData);
          break;
        case 4:
          financialSchema.parse(localFormData);
          break;
        case 5:
          consentSchema.parse(localFormData);
          break;
      }
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      updateFormData(localFormData);
      saveProgress();
      
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      updateFormData(localFormData);
      saveProgress();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Application submitted successfully!');
      router.push('/individual');
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateLocalData = (updates: any) => {
    setLocalFormData(prev => ({ ...prev, ...updates }));
  };

  const addBankAccount = () => {
    const newAccount = { bankName: '', iban: '', accountType: 'checking' as const };
    updateLocalData({
      bankAccounts: [...(localFormData.bankAccounts || []), newAccount]
    });
  };

  const removeBankAccount = (index: number) => {
    const accounts = [...(localFormData.bankAccounts || [])];
    accounts.splice(index, 1);
    updateLocalData({ bankAccounts: accounts });
  };

  const addLoan = () => {
    const newLoan = { lenderName: '', loanType: '', outstandingAmount: 0, monthlyPayment: 0 };
    updateLocalData({
      existingLoans: [...(localFormData.existingLoans || []), newLoan]
    });
  };

  const removeLoan = (index: number) => {
    const loans = [...(localFormData.existingLoans || [])];
    loans.splice(index, 1);
    updateLocalData({ existingLoans: loans });
  };

  const addAsset = () => {
    const newAsset = { assetType: 'property' as const, description: '', estimatedValue: 0 };
    updateLocalData({
      assets: [...(localFormData.assets || []), newAsset]
    });
  };

  const removeAsset = (index: number) => {
    const assets = [...(localFormData.assets || [])];
    assets.splice(index, 1);
    updateLocalData({ assets: assets });
  };

  const handleNafathSuccess = (data: NafathVerificationData) => {
    setNafathVerified(true);
    setNafathData(data);
    updateLocalData({
      nafathVerified: true,
      nationalId: data.nationalId,
      fullNameArabic: data.fullNameArabic,
      fullNameEnglish: data.fullNameEnglish,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality
    });
    toast.success('Nafath verification completed successfully!');
  };

  const handleNafathError = (error: string) => {
    setNafathVerified(false);
    setNafathData(null);
    updateLocalData({ nafathVerified: false });
    toast.error(`Nafath verification failed: ${error}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullNameArabic">الاسم الكامل (بالعربية) *</Label>
                <Input
                  id="fullNameArabic"
                  value={localFormData.fullNameArabic || ''}
                  onChange={(e) => updateLocalData({ fullNameArabic: e.target.value })}
                  placeholder="أحمد محمد العبدالله"
                  className={errors.fullNameArabic ? 'border-red-500' : ''}
                  dir="rtl"
                />
                {errors.fullNameArabic && (
                  <p className="text-sm text-red-600">{errors.fullNameArabic}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullNameEnglish">Full Name (English) *</Label>
                <Input
                  id="fullNameEnglish"
                  value={localFormData.fullNameEnglish || ''}
                  onChange={(e) => updateLocalData({ fullNameEnglish: e.target.value })}
                  placeholder="Ahmed Mohammed Al-Abdullah"
                  className={errors.fullNameEnglish ? 'border-red-500' : ''}
                />
                {errors.fullNameEnglish && (
                  <p className="text-sm text-red-600">{errors.fullNameEnglish}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={localFormData.email || ''}
                  onChange={(e) => updateLocalData({ email: e.target.value })}
                  placeholder="ahmed@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  value={localFormData.mobileNumber || ''}
                  onChange={(e) => updateLocalData({ mobileNumber: e.target.value })}
                  placeholder="+966 50 123 4567"
                  className={errors.mobileNumber ? 'border-red-500' : ''}
                />
                {errors.mobileNumber && (
                  <p className="text-sm text-red-600">{errors.mobileNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={localFormData.dateOfBirth || ''}
                  onChange={(e) => updateLocalData({ dateOfBirth: e.target.value })}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Select 
                  value={localFormData.nationality || ''} 
                  onValueChange={(value) => updateLocalData({ nationality: value })}
                >
                  <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saudi">Saudi Arabian</SelectItem>
                    <SelectItem value="gcc">GCC National</SelectItem>
                    <SelectItem value="expat">Expatriate</SelectItem>
                  </SelectContent>
                </Select>
                {errors.nationality && (
                  <p className="text-sm text-red-600">{errors.nationality}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {nafathVerified && nafathData ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <UserCheck className="w-5 h-5" />
                    Identity Verified
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your identity has been successfully verified through Nafath
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-800">Name (Arabic): </span>
                      <span className="text-green-700" dir="rtl">{nafathData.fullNameArabic}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Name (English): </span>
                      <span className="text-green-700">{nafathData.fullNameEnglish}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">National ID: </span>
                      <span className="text-green-700">{nafathData.nationalId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Date of Birth: </span>
                      <span className="text-green-700">{nafathData.dateOfBirth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <NafathAuth
                onVerificationComplete={handleNafathSuccess}
                onVerificationError={handleNafathError}
                entityType="individual"
                initialNationalId={localFormData.nationalId}
              />
            )}

              <Card className="border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Document Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a clear photo of your National ID or Iqama
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {localFormData.documentUploaded ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Document Uploaded</span>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Click to upload or drag and drop</p>
                      <Button 
                        variant="outline"
                        onClick={() => updateLocalData({ documentUploaded: true })}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeType">Employee Type *</Label>
                <Select 
                  value={localFormData.employeeType || ''} 
                  onValueChange={(value) => updateLocalData({ employeeType: value })}
                >
                  <SelectTrigger className={errors.employeeType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">Government Employee</SelectItem>
                    <SelectItem value="private">Private Sector</SelectItem>
                    <SelectItem value="military">Military</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employeeType && (
                  <p className="text-sm text-red-600">{errors.employeeType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector *</Label>
                <Input
                  id="sector"
                  value={localFormData.sector || ''}
                  onChange={(e) => updateLocalData({ sector: e.target.value })}
                  placeholder="e.g., Healthcare, Education, Technology"
                  className={errors.sector ? 'border-red-500' : ''}
                />
                {errors.sector && (
                  <p className="text-sm text-red-600">{errors.sector}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  value={localFormData.occupation || ''}
                  onChange={(e) => updateLocalData({ occupation: e.target.value })}
                  placeholder="e.g., Engineer, Teacher, Manager"
                  className={errors.occupation ? 'border-red-500' : ''}
                />
                {errors.occupation && (
                  <p className="text-sm text-red-600">{errors.occupation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={localFormData.jobTitle || ''}
                  onChange={(e) => updateLocalData({ jobTitle: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className={errors.jobTitle ? 'border-red-500' : ''}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-600">{errors.jobTitle}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySalary">Monthly Salary (SAR) *</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  value={localFormData.monthlySalary || ''}
                  onChange={(e) => updateLocalData({ monthlySalary: Number(e.target.value) })}
                  placeholder="15000"
                  className={errors.monthlySalary ? 'border-red-500' : ''}
                />
                {errors.monthlySalary && (
                  <p className="text-sm text-red-600">{errors.monthlySalary}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsEmployed">Years Employed *</Label>
                <Input
                  id="yearsEmployed"
                  type="number"
                  value={localFormData.yearsEmployed || ''}
                  onChange={(e) => updateLocalData({ yearsEmployed: Number(e.target.value) })}
                  placeholder="5"
                  className={errors.yearsEmployed ? 'border-red-500' : ''}
                />
                {errors.yearsEmployed && (
                  <p className="text-sm text-red-600">{errors.yearsEmployed}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="employerName">Employer Name *</Label>
                <Input
                  id="employerName"
                  value={localFormData.employerName || ''}
                  onChange={(e) => updateLocalData({ employerName: e.target.value })}
                  placeholder="Saudi Aramco"
                  className={errors.employerName ? 'border-red-500' : ''}
                />
                {errors.employerName && (
                  <p className="text-sm text-red-600">{errors.employerName}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="employerAddress">Employer Address *</Label>
                <Input
                  id="employerAddress"
                  value={localFormData.employerAddress || ''}
                  onChange={(e) => updateLocalData({ employerAddress: e.target.value })}
                  placeholder="123 King Fahd Road, Riyadh 12345"
                  className={errors.employerAddress ? 'border-red-500' : ''}
                />
                {errors.employerAddress && (
                  <p className="text-sm text-red-600">{errors.employerAddress}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Bank Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bank Accounts *
                  <Button onClick={addBankAccount} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add your primary bank accounts for income verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localFormData.bankAccounts || []).map((account, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={account.bankName}
                        onChange={(e) => {
                          const accounts = [...(localFormData.bankAccounts || [])];
                          accounts[index].bankName = e.target.value;
                          updateLocalData({ bankAccounts: accounts });
                        }}
                        placeholder="Al Rajhi Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input
                        value={account.iban}
                        onChange={(e) => {
                          const accounts = [...(localFormData.bankAccounts || [])];
                          accounts[index].iban = e.target.value;
                          updateLocalData({ bankAccounts: accounts });
                        }}
                        placeholder="SA1234567890123456789012"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Select 
                        value={account.accountType} 
                        onValueChange={(value) => {
                          const accounts = [...(localFormData.bankAccounts || [])];
                          accounts[index].accountType = value as 'checking' | 'savings';
                          updateLocalData({ bankAccounts: accounts });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => removeBankAccount(index)} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!localFormData.bankAccounts || localFormData.bankAccounts.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No bank accounts added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Income and Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income (SAR) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={localFormData.monthlyIncome || ''}
                  onChange={(e) => updateLocalData({ monthlyIncome: Number(e.target.value) })}
                  placeholder="15000"
                  className={errors.monthlyIncome ? 'border-red-500' : ''}
                />
                {errors.monthlyIncome && (
                  <p className="text-sm text-red-600">{errors.monthlyIncome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyExpenses">Monthly Expenses (SAR) *</Label>
                <Input
                  id="monthlyExpenses"
                  type="number"
                  value={localFormData.monthlyExpenses || ''}
                  onChange={(e) => updateLocalData({ monthlyExpenses: Number(e.target.value) })}
                  placeholder="8000"
                  className={errors.monthlyExpenses ? 'border-red-500' : ''}
                />
                {errors.monthlyExpenses && (
                  <p className="text-sm text-red-600">{errors.monthlyExpenses}</p>
                )}
              </div>
            </div>

            {/* Existing Loans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Existing Loans
                  <Button onClick={addLoan} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Loan
                  </Button>
                </CardTitle>
                <CardDescription>
                  List any existing loans or credit commitments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localFormData.existingLoans || []).map((loan, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Lender Name</Label>
                      <Input
                        value={loan.lenderName}
                        onChange={(e) => {
                          const loans = [...(localFormData.existingLoans || [])];
                          loans[index].lenderName = e.target.value;
                          updateLocalData({ existingLoans: loans });
                        }}
                        placeholder="Bank Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loan Type</Label>
                      <Input
                        value={loan.loanType}
                        onChange={(e) => {
                          const loans = [...(localFormData.existingLoans || [])];
                          loans[index].loanType = e.target.value;
                          updateLocalData({ existingLoans: loans });
                        }}
                        placeholder="Personal Loan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Outstanding Amount</Label>
                      <Input
                        type="number"
                        value={loan.outstandingAmount}
                        onChange={(e) => {
                          const loans = [...(localFormData.existingLoans || [])];
                          loans[index].outstandingAmount = Number(e.target.value);
                          updateLocalData({ existingLoans: loans });
                        }}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Payment</Label>
                      <Input
                        type="number"
                        value={loan.monthlyPayment}
                        onChange={(e) => {
                          const loans = [...(localFormData.existingLoans || [])];
                          loans[index].monthlyPayment = Number(e.target.value);
                          updateLocalData({ existingLoans: loans });
                        }}
                        placeholder="2000"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => removeLoan(index)} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!localFormData.existingLoans || localFormData.existingLoans.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No existing loans</p>
                )}
              </CardContent>
            </Card>

            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Assets
                  <Button onClick={addAsset} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </CardTitle>
                <CardDescription>
                  List your major assets (property, vehicles, investments)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(localFormData.assets || []).map((asset, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Asset Type</Label>
                      <Select 
                        value={asset.assetType} 
                        onValueChange={(value) => {
                          const assets = [...(localFormData.assets || [])];
                          assets[index].assetType = value as any;
                          updateLocalData({ assets: assets });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={asset.description}
                        onChange={(e) => {
                          const assets = [...(localFormData.assets || [])];
                          assets[index].description = e.target.value;
                          updateLocalData({ assets: assets });
                        }}
                        placeholder="2-bedroom apartment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Value (SAR)</Label>
                      <Input
                        type="number"
                        value={asset.estimatedValue}
                        onChange={(e) => {
                          const assets = [...(localFormData.assets || [])];
                          assets[index].estimatedValue = Number(e.target.value);
                          updateLocalData({ assets: assets });
                        }}
                        placeholder="500000"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => removeAsset(index)} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!localFormData.assets || localFormData.assets.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No assets added</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Legal Agreements & Consent</CardTitle>
                <CardDescription className="text-amber-700">
                  Please review and accept the following terms to complete your application
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="pdplConsent"
                  checked={localFormData.pdplConsent || false}
                  onCheckedChange={(checked) => updateLocalData({ pdplConsent: checked })}
                  className={errors.pdplConsent ? 'border-red-500' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="pdplConsent" className="text-sm font-medium">
                    Personal Data Protection Law (PDPL) Consent *
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to the collection, processing, and use of my personal data in accordance with Saudi Arabia's Personal Data Protection Law.
                  </p>
                  {errors.pdplConsent && (
                    <p className="text-sm text-red-600">{errors.pdplConsent}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="dataUsageConsent"
                  checked={localFormData.dataUsageConsent || false}
                  onCheckedChange={(checked) => updateLocalData({ dataUsageConsent: checked })}
                  className={errors.dataUsageConsent ? 'border-red-500' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="dataUsageConsent" className="text-sm font-medium">
                    Data Usage Agreement *
                  </Label>
                  <p className="text-sm text-gray-600">
                    I authorize the use of my data for credit assessment, risk evaluation, and lending decisions within the KSA Lending Nervous System.
                  </p>
                  {errors.dataUsageConsent && (
                    <p className="text-sm text-red-600">{errors.dataUsageConsent}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="creditBureauConsent"
                  checked={localFormData.creditBureauConsent || false}
                  onCheckedChange={(checked) => updateLocalData({ creditBureauConsent: checked })}
                  className={errors.creditBureauConsent ? 'border-red-500' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="creditBureauConsent" className="text-sm font-medium">
                    Credit Bureau Authorization *
                  </Label>
                  <p className="text-sm text-gray-600">
                    I authorize access to my credit information from SIMAH and other authorized credit bureaus for assessment purposes.
                  </p>
                  {errors.creditBureauConsent && (
                    <p className="text-sm text-red-600">{errors.creditBureauConsent}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="marketingConsent"
                  checked={localFormData.marketingConsent || false}
                  onCheckedChange={(checked) => updateLocalData({ marketingConsent: checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="marketingConsent" className="text-sm font-medium">
                    Marketing Communications (Optional)
                  </Label>
                  <p className="text-sm text-gray-600">
                    I consent to receive marketing communications about relevant financial products and services.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Secure & Compliant</h3>
                    <p className="text-sm text-green-700">
                      Your data is protected with bank-level security and SAMA compliance standards.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">
            Individual Onboarding
          </h1>
          <p className="text-emerald-700">
            Complete your profile to access personalized lending services
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${currentStep >= step.number 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                  }
                `}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-full h-1 mx-4 
                    ${currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center max-w-24">
                <div className="font-medium">{step.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round((currentStep / STEPS.length) * 100)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="mb-8">
          <CardHeader>
            {(() => {
              const StepIcon = STEPS[currentStep - 1]?.icon as React.ComponentType<{ className?: string }> | undefined;
              return (
                <CardTitle className="flex items-center gap-2">
                  {StepIcon ? (
                    <StepIcon className="w-5 h-5" />
                  ) : (
                    <span className="inline-block w-5 h-5" aria-hidden="true" />
                  )}
                  {STEPS[currentStep - 1].title}
                </CardTitle>
              );
            })()}
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentStep}/{STEPS.length}
            </Badge>
          </div>

          <Button 
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : currentStep === STEPS.length ? (
              'Submit Application'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}