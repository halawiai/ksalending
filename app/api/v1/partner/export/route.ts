import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const exportRequestSchema = z.object({
  partner_id: z.string(),
  format: z.enum(['pdf', 'excel']),
  data_type: z.string(),
  date_range: z.string(),
});

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  
  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const { partner_id, format, data_type, date_range } = exportRequestSchema.parse(body);

    // Check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'analyst'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generate export data based on type
    let exportData: any = {};
    
    switch (data_type) {
      case 'metrics':
        exportData = await generateMetricsExport(supabase, partner_id, date_range);
        break;
      case 'usage':
        exportData = await generateUsageExport(supabase, partner_id, date_range);
        break;
      case 'revenue':
        exportData = await generateRevenueExport(supabase, partner_id, date_range);
        break;
      default:
        exportData = await generateFullExport(supabase, partner_id, date_range);
    }

    // Generate file based on format
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'pdf') {
      fileBuffer = await generatePDFExport(exportData, data_type);
      contentType = 'application/pdf';
      filename = `partner-${data_type}-${Date.now()}.pdf`;
    } else {
      fileBuffer = await generateExcelExport(exportData, data_type);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `partner-${data_type}-${Date.now()}.xlsx`;
    }

    // Log export activity
    await supabase
      .from('api_audit_logs')
      .insert({
        partner_id,
        endpoint: '/api/v1/partner/export',
        method: 'POST',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        response_time: 0,
        request_data: { format, data_type, date_range },
      });

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Export failed' },
      { status: 500 }
    );
  }
}

async function generateMetricsExport(supabase: any, partnerId: string, dateRange: string) {
  const { data: metrics } = await supabase
    .from('partner_metrics')
    .select('*')
    .eq('partner_id', partnerId)
    .gte('created_at', getDateRangeStart(dateRange))
    .order('created_at', { ascending: false });

  return {
    title: 'Partner Metrics Report',
    data: metrics || [],
    summary: {
      totalRequests: metrics?.reduce((sum: number, m: any) => sum + m.total_requests, 0) || 0,
      successRate: metrics?.length > 0 ? 
        (metrics.reduce((sum: number, m: any) => sum + m.successful_requests, 0) / 
         metrics.reduce((sum: number, m: any) => sum + m.total_requests, 0)) * 100 : 0,
      averageResponseTime: metrics?.length > 0 ?
        metrics.reduce((sum: number, m: any) => sum + m.average_response_time, 0) / metrics.length : 0,
    },
  };
}

async function generateUsageExport(supabase: any, partnerId: string, dateRange: string) {
  const { data: usage } = await supabase
    .from('api_audit_logs')
    .select('*')
    .eq('partner_id', partnerId)
    .gte('created_at', getDateRangeStart(dateRange))
    .order('created_at', { ascending: false });

  return {
    title: 'API Usage Report',
    data: usage || [],
    summary: {
      totalCalls: usage?.length || 0,
      successfulCalls: usage?.filter((u: any) => u.status === 'success').length || 0,
      failedCalls: usage?.filter((u: any) => u.status !== 'success').length || 0,
    },
  };
}

async function generateRevenueExport(supabase: any, partnerId: string, dateRange: string) {
  // This would calculate actual revenue based on pricing and usage
  // For now, return mock data
  return {
    title: 'Revenue Report',
    data: [
      { month: 'January', revenue: 125000, assessments: 2500 },
      { month: 'February', revenue: 142000, assessments: 2840 },
      { month: 'March', revenue: 138000, assessments: 2760 },
    ],
    summary: {
      totalRevenue: 405000,
      totalAssessments: 8100,
      averageRevenuePerAssessment: 50,
    },
  };
}

async function generateFullExport(supabase: any, partnerId: string, dateRange: string) {
  const [metrics, usage, assessments] = await Promise.all([
    generateMetricsExport(supabase, partnerId, dateRange),
    generateUsageExport(supabase, partnerId, dateRange),
    supabase
      .from('assessments')
      .select('*')
      .eq('created_by', partnerId)
      .gte('created_at', getDateRangeStart(dateRange))
      .order('created_at', { ascending: false }),
  ]);

  return {
    title: 'Complete Partner Report',
    metrics: metrics.data,
    usage: usage.data,
    assessments: assessments.data || [],
    summary: {
      ...metrics.summary,
      ...usage.summary,
      totalAssessments: assessments.data?.length || 0,
    },
  };
}

async function generatePDFExport(data: any, dataType: string): Promise<Buffer> {
  // This would use a PDF generation library like puppeteer or jsPDF
  // For now, return a simple text buffer
  const content = `
    ${data.title}
    Generated: ${new Date().toISOString()}
    
    Summary:
    ${JSON.stringify(data.summary, null, 2)}
    
    Data:
    ${JSON.stringify(data.data, null, 2)}
  `;
  
  return Buffer.from(content, 'utf-8');
}

async function generateExcelExport(data: any, dataType: string): Promise<Buffer> {
  // This would use a library like exceljs to generate actual Excel files
  // For now, return CSV format as buffer
  const csvContent = [
    data.title,
    `Generated: ${new Date().toISOString()}`,
    '',
    'Summary:',
    Object.entries(data.summary).map(([key, value]) => `${key},${value}`).join('\n'),
    '',
    'Data:',
    // Convert data to CSV format
    data.data.length > 0 ? 
      [
        Object.keys(data.data[0]).join(','),
        ...data.data.map((row: any) => Object.values(row).join(','))
      ].join('\n') : 'No data available'
  ].join('\n');
  
  return Buffer.from(csvContent, 'utf-8');
}

function getDateRangeStart(range: string): string {
  const now = new Date();
  switch (range) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}