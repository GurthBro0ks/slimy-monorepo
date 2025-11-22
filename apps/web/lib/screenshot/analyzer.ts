import { getOpenAIClient } from '@/lib/openai-client';

export type ScreenshotType =
  | 'game-stats'
  | 'leaderboard'
  | 'profile'
  | 'achievement'
  | 'inventory'
  | 'clan-guild'
  | 'performance'
  | 'social'
  | 'custom';

export interface ScreenshotAnalysisResult {
  id: string;
  screenshotType: ScreenshotType;
  timestamp: Date;
  imageUrl: string;
  analysis: {
    title: string;
    description: string;
    summary: string;
    data: Record<string, any>;
    insights: string[];
    recommendations: string[];
    tags: string[];
  };
  metadata: {
    confidence: number;
    processingTime: number;
    modelUsed: string;
    extractedText?: string;
    dominantColors?: string[];
    detectedElements?: string[];
  };
  rawResponse?: any;
}

export interface ScreenshotAnalysisOptions {
  type?: ScreenshotType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customPrompt?: string;
  extractText?: boolean;
  detectElements?: boolean;
  analyzeColors?: boolean;
}

// Analysis templates for different screenshot types
const ANALYSIS_TEMPLATES: Record<ScreenshotType, string> = {
  'game-stats': `Analyze this gaming statistics screenshot and extract:
1. Player stats (level, XP, rank, etc.)
2. Performance metrics (wins/losses, K/D ratio, accuracy, etc.)
3. Game-specific data (weapons, abilities, achievements)
4. Progress indicators and trends

Format as JSON with: title, description, summary, data object, insights array, recommendations array, tags array.`,

  'leaderboard': `Analyze this leaderboard or ranking screenshot and extract:
1. Player rankings and positions
2. Score comparisons and gaps
3. Top performers and their stats
4. Competition level indicators

Format as JSON with ranking data, competitive insights, and performance analysis.`,

  'profile': `Analyze this player profile screenshot and extract:
1. Profile information (username, avatar, level)
2. Statistics and achievements
3. Equipment and customization
4. Social connections and reputation

Format as JSON with profile summary and key metrics.`,

  'achievement': `Analyze this achievements/trophies screenshot and extract:
1. Completed achievements and rewards
2. Progress on locked achievements
3. Achievement categories and rarities
4. Completion statistics and streaks

Format as JSON with achievement tracking and progress analysis.`,

  'inventory': `Analyze this inventory/equipment screenshot and extract:
1. Items and their properties
2. Equipment loadout and stats
3. Inventory organization and value
4. Missing items or upgrades needed

Format as JSON with inventory assessment and optimization suggestions.`,

  'clan-guild': `Analyze this clan/guild screenshot and extract:
1. Member information and roles
2. Clan statistics and performance
3. Recruitment status and requirements
4. Clan events and activities

Format as JSON with clan analysis and management insights.`,

  'performance': `Analyze this performance metrics screenshot and extract:
1. FPS, latency, and technical stats
2. Performance graphs and trends
3. System resource usage
4. Optimization opportunities

Format as JSON with performance diagnosis and improvement recommendations.`,

  'social': `Analyze this social features screenshot and extract:
1. Friend lists and connections
2. Social activities and events
3. Communication patterns
4. Community engagement metrics

Format as JSON with social analysis and networking insights.`,

  'custom': `Analyze this screenshot using general computer vision and extract:
1. Main content and purpose
2. Key visual elements and text
3. Data patterns and structures
4. Notable features and anomalies

Format as JSON with comprehensive analysis and observations.`
};

/**
 * Analyze a screenshot using GPT-4 Vision with configurable templates
 */
