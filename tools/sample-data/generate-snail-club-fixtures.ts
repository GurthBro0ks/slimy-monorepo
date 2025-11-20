#!/usr/bin/env node
/**
 * Sample Data / Fixture Generator for Slimy.ai
 *
 * This script generates realistic mock data for local demos and testing.
 * It does NOT write to the database directly - it only creates JSON files.
 *
 * Usage:
 *   ts-node tools/sample-data/generate-snail-club-fixtures.ts
 *   or
 *   tsx tools/sample-data/generate-snail-club-fixtures.ts
 *
 * Output: JSON files written to tools/sample-data/output/
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Generate random integer between min (inclusive) and max (exclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

// ============================================================================
// TYPES (based on Prisma schema)
// ============================================================================

interface User {
  id: string;
  discordId: string;
  username: string;
  globalName: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Guild {
  id: string;
  discordId: string;
  name: string;
  settings: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface UserGuild {
  id: string;
  userId: string;
  guildId: string;
  roles: string[];
}

interface ClubAnalysis {
  id: string;
  guildId: string;
  userId: string;
  title: string | null;
  summary: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface ClubAnalysisImage {
  id: string;
  analysisId: string;
  imageUrl: string;
  originalName: string;
  fileSize: number;
  uploadedAt: string;
}

interface ClubMetric {
  id: string;
  analysisId: string;
  name: string;
  value: any;
  unit: string | null;
  category: string;
}

interface ScreenshotAnalysis {
  id: string;
  userId: string;
  screenshotType: string;
  imageUrl: string;
  title: string;
  description: string;
  summary: string;
  confidence: number;
  processingTime: number;
  modelUsed: string;
  rawResponse: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface ScreenshotData {
  id: string;
  analysisId: string;
  key: string;
  value: any;
  dataType: string;
  category: string;
  confidence: number | null;
}

interface ScreenshotTag {
  id: string;
  analysisId: string;
  tag: string;
  category: string | null;
}

interface ScreenshotInsight {
  id: string;
  analysisId: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  createdAt: string;
}

interface ScreenshotRecommendation {
  id: string;
  analysisId: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  actionable: boolean;
  createdAt: string;
}

interface Stat {
  id: string;
  userId: string | null;
  guildId: string | null;
  type: string;
  value: any;
  timestamp: string;
}

interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  conversationId: string | null;
  userId: string;
  guildId: string | null;
  text: string;
  adminOnly: boolean;
  createdAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a CUID-like ID (not cryptographically secure, just for fixtures)
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(12).toString('base64url');
  return `c${timestamp}${randomPart}`.slice(0, 25);
}

/**
 * Generate a Discord-like ID (18-19 digit snowflake)
 */
function generateDiscordId(): string {
  // Generate an 18-digit number as a string
  const timestamp = Date.now(); // 13 digits
  const randomPart = Math.floor(Math.random() * 100000); // 5 digits
  return `${timestamp}${String(randomPart).padStart(5, '0')}`;
}

/**
 * Random element from array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Random float between min and max
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random ISO timestamp within the last N days
 */
