import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface StructuredRequirement {
  title: string;
  laptops?: number;
  desktops?: number;
  projectors?: number;
  chairs?: number;
  tables?: number;
  microphones?: number;
  cameras?: number;
  rooms?: number;
  classrooms?: number;
  arduinoKits?: number;
  participants?: number;
  duration?: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
  otherItems?: Array<{ name: string; quantity: number }>;
  estimatedCost?: number;
  needDate?: string;
}

export interface MatchExplanation {
  reason: string;
  strengths: string[];
  caveats: string[];
}

export interface AIInsight {
  type: 'opportunity' | 'warning' | 'tip';
  title: string;
  description: string;
  potentialSavings?: number;
  resourceCount?: number;
  action?: string;
}

// Rule-based requirement extraction fallback
function extractRequirementsFallback(input: string): StructuredRequirement {
  const text = input.toLowerCase();
  const result: StructuredRequirement = {
    title: 'Resource Requirement',
    purpose: extractPurpose(text),
    otherItems: [],
  };

  const patterns: Record<string, RegExp[]> = {
    laptops: [/(\d+)\s+laptop/i, /laptop[s]?\s+[x×]?\s*(\d+)/i],
    desktops: [/(\d+)\s+desktop/i, /pc[s]?\s+[x×]?\s*(\d+)/i],
    projectors: [/(\d+)\s+projector/i, /projector[s]?\s+[x×]?\s*(\d+)/i],
    chairs: [/(\d+)\s+chair/i, /seating\s+for\s+(\d+)/i, /(\d+)\s+seat/i],
    tables: [/(\d+)\s+table/i, /(\d+)\s+desk/i],
    microphones: [/(\d+)\s+mic/i, /(\d+)\s+microphone/i],
    cameras: [/(\d+)\s+camera/i, /(\d+)\s+dslr/i],
    arduinoKits: [/(\d+)\s+arduino/i, /arduino\s+[x×]?\s*(\d+)/i],
    participants: [/(\d+)\s+participant/i, /(\d+)\s+person/i, /(\d+)\s+people/i, /for\s+(\d+)/i],
    rooms: [/(\d+)\s+room/i, /(\d+)\s+hall/i, /(\d+)\s+studio/i],
    classrooms: [/(\d+)\s+classroom/i, /(\d+)\s+lab/i],
  };

  for (const [key, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const match = text.match(regex);
      if (match) {
        (result as any)[key] = parseInt(match[1] || match[2]);
        break;
      }
    }
  }

  // Catch generic items like "3 vr headsets" or "2 3d printers" or "5 oscilloscopes"
  const genericMatch = text.match(/(\d+)\s+([a-z0-9\s]{3,20})(?:,|\.|$|and)/g);
  if (genericMatch) {
    for (const itemStr of genericMatch) {
      const m = itemStr.match(/(\d+)\s+([a-z0-9\s]{3,20})/);
      if (m) {
        const qty = parseInt(m[1]);
        const name = m[2].trim();
        const recognized = ['laptop', 'projector', 'chair', 'table', 'mic', 'camera', 'arduino', 'room', 'classroom', 'participant', 'people'];
        if (!recognized.some(r => name.includes(r)) && qty > 0) {
          result.otherItems?.push({ name, quantity: qty });
        }
      }
    }
  }

  if (result.participants && !result.rooms && !result.classrooms) {
    result.classrooms = 1;
  }

  const purposes = ['workshop', 'seminar', 'exhibition', 'event', 'training', 'conference', 'hackathon', 'symposium', 'lecture', 'meeting', 'lab'];
  for (const p of purposes) {
    if (text.includes(p)) {
      result.title = `${capitalize(p)} — ${result.participants ? result.participants + ' participants' : 'event'}`;
      break;
    }
  }
  if (result.title === 'Resource Requirement' && result.purpose) {
    result.title = `${capitalize(result.purpose)} Requirement`;
  }

  // Filter out non-physical items like students, participants, people from otherItems
  const NON_RESOURCE_WORDS = ['student', 'students', 'people', 'person', 'participant', 'participants', 'developer', 'developers', 'attendee', 'attendees', 'user', 'users', 'guest', 'guests', 'audience', 'human', 'humans'];
  
  if (result.otherItems) {
    result.otherItems = result.otherItems.filter(item => {
      const lower = item.name.toLowerCase();
      return !NON_RESOURCE_WORDS.some(w => lower.includes(w));
    });
  }

  return result;
}

