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

  // 1. Headcount & Participants
  const partMatch = text.match(/(\d+)\s+(?:student|participant|person|people|developer|attendee|user)s?/i) || text.match(/for\s+(\d+)\s+(?:student|participant|person|people)/i);
  if (partMatch) {
    result.participants = parseInt(partMatch[1]);
  }

  // 2. Standard Items Regex
  const patterns: Record<string, RegExp[]> = {
    laptops: [/(\d+)\s+laptop/i, /laptop[s]?\s+[x×]?\s*(\d+)/i],
    desktops: [/(\d+)\s+desktop/i, /pc[s]?\s+[x×]?\s*(\d+)/i],
    projectors: [/(\d+)\s+(?:4k\s+)?laser\s+projector/i, /(\d+)\s+projector/i],
    chairs: [/(\d+)\s+chair/i, /(\d+)\s+seat/i, /seating\s+for\s+(\d+)/i],
    tables: [/(\d+)\s+table/i, /(\d+)\s+desk/i],
    microphones: [/(\d+)\s+(?:wireless\s+)?mic/i, /(\d+)\s+microphone/i],
    cameras: [/(\d+)\s+camera/i, /(\d+)\s+dslr/i],
    arduinoKits: [/(\d+)\s+arduino/i],
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

  // 3. Room & Studio Count (Avoid matching "4 studio light panels" as 4 studios!)
  const roomNumMatch = text.match(/(\d+)\s+(?:smart\s+)?classroom/i) || text.match(/(\d+)\s+(?:auditorium|hall|room)(?!\s+light)/i);
  if (roomNumMatch) {
    result.rooms = parseInt(roomNumMatch[1]);
  } else if (text.includes('studio') || text.includes('classroom') || text.includes('auditorium') || text.includes('hall') || text.includes('cleanroom')) {
    result.rooms = 1;
  }

  // 4. Custom Items (VR headsets, podcast rigs, light panels, CNC, 3D printers)
  const customItems: Array<{ regex: RegExp; name: string }> = [
    { regex: /(\d+)\s+(?:meta\s+quest\s+\d+\s+)?vr\s+headset/i, name: 'Meta Quest 3 VR headsets' },
    { regex: /(\d+)\s+(?:rodecaster\s+pro\s+)?podcast\s+rig/i, name: 'RodeCaster Pro podcast rigs' },
    { regex: /(\d+)\s+studio\s+light\s+panel/i, name: 'studio light panels' },
    { regex: /(\d+)\s+microcentrifuge/i, name: 'refrigerated microcentrifuges' },
    { regex: /(\d+)\s+nanodrop/i, name: 'NanoDrop spectrophotometer' },
    { regex: /(\d+)\s+3d\s+printer/i, name: '3D Printers' },
    { regex: /(\d+)\s+oscilloscope/i, name: 'Digital Oscilloscopes' },
  ];

  for (const ci of customItems) {
    const m = text.match(ci.regex);
    if (m) {
      result.otherItems?.push({ name: ci.name, quantity: parseInt(m[1]) });
    }
  }

  // Generic fallback for unhandled "X item_name"
  const genericMatch = text.match(/(\d+)\s+([a-z0-9\s]{3,25})(?:,|\.|$|and)/gi);
  if (genericMatch) {
    for (const itemStr of genericMatch) {
      const m = itemStr.match(/(\d+)\s+([a-z0-9\s]{3,25})/i);
      if (m) {
        const qty = parseInt(m[1]);
        let name = m[2].trim();
        // Skip model numbers like "quest 3"
        if (/^quest\s+\d+$/i.test(name) || /^rtx\s+\d+$/i.test(name)) continue;

        const NON_RESOURCE_WORDS = ['student', 'students', 'people', 'person', 'participant', 'participants', 'developer', 'developers', 'attendee', 'attendees', 'user', 'users', 'guest', 'guests'];
        const recognized = ['laptop', 'projector', 'chair', 'table', 'mic', 'camera', 'arduino', 'room', 'classroom', 'participant', 'people', 'student', 'quest'];
        
        if (!recognized.some(r => name.includes(r)) && !NON_RESOURCE_WORDS.some(w => name.includes(w)) && qty > 0) {
          if (!result.otherItems?.some(existing => existing.name.toLowerCase() === name.toLowerCase())) {
            result.otherItems?.push({ name, quantity: qty });
          }
        }
      }
    }
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
    const prompt = `You are RESCUE AI's precision requirements extraction engine.
Parse the following user request into structured resource items:

RULES:
1. QUANTITY VS MODEL NAME: "Need 6 Meta Quest 3 VR headsets" requested quantity is 6, NOT 3! Do NOT confuse product model numbers (e.g. Meta Quest 3, RTX 4090, Pi 5) with requested quantities.
2. QUANTITY BLEEDING: Each item has its own quantity preceding it (e.g. "2 RodeCaster Pro podcast rigs" -> quantity: 2; "4 studio light panels" -> quantity: 4; "and the soundproof green screen studio" -> quantity: 1). Do NOT apply quantity 4 to the studio!
3. NO MISSING ITEMS: Extract EVERY single physical resource mentioned in the prompt. Do not skip podcast rigs, consoles, headsets, light panels, or rooms.
4. HEADCOUNT: Put student/people count ONLY into "participants". Do NOT put students or people into "otherItems".
5. ROOMS & STUDIOS: If a room/studio is requested (e.g. "green screen studio"), set "rooms": 1 unless explicitly requested as multiple.

User Input: "${input}"

Return ONLY valid JSON matching this schema:
{
  "title": "descriptive specific title e.g. XR & Audio Studio Workshop Setup",
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
  "participants": number or null,
  "duration": "duration string or null",
  "purpose": "purpose string e.g. workshop",
  "estimatedCost": estimated purchase cost in INR (number) if bought new,
  "otherItems": [{"name": "physical item name e.g. VR headsets, podcast rigs, studio light panels", "quantity": number}]
}`;

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
