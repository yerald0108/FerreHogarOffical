import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface AbandonedCartRequest {
  customerEmail: string;
  customerName: string;
  cartItems: CartItem[];
  cartTotal: number;
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
    const { customerEmail, customerName, cartItems, cartTotal }: AbandonedCartRequest = await req.json();

    if (!customerEmail || !cartItems?.length) {
      throw new Error("Missing required fields: customerEmail and cartItems");
    }

    const name = customerName || "Cliente";

    const itemsHtml = cartItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">
            <div style="display: flex; align-items: center;">
              ${
                item.image_url
                  ? `<img src="${item.image_url}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 12px;" />`
                  : `<div style="width: 50px; height: 50px; background: #fff7ed; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🔧</div>`
              }
              <span style="color: #1f2937; font-weight: 500;">${item.product_name}</span>
            </div>
          </td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280;">×${item.quantity}</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #1f2937; font-weight: 600;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `
      )
      .join("");

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
                <span style="font-size: 56px;">🛒</span>
              </div>

              <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 22px;">
                ¡${name}, olvidaste algo!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.7; text-align: center;">
                Notamos que dejaste productos en tu carrito. Están esperándote, pero el stock es limitado.
              </p>
              
              <!-- Cart Items -->
              <div style="margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px 15px; text-align: left; color: #6b7280; font-weight: 600; font-size: 13px;">Producto</th>
                      <th style="padding: 10px 15px; text-align: center; color: #6b7280; font-weight: 600; font-size: 13px;">Cant.</th>
                      <th style="padding: 10px 15px; text-align: right; color: #6b7280; font-weight: 600; font-size: 13px;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>
              
              <!-- Total -->
              <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px; padding: 18px 20px; margin: 20px 0; text-align: center;">
                <span style="color: rgba(255,255,255,0.85); font-size: 14px;">Total de tu carrito</span>
                <p style="color: white; font-size: 28px; font-weight: bold; margin: 5px 0 0 0;">
                  ${formatPrice(cartTotal)}
                </p>
              </div>
              
              <!-- Urgency Banner -->
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⚡ <strong>Recuerda:</strong> la disponibilidad de los productos puede cambiar. ¡No te quedes sin ellos!
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Si ya completaste tu compra, ignora este mensaje.
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FerreHogar <onboarding@resend.dev>",
        to: [customerEmail],
        subject: "🛒 ¡Tienes productos esperándote en tu carrito!",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Abandoned cart email sent:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending abandoned cart email:", error);
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
