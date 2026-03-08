import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BackInStockRequest {
  productId: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CU", {
    style: "currency",
    currency: "CUP",
    minimumFractionDigits: 0,
  }).format(price);
};

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
    const { productId }: BackInStockRequest = await req.json();

    if (!productId) {
      throw new Error("Missing required field: productId");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get product info
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, image_url, stock")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    if (product.stock <= 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Product still out of stock, no emails sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get pending stock alerts for this product
    const { data: alerts, error: alertsError } = await supabase
      .from("stock_alerts")
      .select("*")
      .eq("product_id", productId)
      .eq("notified", false);

    if (alertsError) throw alertsError;

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending alerts for this product" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔧 FerreHogar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Tu ferretería en casa</p>
            </div>
            
            <!-- Body -->
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 25px;">
                <span style="font-size: 56px;">🎊</span>
              </div>

              <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                ¡Ya está disponible!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.7; text-align: center;">
                El producto que esperabas ha vuelto al stock.
              </p>
              
              <!-- Product Card -->
              <div style="border: 2px solid #f97316; border-radius: 12px; overflow: hidden; margin: 25px 0;">
                ${
                  product.image_url
                    ? `<img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover;" />`
                    : `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #fff7ed, #ffedd5); display: flex; align-items: center; justify-content: center; font-size: 64px;">🔧</div>`
                }
                <div style="padding: 20px;">
                  <h3 style="color: #1f2937; margin: 0 0 8px 0; font-size: 20px;">${product.name}</h3>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #f97316; font-size: 24px; font-weight: bold;">${formatPrice(product.price)}</span>
                    <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                      ✅ ${product.stock} disponible${product.stock > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Urgency -->
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⚡ <strong>Stock limitado</strong> — Este producto tiene alta demanda. ¡No esperes demasiado!
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Recibiste este email porque solicitaste una alerta de disponibilidad.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                  © ${new Date().getFullYear()} FerreHogar. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to each subscriber
    let sentCount = 0;
    const errors: string[] = [];
    const notifiedIds: string[] = [];

    for (const alert of alerts) {
      const recipientEmail = alert.email;
      if (!recipientEmail) continue;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "FerreHogar <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: `🎊 ¡${product.name} ya está disponible!`,
            html: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          errors.push(`Failed for ${recipientEmail}: ${emailData.message}`);
          continue;
        }

        notifiedIds.push(alert.id);
        sentCount++;
      } catch (err) {
        errors.push(`Error for ${recipientEmail}: ${err}`);
      }
    }

    // Mark alerts as notified
    if (notifiedIds.length > 0) {
      await supabase
        .from("stock_alerts")
        .update({ notified: true })
        .in("id", notifiedIds);
    }

    console.log(`Back-in-stock emails: ${sentCount} sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, sentCount, errors }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending back-in-stock emails:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