export async function analyzeScreenshot(
  imageUrl: string,
  options: ScreenshotAnalysisOptions = {}
): Promise<ScreenshotAnalysisResult> {
  const openai = getOpenAIClient();
  const screenshotType = options.type || 'custom';
  const startTime = Date.now();

  const prompt = options.customPrompt || ANALYSIS_TEMPLATES[screenshotType];

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are analyzing a ${screenshotType} screenshot. ${prompt}

Additional analysis options:
${options.extractText ? '- Extract and include any readable text' : ''}
${options.detectElements ? '- Detect and describe UI elements, buttons, and interactive components' : ''}
${options.analyzeColors ? '- Analyze color scheme and dominant colors' : ''}

Respond with valid JSON in this exact format:
{
  "title": "Brief descriptive title",
  "description": "What this screenshot shows",
  "summary": "Key findings and overview",
  "data": { "key": "value pairs of extracted data" },
  "insights": ["Array of key observations"],
  "recommendations": ["Array of actionable suggestions"],
  "tags": ["Array of relevant tags"]
}`
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high'
          }
        }
      ]
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4-vision-preview',
      messages: messages as any,
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from GPT-4 Vision');
    }

    const parsedAnalysis = JSON.parse(content);
    const processingTime = Date.now() - startTime;

    return {
      id: generateScreenshotId(),
      screenshotType,
      timestamp: new Date(),
      imageUrl,
      analysis: {
        title: parsedAnalysis.title || 'Screenshot Analysis',
        description: parsedAnalysis.description || '',
        summary: parsedAnalysis.summary || 'Analysis completed',
        data: parsedAnalysis.data || {},
        insights: Array.isArray(parsedAnalysis.insights) ? parsedAnalysis.insights : [],
        recommendations: Array.isArray(parsedAnalysis.recommendations) ? parsedAnalysis.recommendations : [],
        tags: Array.isArray(parsedAnalysis.tags) ? parsedAnalysis.tags : []
      },
      metadata: {
        confidence: calculateConfidence(parsedAnalysis),
        processingTime,
        modelUsed: options.model || 'gpt-4-vision-preview'
      },
      rawResponse: parsedAnalysis
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw new Error(`Failed to analyze screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze multiple screenshots in batch
 */
export async function analyzeScreenshots(
  imageUrls: string[],
  options: ScreenshotAnalysisOptions = {}
): Promise<ScreenshotAnalysisResult[]> {
  const results: ScreenshotAnalysisResult[] = [];

  // Process screenshots sequentially to avoid rate limits
  for (const imageUrl of imageUrls) {
    try {
      const result = await analyzeScreenshot(imageUrl, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${imageUrl}:`, error);
      // Continue with other screenshots even if one fails
    }
  }

  return results;
}

/**
 * Compare two screenshot analyses
 */
export function compareScreenshotAnalyses(
  analysis1: ScreenshotAnalysisResult,
  analysis2: ScreenshotAnalysisResult
): {
  differences: Record<string, { before: any; after: any; change?: string }>;
  insights: string[];
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
} {
  const differences: Record<string, { before: any; after: any; change?: string }> = {};
  const insights: string[] = [];

  // Compare data fields
  const allKeys = new Set([...Object.keys(analysis1.analysis.data), ...Object.keys(analysis2.analysis.data)]);

  for (const key of allKeys) {
    const value1 = analysis1.analysis.data[key];
    const value2 = analysis2.analysis.data[key];

    if (value1 !== value2) {
      differences[key] = { before: value1, after: value2 };

      // Calculate change for numeric values
      if (typeof value1 === 'number' && typeof value2 === 'number') {
        const change = value2 - value1;
        const percentChange = value1 !== 0 ? (change / Math.abs(value1)) * 100 : 0;
        differences[key].change = `${change > 0 ? '+' : ''}${change} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`;
      }
    }
  }

  // Generate insights based on differences
  const numericChanges = Object.entries(differences)
    .filter(([_, diff]) => typeof diff.before === 'number' && typeof diff.after === 'number');

  if (numericChanges.length > 0) {
    const improvements = numericChanges.filter(([_, diff]) => (diff.after as number) > (diff.before as number)).length;
    const declines = numericChanges.filter(([_, diff]) => (diff.after as number) < (diff.before as number)).length;

    if (improvements > declines) {
      insights.push('Overall positive trend detected with more improvements than declines');
    } else if (declines > improvements) {
      insights.push('Overall negative trend detected with more declines than improvements');
    } else {
      insights.push('Mixed results with equal improvements and declines');
    }
  }

  // Determine overall trend
  let trend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown';

  if (numericChanges.length > 0) {
    const avgChange = numericChanges.reduce((sum, [_, diff]) => {
      const change = (diff.after as number) - (diff.before as number);
      return sum + change;
    }, 0) / numericChanges.length;

    if (avgChange > 0.1) trend = 'improving';
    else if (avgChange < -0.1) trend = 'declining';
    else trend = 'stable';
  }

  return { differences, insights, trend };
}

/**
 * Generate a unique screenshot analysis ID
 */
export function generateScreenshotId(): string {
  return `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate confidence score based on analysis completeness
 */
export function calculateConfidence(analysis: any): number {
  let score = 0;
  const maxScore = 7; // title, description, summary, data, insights, recommendations, tags

  if (analysis.title && analysis.title.length > 3) score += 1;
  if (analysis.description && analysis.description.length > 10) score += 1;
  if (analysis.summary && analysis.summary.length > 10) score += 1;
  if (analysis.data && Object.keys(analysis.data).length > 0) score += 1;
  if (analysis.insights && Array.isArray(analysis.insights) && analysis.insights.length > 0) score += 1;
  if (analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0) score += 1;
  if (analysis.tags && Array.isArray(analysis.tags) && analysis.tags.length > 0) score += 1;

  return Math.min(score / maxScore, 1.0);
}

/**
 * Get supported screenshot types
 */
export function getSupportedScreenshotTypes(): ScreenshotType[] {
  return Object.keys(ANALYSIS_TEMPLATES) as ScreenshotType[];
}

/**
 * Validate screenshot type
 */
export function isValidScreenshotType(type: string): type is ScreenshotType {
  return type in ANALYSIS_TEMPLATES;
}

/**
 * Ensure a provided URL looks like a fetchable image before processing
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const response = await fetch(parsed.toString(), { method: 'HEAD' });
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : true;
  } catch (error) {
    console.error('Failed to validate image URL:', error);
    return false;
  }
}
