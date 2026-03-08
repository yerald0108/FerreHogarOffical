import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewOrderNotification {
  orderId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  itemCount: number;
  deliveryAddress: string;
  municipality: string;
  paymentMethod: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CU", { style: "currency", currency: "CUP", minimumFractionDigits: 0 }).format(price);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const {
      orderId,
      customerName,
      customerPhone,
      totalAmount,
      itemCount,
      deliveryAddress,
      municipality,
      paymentMethod,
    }: NewOrderNotification = await req.json();

    const shortId = orderId.slice(0, 8).toUpperCase();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">🔔 Nuevo Pedido</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">#${shortId}</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cliente</td>
                  <td style="padding: 8px 0; font-weight: 600; text-align: right;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Teléfono</td>
                  <td style="padding: 8px 0; text-align: right;">${customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Dirección</td>
                  <td style="padding: 8px 0; text-align: right;">${deliveryAddress}, ${municipality}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Productos</td>
                  <td style="padding: 8px 0; text-align: right;">${itemCount} artículo(s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pago</td>
                  <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr style="border-top: 2px solid #f97316;">
                  <td style="padding: 12px 0; font-weight: bold; font-size: 16px;">Total</td>
                  <td style="padding: 12px 0; font-weight: bold; font-size: 18px; text-align: right; color: #f97316;">${formatPrice(totalAmount)}</td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                Revisa el panel de administración para gestionar este pedido.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send to admin email
    const adminEmail = "yeraldfuste@gmail.com";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FerreHogar <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🔔 Nuevo pedido #${shortId} — ${formatPrice(totalAmount)}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Admin notification email sent:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending admin notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