function extractPurpose(text: string): string {
  const purposes = ['workshop', 'seminar', 'exhibition', 'training', 'conference', 'hackathon', 'symposium', 'event', 'lecture', 'meeting', 'lab'];
  for (const p of purposes) {
    if (text.includes(p)) return p;
  }
  return 'event';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function extractRequirements(input: string): Promise<StructuredRequirement> {
  if (!genAI) {
    return extractRequirementsFallback(input);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Extract structured resource requirements from this user request. 
CRITICAL RULE: "otherItems" must ONLY contain physical hardware, tools, cameras, headsets, lights, podcast rigs, furniture, equipment, or physical spaces. 
NEVER put people, students, participants, attendees, or developers into "otherItems"! Put human headcount ONLY into the "participants" field.

Return ONLY a JSON object:
{
  "title": "specific descriptive title e.g. XR & Spatial Audio Workshop Requirements",
  "laptops": number or null,
  "desktops": number or null,
  "projectors": number or null,
  "chairs": number or null,
  "tables": number or null,
  "microphones": number or null,
  "cameras": number or null,
  "rooms": number or null,
  "classrooms": number or null,
  "arduinoKits": number or null,
  "participants": number or null (e.g. headcount of students/people),
  "duration": "duration string e.g. 4 hours or null",
  "purpose": "purpose string e.g. workshop",
  "startTime": "HH:MM or null",
  "endTime": "HH:MM or null",
  "needDate": "YYYY-MM-DD or null",
  "estimatedCost": estimated purchase cost in INR (number) if bought new,
  "otherItems": [{"name": "physical item name e.g. VR headsets, podcast rigs, studio light panels", "quantity": number}]
}

User Input: "${input}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(text);

    // Sanitize parsed output to remove non-resource items from otherItems
    const NON_RESOURCE_WORDS = ['student', 'students', 'people', 'person', 'participant', 'participants', 'developer', 'developers', 'attendee', 'attendees', 'user', 'users', 'guest', 'guests', 'audience', 'human', 'humans'];
    if (parsed.otherItems && Array.isArray(parsed.otherItems)) {
      parsed.otherItems = parsed.otherItems.filter((item: any) => {
        if (!item || !item.name) return false;
        const lower = item.name.toLowerCase();
        return !NON_RESOURCE_WORDS.some(w => lower.includes(w));
      });
    }

    return parsed;
  } catch (e) {
    console.error('AI extraction failed, using fallback:', e);
    return extractRequirementsFallback(input);
  }
}

export async function generateMatchExplanation(
  resourceName: string,
  resourceDesc: string,
  requirementTitle: string,
  matchScore: number
): Promise<MatchExplanation> {
  if (!genAI) {
    return {
      reason: `${resourceName} matches your requirement with ${Math.round(matchScore)}% compatibility based on specifications, condition, and availability.`,
      strengths: ['Available during requested period', 'Matches required specifications', 'High asset condition'],
      caveats: matchScore < 90 ? ['Location transfer across departments required'] : [],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Explain why a resource matches a user's requirement.
Resource: ${resourceName} (${resourceDesc})
Requirement: ${requirementTitle}
Match Score: ${Math.round(matchScore)}%

Return ONLY valid JSON:
{
  "reason": "1-2 sentences explaining why this resource is an ideal match",
  "strengths": ["key strength 1", "key strength 2"],
  "caveats": ["caveat if matchScore < 90, otherwise empty array"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return {
      reason: `${resourceName} is an available match for ${requirementTitle} with ${Math.round(matchScore)}% compatibility score.`,
      strengths: ['Available during requested period', 'Verified asset condition'],
      caveats: [],
    };
  }
}

// Dynamic, DB-Grounded Insights (strictly based on actual DB assets, no hallucinations!)
export async function generateGroundedInsights(
  resources: Array<{
    name: string;
    category: string;
    quantity: number;
    status: string;
    estimatedValue: number;
    department: { name: string };
  }>
): Promise<AIInsight[]> {
  if (!resources || resources.length === 0) {
    return [];
  }

  // Calculate actual DB statistics
  const availableResources = resources.filter(r => r.status === 'AVAILABLE');
  
  // Group available assets by category
  const categoryCounts: Record<string, { count: number; totalValue: number; items: string[] }> = {};
  for (const r of availableResources) {
    if (!categoryCounts[r.category]) {
      categoryCounts[r.category] = { count: 0, totalValue: 0, items: [] };
    }
    categoryCounts[r.category].count += r.quantity;
    categoryCounts[r.category].totalValue += r.estimatedValue * r.quantity;
    if (!categoryCounts[r.category].items.includes(r.name)) {
      categoryCounts[r.category].items.push(r.name);
    }
  }

  const insights: AIInsight[] = [];

  // Insight 1: Highest available category opportunity
  const categoriesSorted = Object.entries(categoryCounts).sort((a, b) => b[1].totalValue - a[1].totalValue);
  if (categoriesSorted.length > 0) {
    const [topCat, topData] = categoriesSorted[0];
    insights.push({
      type: 'opportunity',
      title: `${topData.count} ${topCat.toLowerCase()} items available across departments`,
      description: `High inventory in ${topCat} (${topData.items.slice(0, 3).join(', ')}) with total value of ₹${(topData.totalValue / 1000).toFixed(0)}K ready for internal reuse.`,
      potentialSavings: topData.totalValue,
      resourceCount: topData.count,
      action: 'EXPLORE RESOURCES',
    });
  }

  // Insight 2: High value idle asset highlight
  const highValueAssets = availableResources.filter(r => r.estimatedValue >= 20000);
  if (highValueAssets.length > 0) {
    const asset = highValueAssets[0];
    insights.push({
      type: 'opportunity',
      title: `${asset.name} (${asset.quantity} units) available at ${asset.department.name}`,
      description: `High-value asset (₹${(asset.estimatedValue / 1000).toFixed(0)}K unit value) is currently available for inter-departmental allocation.`,
      potentialSavings: asset.estimatedValue * asset.quantity,
      resourceCount: asset.quantity,
      action: 'FIND MATCHING NEED',
    });
  }

  // Insight 3: Underutilized capacity/space assets
  const spaceOrCapacity = availableResources.filter(r => r.category === 'Space' || r.category === 'Capacity');
  if (spaceOrCapacity.length > 0) {
    const space = spaceOrCapacity[0];
    insights.push({
      type: 'tip',
      title: `${space.name} unbooked for upcoming schedule`,
      description: `Located at ${space.department.name}. Scheduling this existing facility avoids renting external venues.`,
      potentialSavings: space.estimatedValue,
      resourceCount: space.quantity,
      action: 'RESERVE FACILITY',
    });
  }

  // If Gemini API key is available, enhance insights with LLM synthesis grounded in actual stats
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Given this REAL database inventory data of an organization:
Total Available Assets: ${availableResources.length}
Categories Breakdown: ${JSON.stringify(Object.fromEntries(categoriesSorted.slice(0, 4)))}

Generate 3 actionable, grounded AI insights. DO NOT invent fake numbers outside this data. Return ONLY valid JSON array:
[
  {
    "type": "opportunity",
    "title": "short title referencing actual assets",
    "description": "1-2 sentence insight strictly grounded in the database counts provided",
    "potentialSavings": estimated potential savings in INR (number),
    "resourceCount": number of resources involved,
    "action": "ACTION BUTTON TEXT"
  }
]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json\n?|```/g, '').trim();
      const aiInsights = JSON.parse(text);
      if (Array.isArray(aiInsights) && aiInsights.length > 0) {
        return aiInsights;
      }
    } catch (e) {
      console.error('AI insight generation failed, using DB grounded fallback:', e);
    }
  }

  return insights;
}