function randomTimestamp(daysAgo: number = 30): string {
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * daysAgo * msInDay;
  return new Date(now - randomMs).toISOString();
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): string {
  // Use path relative to current working directory
  const outputDir = path.join(process.cwd(), 'tools', 'sample-data', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Write fixture to JSON file
 */
function writeFixture(filename: string, data: any): void {
  const outputDir = ensureOutputDir();
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Generated ${filename} (${Array.isArray(data) ? data.length : 1} records)`);
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Mock user data
 */
const MOCK_USERNAMES = [
  'SpeedySnail42', 'TurboSlug', 'SlimeMaster99', 'ShellShock2k',
  'GlideKing', 'MucusTrail', 'SlowAndSteady', 'SnailRacer',
  'GooGuru', 'TrailBlazer88', 'SlimeTime', 'EscargotPro',
  'ShellyMcSnailface', 'NitroSlug', 'ClubChampion', 'MemberOne'
];

const MOCK_GLOBAL_NAMES = [
  'Speedy Snail', 'Turbo Slug', 'Slime Master', 'Shell Shock',
  'Glide King', 'Mucus Trail', 'Slow And Steady', 'Snail Racer',
  'Goo Guru', 'Trail Blazer', 'Slime Time', 'Escargot Pro',
  'Shelly McSnailface', 'Nitro Slug', 'Club Champion', 'Member One'
];

const MOCK_GUILD_NAMES = [
  'The Elite Snail Squad',
  'Slime Masters United',
  'Shell Shock Racing Team',
  'Turbo Slugs Guild',
  'Champions of the Trail',
  'The Goo Crew',
  'Speed Demons (Snail Edition)',
  'Escargot Excellence'
];

/**
 * Generate Users
 */
function generateUsers(count: number = 16): User[] {
  const users: User[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    const createdAt = randomTimestamp(90);
    users.push({
      id: generateCuid(),
      discordId: generateDiscordId(),
      username: MOCK_USERNAMES[i % MOCK_USERNAMES.length] + (i > MOCK_USERNAMES.length - 1 ? i : ''),
      globalName: MOCK_GLOBAL_NAMES[i % MOCK_GLOBAL_NAMES.length],
      avatar: `https://cdn.discordapp.com/avatars/${generateDiscordId()}/fake_avatar_hash_${i}.png`,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return users;
}

/**
 * Generate Guilds (Snail Clubs)
 */
function generateGuilds(count: number = 8): Guild[] {
  const guilds: Guild[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomTimestamp(180);
    guilds.push({
      id: generateCuid(),
      discordId: generateDiscordId(),
      name: MOCK_GUILD_NAMES[i % MOCK_GUILD_NAMES.length] + (i > MOCK_GUILD_NAMES.length - 1 ? ` ${i}` : ''),
      settings: {
        welcomeMessage: 'Welcome to the snail club! 🐌',
        autoRole: true,
        language: 'en',
        timezone: 'UTC',
        features: ['analytics', 'leaderboard', 'notifications']
      },
      createdAt,
      updatedAt: createdAt,
    });
  }

  return guilds;
}

/**
 * Generate UserGuild relationships (members in clubs)
 */
function generateUserGuilds(users: User[], guilds: Guild[]): UserGuild[] {
  const userGuilds: UserGuild[] = [];
  const roles = ['member', 'moderator', 'admin'];

  // Each user joins 1-3 random guilds
  for (const user of users) {
    const numGuilds = randomInt(1, 4); // 1-3 guilds
    const selectedGuilds = [...guilds]
      .sort(() => Math.random() - 0.5)
      .slice(0, numGuilds);

    for (const guild of selectedGuilds) {
      const userRoles = [roles[0]]; // Always a member

      // 20% chance to be moderator
      if (Math.random() < 0.2) {
        userRoles.push(roles[1]);
      }

      // 5% chance to be admin
      if (Math.random() < 0.05) {
        userRoles.push(roles[2]);
      }

      userGuilds.push({
        id: generateCuid(),
        userId: user.id,
        guildId: guild.id,
        roles: userRoles,
      });
    }
  }

  return userGuilds;
}

/**
 * Generate Club Analyses
 */
function generateClubAnalyses(
  guilds: Guild[],
  users: User[],
  count: number = 20
): { analyses: ClubAnalysis[]; images: ClubAnalysisImage[]; metrics: ClubMetric[] } {
  const analyses: ClubAnalysis[] = [];
  const images: ClubAnalysisImage[] = [];
  const metrics: ClubMetric[] = [];

  const titles = [
    'Weekly Performance Review',
    'Member Activity Analysis',
    'Competition Results',
    'Training Session Stats',
    'Monthly Club Report',
    null, // Some analyses have no title
  ];

  const summaries = [
    'The club shows strong performance this week with increased member participation.',
    'Member activity has been steady with notable improvements in core metrics.',
    'Competition results indicate excellent team coordination and individual skill.',
    'Training sessions have yielded positive results across all performance categories.',
    'Overall club health is excellent with high engagement and performance scores.',
    'Analysis reveals opportunities for improvement in member retention and activity.',
  ];

  for (let i = 0; i < count; i++) {
    const guild = pickRandom(guilds);
    const user = pickRandom(users);
    const createdAt = randomTimestamp(60);

    const analysis: ClubAnalysis = {
      id: generateCuid(),
      guildId: guild.id,
      userId: user.id,
      title: pickRandom(titles),
      summary: pickRandom(summaries),
      confidence: randomFloat(0.7, 0.99),
      createdAt,
      updatedAt: createdAt,
    };

    analyses.push(analysis);

    // Generate 1-3 images per analysis
    const numImages = randomInt(1, 4);
    for (let j = 0; j < numImages; j++) {
      images.push({
        id: generateCuid(),
        analysisId: analysis.id,
        imageUrl: `https://fake-cdn.slimy.ai/uploads/club-analysis/${analysis.id}/image_${j}.png`,
        originalName: `screenshot_${Date.now()}_${j}.png`,
        fileSize: randomInt(100000, 5000000), // 100KB - 5MB
        uploadedAt: createdAt,
      });
    }

    // Generate metrics for this analysis
    const metricConfigs = [
      { name: 'totalMembers', value: randomInt(10, 500), unit: 'count', category: 'membership' },
      { name: 'activeMembers', value: randomInt(5, 200), unit: 'count', category: 'membership' },
      { name: 'performanceScore', value: randomFloat(60, 100), unit: 'score', category: 'performance' },
      { name: 'winRate', value: randomFloat(0.3, 0.9), unit: 'percentage', category: 'performance' },
      { name: 'participationRate', value: randomFloat(0.4, 0.95), unit: 'percentage', category: 'activity' },
      { name: 'averageSessionTime', value: randomInt(30, 180), unit: 'minutes', category: 'activity' },
      { name: 'competitionRank', value: randomInt(1, 100), unit: 'rank', category: 'performance' },
    ];

    // Pick 4-6 random metrics
    const selectedMetrics = [...metricConfigs]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(4, 7));

    for (const metricConfig of selectedMetrics) {
      metrics.push({
        id: generateCuid(),
        analysisId: analysis.id,
        name: metricConfig.name,
        value: metricConfig.value,
        unit: metricConfig.unit,
        category: metricConfig.category,
      });
    }
  }

  return { analyses, images, metrics };
}

/**
 * Generate Screenshot Analyses
 */
function generateScreenshotAnalyses(
  users: User[],
  count: number = 15
): {
  analyses: ScreenshotAnalysis[];
  data: ScreenshotData[];
  tags: ScreenshotTag[];
  insights: ScreenshotInsight[];
  recommendations: ScreenshotRecommendation[];
} {
  const analyses: ScreenshotAnalysis[] = [];
  const data: ScreenshotData[] = [];
  const tags: ScreenshotTag[] = [];
  const insights: ScreenshotInsight[] = [];
  const recommendations: ScreenshotRecommendation[] = [];

  const screenshotTypes = ['game-stats', 'leaderboard', 'achievement', 'performance-metrics'];
  const models = ['gpt-4-vision', 'claude-3-opus', 'gemini-pro-vision'];

  for (let i = 0; i < count; i++) {
    const user = pickRandom(users);
    const screenshotType = pickRandom(screenshotTypes);
    const createdAt = randomTimestamp(45);

    const analysis: ScreenshotAnalysis = {
      id: generateCuid(),
      userId: user.id,
      screenshotType,
      imageUrl: `https://fake-cdn.slimy.ai/uploads/screenshots/${user.id}/screenshot_${i}.png`,
      title: `${screenshotType.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} Analysis`,
      description: `Automated analysis of ${screenshotType} screenshot`,
      summary: `This screenshot shows ${screenshotType} with overall positive performance indicators.`,
      confidence: randomFloat(0.75, 0.98),
      processingTime: randomInt(500, 3000), // 0.5-3 seconds
      modelUsed: pickRandom(models),
      rawResponse: {
        status: 'success',
        processingSteps: ['image_validation', 'ocr_extraction', 'analysis', 'metrics_calculation'],
      },
      createdAt,
      updatedAt: createdAt,
    };

    analyses.push(analysis);

    // Generate screenshot data points
    const dataPoints = [
      { key: 'level', value: randomInt(1, 100), dataType: 'number', category: 'stats', confidence: 0.95 },
      { key: 'score', value: randomInt(1000, 999999), dataType: 'number', category: 'stats', confidence: 0.92 },
      { key: 'rank', value: randomInt(1, 1000), dataType: 'number', category: 'stats', confidence: 0.88 },
      { key: 'username', value: user.username, dataType: 'string', category: 'metadata', confidence: 0.99 },
      { key: 'timestamp', value: createdAt, dataType: 'string', category: 'metadata', confidence: 0.97 },
    ];

    for (const point of dataPoints.slice(0, randomInt(3, 6))) {
      data.push({
        id: generateCuid(),
        analysisId: analysis.id,
        ...point,
      });
    }

    // Generate tags
    const availableTags = ['high-performance', 'leaderboard-top-10', 'achievement-unlocked', 'personal-best', 'improvement'];
    const selectedTags = [...availableTags]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(2, 4));

    for (const tag of selectedTags) {
      tags.push({
        id: generateCuid(),
        analysisId: analysis.id,
        tag,
        category: 'content',
      });
    }

    // Generate insights
    const insightTemplates = [
      { type: 'performance', priority: 'high', title: 'Strong Performance Trend', description: 'Your performance has improved by 15% over the last week.' },
      { type: 'ui', priority: 'medium', title: 'Interface Analysis', description: 'UI elements indicate active engagement with all features.' },
      { type: 'content', priority: 'low', title: 'Content Quality', description: 'Screenshot quality is excellent for accurate analysis.' },
    ];

    for (const template of insightTemplates.slice(0, randomInt(1, 3))) {
      insights.push({
        id: generateCuid(),
        analysisId: analysis.id,
        type: template.type,
        priority: template.priority,
        title: template.title,
        description: template.description,
        confidence: randomFloat(0.7, 0.95),
        actionable: Math.random() > 0.5,
        createdAt,
      });
    }

    // Generate recommendations
    const recommendationTemplates = [
      { type: 'improvement', priority: 'high', title: 'Focus on Consistency', description: 'Maintain this performance level for optimal results.', impact: 'high', effort: 'low' },
      { type: 'optimization', priority: 'medium', title: 'Optimize Play Time', description: 'Consider playing during peak hours for better matchmaking.', impact: 'medium', effort: 'medium' },
      { type: 'feature', priority: 'low', title: 'Explore New Features', description: 'Try the new training mode to further improve skills.', impact: 'medium', effort: 'low' },
    ];

    for (const template of recommendationTemplates.slice(0, randomInt(1, 3))) {
      recommendations.push({
        id: generateCuid(),
        analysisId: analysis.id,
        type: template.type,
        priority: template.priority,
        title: template.title,
        description: template.description,
        impact: template.impact,
        effort: template.effort,
        actionable: true,
        createdAt,
      });
    }
  }

  return { analyses, data, tags, insights, recommendations };
}

