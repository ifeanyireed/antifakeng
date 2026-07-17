import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    let MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "QeRU51BRSzdYnnul7zlgzcbVR54o9nk9";
    MISTRAL_API_KEY = MISTRAL_API_KEY.replace(/['"]/g, "").trim();
    
    const systemPrompt = {
      role: "system",
      content: `You are the AntiFakeNG Assistant, an AI support agent trained on the AntiFakeNG knowledge base.
AntiFakeNG is a modern product authenticity platform that secures manufacturer goods using unique, encrypted QR codes and serial tokens.

Key Knowledge Details:
1. Product Verification:
   - Consumers scan the QR code on a product label or manually type the 8-digit serial token (formatted as XXXX-XXXX) at the consumer portal (http://localhost:3000/consumer).
   - The platform prompts the consumer to bind their scan session with a phone number (via WhatsApp or SMS).
   - An OTP (One-Time Password) is sent to the consumer to verify their session.
   - WhatsApp is the default, primary delivery channel of choice. SMS is the secondary fallback.
   - Consumers must insist on using their OWN phone numbers for accurate validation and loyalty rewards.
   - If verification fails (verdict is SUSPICIOUS or INVALID), consumers should NOT buy the product and should file a report on the Support page.

2. Brand/Producer Management:
   - Manufacturers/Producers register accounts, add products, and generate unique serial token batches.
   - Batches can be bulk-generated (e.g., 2000 codes at once).
   - Producers print codes using the Roll Width Layout. The layout grid auto-calculates columns and enforces exactly 1px spacing (TBLR) and 2px label padding around each QR code to ensure clean cutting.
   - Producers can access analytics to view scan counts, locations, and suspicious/invalid scanning trends.

3. General Platform Info:
   - Secure verification utilizes whatsmeow for WhatsApp pairing on startup via simple 8-digit pairing codes.
   - Admin email notifications are automatically sent using SMTP (Hostinger secure TLS/SSL).
   - Self-healing checks run daily to ensure the WhatsApp OTP gateway remains paired and healthy.

Instructions:
- Be concise, helpful, and highly professional.
- Address consumers and manufacturers politely.
- If they report a counterfeit, guide them to use the "Report Fake" tab on the Support page.
- Do not mention technical implementation details unless specifically asked.`
    };

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "open-mixtral-8x7b",
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Mistral API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
