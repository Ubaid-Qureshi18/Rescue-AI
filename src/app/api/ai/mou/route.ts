import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { resourceName, requesterName, requesterDept, ownerDept, quantity, neededFrom, neededUntil, estimatedSavings, reason } = await req.json();

    if (!genAI) {
      return NextResponse.json({
        mou: {
          agreementTitle: `Inter-Departmental Resource Allocation Agreement — ${resourceName}`,
          referenceNumber: `RESCUE-MOU-${Math.floor(100000 + Math.random() * 900000)}`,
          effectiveDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
          parties: {
            lenderDepartment: ownerDept || 'Owner Department',
            borrowerDepartment: requesterDept || 'Borrower Department',
            requester: requesterName || 'Authorized Faculty / Staff',
          },
          assetDetails: {
            item: resourceName,
            quantity: quantity || 1,
            allocatedWindow: `${neededFrom ? new Date(neededFrom).toLocaleDateString('en-IN') : 'Immediate'} to ${neededUntil ? new Date(neededUntil).toLocaleDateString('en-IN') : '30 Days'}`,
            estimatedProcurementAvoided: `₹${(estimatedSavings || 45000).toLocaleString('en-IN')}`,
          },
          termsAndConditions: [
            'Custody of the equipment remains with the borrower department for the agreed duration.',
            'Equipment must be operated in accordance with campus safety protocols and manufacturer guidelines.',
            'Any maintenance issues or damage during transit must be reported immediately to the lending department head.',
            'All environmental credits (carbon offset) are recorded in the institutional ESG registry.',
          ],
          returnProtocol: 'The asset shall be inspected, cleaned, and returned to the lending facility on or before the due date.',
        },
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are RESCUE AI's institutional compliance and resource governance engine.
Generate an official "Inter-Departmental Resource Allocation Memorandum of Understanding (MoU)" for sharing campus assets:
Asset: ${resourceName} (${quantity} units)
Lending Department: ${ownerDept}
Borrower Department: ${requesterDept} (Requester: ${requesterName})
Period: ${neededFrom} to ${neededUntil}
Procurement Cost Avoided: ₹${estimatedSavings?.toLocaleString('en-IN')}
Purpose/Context: ${reason || 'Institutional event/workshop'}

Return ONLY valid JSON matching this structure:
{
  "agreementTitle": "string",
  "referenceNumber": "string",
  "effectiveDate": "string",
  "parties": {
    "lenderDepartment": "string",
    "borrowerDepartment": "string",
    "requester": "string"
  },
  "assetDetails": {
    "item": "string",
    "quantity": number,
    "allocatedWindow": "string",
    "estimatedProcurementAvoided": "string"
  },
  "termsAndConditions": [
    "string",
    "string",
    "string",
    "string"
  ],
  "returnProtocol": "string"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```/g, '').trim();
    const mou = JSON.parse(text);

    return NextResponse.json({ mou });
  } catch (e: any) {
    console.error('AI MoU Error:', e);
    return NextResponse.json({
      mou: {
        agreementTitle: 'Inter-Departmental Resource Allocation Protocol',
        referenceNumber: 'RESCUE-MOU-AUTO-01',
        effectiveDate: new Date().toLocaleDateString('en-IN'),
        parties: { lenderDepartment: 'Lending Dept', borrowerDepartment: 'Borrower Dept', requester: 'Requester' },
        assetDetails: { item: 'Resource', quantity: 1, allocatedWindow: 'Active Term', estimatedProcurementAvoided: '₹25,000' },
        termsAndConditions: ['Standard institutional sharing protocol applies.'],
        returnProtocol: 'Return in pristine condition.',
      },
    });
  }
}