/**
 * Generate Stats
 */
function generateStats(users: User[], guilds: Guild[], count: number = 50): Stat[] {
  const stats: Stat[] = [];
  const statTypes = [
    'message_count',
    'command_usage',
    'session_duration',
    'achievement_unlocked',
    'level_up',
    'competition_joined',
  ];

  for (let i = 0; i < count; i++) {
    const type = pickRandom(statTypes);
    const isUserStat = Math.random() > 0.3;

    stats.push({
      id: generateCuid(),
      userId: isUserStat ? pickRandom(users).id : null,
      guildId: !isUserStat ? pickRandom(guilds).id : null,
      type,
      value: type.includes('count') ? randomInt(1, 1000) : randomFloat(1, 100),
      timestamp: randomTimestamp(30),
    });
  }

  return stats;
}

/**
 * Generate Conversations and Chat Messages
 */
function generateConversationsAndMessages(
  users: User[],
  guilds: Guild[]
): { conversations: Conversation[]; messages: ChatMessage[] } {
  const conversations: Conversation[] = [];
  const messages: ChatMessage[] = [];

  const conversationTitles = [
    'Strategy Discussion',
    'Team Planning',
    'General Chat',
    'Help & Support',
    null,
  ];

  const messageTexts = [
    'Hey everyone! How are the races going today?',
    'Looking for tips on improving my speed stats.',
    'Just unlocked a new achievement! 🎉',
    'Anyone want to team up for the competition?',
    'The new update looks amazing!',
    'Thanks for the help, really appreciate it!',
    'What time is the next club event?',
    'My performance has been improving lately.',
  ];

  // Generate 10 conversations
  for (let i = 0; i < 10; i++) {
    const user = pickRandom(users);
    const createdAt = randomTimestamp(20);

    const conversation: Conversation = {
      id: generateCuid(),
      userId: user.id,
      title: pickRandom(conversationTitles),
      createdAt,
      updatedAt: createdAt,
    };

    conversations.push(conversation);

    // Generate 3-8 messages per conversation
    const numMessages = randomInt(3, 9);
    for (let j = 0; j < numMessages; j++) {
      const messageUser = pickRandom(users);
      const guild = Math.random() > 0.5 ? pickRandom(guilds) : null;

      messages.push({
        id: generateCuid(),
        conversationId: conversation.id,
        userId: messageUser.id,
        guildId: guild?.id || null,
        text: pickRandom(messageTexts),
        adminOnly: Math.random() < 0.1, // 10% admin-only
        createdAt: randomTimestamp(19),
      });
    }
  }

  return { conversations, messages };
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function main() {
  console.log('🐌 Generating Slimy.ai Sample Data Fixtures...\n');

  // Generate core entities
  console.log('Generating core entities...');
  const users = generateUsers(16);
  const guilds = generateGuilds(8);
  const userGuilds = generateUserGuilds(users, guilds);

  writeFixture('users.json', users);
  writeFixture('guilds.json', guilds);
  writeFixture('user-guilds.json', userGuilds);

  // Generate club analyses
  console.log('\nGenerating club analyses...');
  const { analyses, images, metrics } = generateClubAnalyses(guilds, users, 20);

  writeFixture('club-analyses.json', analyses);
  writeFixture('club-analysis-images.json', images);
  writeFixture('club-metrics.json', metrics);

  // Generate screenshot analyses
  console.log('\nGenerating screenshot analyses...');
  const {
    analyses: screenshots,
    data: screenshotData,
    tags: screenshotTags,
    insights: screenshotInsights,
    recommendations: screenshotRecommendations,
  } = generateScreenshotAnalyses(users, 15);

  writeFixture('screenshot-analyses.json', screenshots);
  writeFixture('screenshot-data.json', screenshotData);
  writeFixture('screenshot-tags.json', screenshotTags);
  writeFixture('screenshot-insights.json', screenshotInsights);
  writeFixture('screenshot-recommendations.json', screenshotRecommendations);

  // Generate stats
  console.log('\nGenerating statistics...');
  const stats = generateStats(users, guilds, 50);
  writeFixture('stats.json', stats);

  // Generate conversations and messages
  console.log('\nGenerating conversations and messages...');
  const { conversations, messages } = generateConversationsAndMessages(users, guilds);
  writeFixture('conversations.json', conversations);
  writeFixture('chat-messages.json', messages);

  console.log('\n✨ All fixtures generated successfully!');
  console.log(`📁 Output directory: ${path.join(process.cwd(), 'tools', 'sample-data', 'output')}`);
  console.log('\n📊 Summary:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${guilds.length} guilds (clubs)`);
  console.log(`   - ${userGuilds.length} user-guild relationships`);
  console.log(`   - ${analyses.length} club analyses (${images.length} images, ${metrics.length} metrics)`);
  console.log(`   - ${screenshots.length} screenshot analyses (${screenshotData.length} data points, ${screenshotTags.length} tags)`);
  console.log(`   - ${screenshotInsights.length} insights, ${screenshotRecommendations.length} recommendations`);
  console.log(`   - ${stats.length} stats`);
  console.log(`   - ${conversations.length} conversations (${messages.length} messages)`);
}

// Run the script
main();
