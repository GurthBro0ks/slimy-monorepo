import { getOpenAIClient } from '@/lib/openai-client';

export interface ClubAnalysisResult {
  id: string;
  timestamp: Date;
  imageUrl: string;
  analysis: {
    summary: string;
    metrics: {
      totalMembers?: number;
      activeMembers?: number;
      performanceScore?: number;
      [key: string]: any;
    };
    insights: string[];
    recommendations: string[];
  };
  confidence: number;
  rawResponse?: any;
}

export interface VisionAnalysisOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customPrompt?: string;
}

/**
 * Analyze a club/game screenshot using GPT-4 Vision
 */
export async function analyzeClubScreenshot(
  imageUrl: string,
  options: VisionAnalysisOptions = {}
): Promise<ClubAnalysisResult> {
  const openai = getOpenAIClient();

  const defaultPrompt = `Analyze this club/gaming screenshot and provide a comprehensive analysis including:

1. **Summary**: Brief overview of what the screenshot shows
2. **Metrics**: Extract quantifiable data like member counts, scores, performance indicators
3. **Insights**: Key observations about club performance, member activity, or trends
4. **Recommendations**: Actionable suggestions for improvement

Format your response as JSON with the following structure:
{
  "summary": "string",
  "metrics": {
    "totalMembers": number,
    "activeMembers": number,
    "performanceScore": number
  },
  "insights": ["string"],
  "recommendations": ["string"]
}`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: options.customPrompt || defaultPrompt
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

    return {
      id: generateAnalysisId(),
      timestamp: new Date(),
      imageUrl,
      analysis: {
        summary: parsedAnalysis.summary || 'Analysis completed',
        metrics: parsedAnalysis.metrics || {},
        insights: Array.isArray(parsedAnalysis.insights) ? parsedAnalysis.insights : [],
        recommendations: Array.isArray(parsedAnalysis.recommendations) ? parsedAnalysis.recommendations : []
      },
      confidence: calculateConfidence(parsedAnalysis),
      rawResponse: parsedAnalysis
    };
  } catch (error) {
    console.error('Error analyzing club screenshot:', error);
    throw new Error(`Failed to analyze screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze multiple club screenshots in batch
 */
export async function analyzeClubScreenshots(
  imageUrls: string[],
  options: VisionAnalysisOptions = {}
): Promise<ClubAnalysisResult[]> {
  const results: ClubAnalysisResult[] = [];

  // Process images sequentially to avoid rate limits
  for (const imageUrl of imageUrls) {
    try {
      const result = await analyzeClubScreenshot(imageUrl, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${imageUrl}:`, error);
      // Continue with other images even if one fails
    }
  }

  return results;
}


/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error validating image URL:', error);
    return false;
  }
}

/**
 * Generate a unique analysis ID
 */
export function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate confidence score based on analysis completeness
 */
export function calculateConfidence(analysis: any): number {
  let score = 0;
  let maxScore = 4;

  if (analysis.summary && analysis.summary.length > 10) score += 1;
  if (analysis.metrics && Object.keys(analysis.metrics).length > 0) score += 1;
  if (analysis.insights && Array.isArray(analysis.insights) && analysis.insights.length > 0) score += 1;
  if (analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0) score += 1;

  return score / maxScore;
}
