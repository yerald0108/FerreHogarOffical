import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  municipality: string;
  deliveryTime: string;
  paymentMethod: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
  }).format(price);
};

const getPaymentMethodName = (method: string) => {
  const methods: Record<string, string> = {
    'cup': 'Efectivo CUP',
    'transfermovil': 'Transfermóvil',
    'mlc': 'MLC',
  };
  return methods[method] || method;
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
    const {
      customerEmail,
      customerName,
      orderId,
      orderItems,
      totalAmount,
      deliveryAddress,
      municipality,
      deliveryTime,
      paymentMethod,
    }: OrderConfirmationRequest = await req.json();

    if (!customerEmail || !orderId) {
      throw new Error("Missing required fields: customerEmail and orderId");
    }

    const shortOrderId = orderId.slice(0, 8).toUpperCase();

    const itemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price_at_purchase)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price_at_purchase * item.quantity)}</td>
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
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔧 FerreHogar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Tu ferretería en casa</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">¡Gracias por tu pedido, ${customerName}!</h2>
              
              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Número de pedido:</strong> #${shortOrderId}
                </p>
              </div>
              
              <h3 style="color: #374151; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Resumen del pedido</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600;">Producto</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600;">Cant.</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600;">Precio</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f97316;">
                    <td colspan="3" style="padding: 15px; color: white; font-weight: bold;">Total</td>
                    <td style="padding: 15px; text-align: right; color: white; font-weight: bold; font-size: 18px;">${formatPrice(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <h3 style="color: #374151; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Información de entrega</h3>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📍 Dirección:</strong> ${deliveryAddress}</p>
                <p style="margin: 5px 0;"><strong>🏘️ Municipio:</strong> ${municipality}</p>
                <p style="margin: 5px 0;"><strong>🕐 Horario:</strong> ${deliveryTime}</p>
                <p style="margin: 5px 0;"><strong>💳 Método de pago:</strong> ${getPaymentMethodName(paymentMethod)}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Si tienes alguna pregunta, no dudes en contactarnos.
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
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FerreHogar <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `✅ Pedido #${shortOrderId} confirmado - FerreHogar`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Order confirmation email sent:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending order confirmation email:", error);
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
