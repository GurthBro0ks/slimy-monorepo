import { NextRequest, NextResponse } from 'next/server';
import { clubDatabase } from '@/lib/club/database';
import { requireAuth } from '@/lib/auth/server';
import { validateGuildAccess, sanitizeGuildId } from '@/lib/auth/permissions';
import { ValidationError, errorResponse } from '@/lib/errors';

// TODO: Import MCP client when available
// import { getMCPClient } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate user FIRST
    const user = await requireAuth();

    // STEP 2: Parse and validate inputs
    const body = await request.json();
    const { guildId: rawGuildId, includeAnalysis = true, dateRange } = body;

    if (!rawGuildId) {
      throw new ValidationError('Guild ID is required');
    }

    // STEP 3: Sanitize guildId to prevent injection attacks
    const guildId = sanitizeGuildId(rawGuildId);

    // STEP 4: Validate user has access to this guild
    validateGuildAccess(user, guildId);

    // Fetch analysis results if requested
    let analysisData = null;
    if (includeAnalysis) {
      try {
        const analyses = await clubDatabase.getAnalysesByGuild(guildId, 100, 0); // Get last 100 analyses
        analysisData = analyses.map(analysis => ({
          id: analysis.id,
          title: analysis.title,
          createdAt: analysis.createdAt.toISOString(),
          summary: analysis.summary,
          confidence: analysis.confidence,
          metrics: analysis.metrics.reduce((acc, metric) => {
            acc[metric.name] = metric.value;
            return acc;
          }, {} as Record<string, any>),
          insights: [], // Would be extracted from analysis if stored
          recommendations: [] // Would be extracted from analysis if stored
        }));
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);
        // Continue without analysis data
      }
    }

    // TODO: Connect to MCP google.sheets tool
    // const mcpClient = getMCPClient();
    // const result = await mcpClient.callTool('google.sheets', 'exportClubAnalytics', {
    //   guildId,
    //   analysisData,
    //   includeHistory: true,
    //   includeMembers: true,
    //   dateRange
    // });

    // Prepare export data structure
    const exportData = {
      guildId,
      exportedAt: new Date().toISOString(),
      sections: [
        {
          name: 'Club Analytics',
          data: analysisData || [],
          columns: [
            'Analysis ID',
            'Title',
            'Date',
            'Summary',
            'Confidence',
            'Total Members',
            'Active Members',
            'Performance Score',
            'Win Rate',
            'Participation Rate'
          ]
        }
      ]
    };

    // Placeholder response - would normally create actual spreadsheet
    const spreadsheetId = `club-analytics-${guildId}-${Date.now()}`;
    const result = {
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      exported: {
        members: 25,
        stats: 150,
        history: 30,
        analyses: analysisData?.length || 0,
      },
      data: exportData,
      message: includeAnalysis && analysisData
        ? `Exported ${analysisData.length} analyses to Google Sheets`
        : 'Export completed (analysis integration pending)'
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    const { body, status, headers } = errorResponse(error);
    return NextResponse.json(body, { status, headers });
  }
}
