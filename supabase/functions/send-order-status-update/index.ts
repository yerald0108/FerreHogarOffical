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

interface StatusUpdateRequest {
  orderId: string;
  newStatus: string;
  previousStatus: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "En Preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusEmojis: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

const statusColors: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

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
    const { orderId, newStatus, previousStatus }: StatusUpdateRequest = await req.json();

    if (!orderId || !newStatus) {
      throw new Error("Missing required fields: orderId and newStatus");
    }

    // Don't send email if status hasn't changed
    if (newStatus === previousStatus) {
      return new Response(
        JSON.stringify({ success: true, message: "Status unchanged, no email sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get order details with customer info
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Get customer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", order.user_id)
      .single();

    const customerEmail = profile?.email;
    const customerName = profile?.full_name || "Cliente";

    if (!customerEmail) {
      console.log("No customer email found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No customer email, skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    const statusLabel = statusLabels[newStatus] || newStatus;
    const statusEmoji = statusEmojis[newStatus] || "📋";
    const statusColor = statusColors[newStatus] || "#6b7280";

    const getStatusMessage = (status: string): string => {
      switch (status) {
        case "confirmed":
          return "Tu pedido ha sido confirmado y estamos preparándolo.";
        case "preparing":
          return "Estamos preparando tu pedido con cuidado.";
        case "shipped":
          return "Tu pedido está en camino. ¡Pronto lo recibirás!";
        case "delivered":
          return "Tu pedido ha sido entregado. ¡Gracias por tu compra!";
        case "cancelled":
          return "Tu pedido ha sido cancelado. Si tienes alguna pregunta, contáctanos.";
        default:
          return "El estado de tu pedido ha sido actualizado.";
      }
    };

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
              <h2 style="color: #1f2937; margin-top: 0;">Hola ${customerName},</h2>
              
              <div style="background: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 24px; text-align: center;">
                  ${statusEmoji}
                </p>
                <p style="margin: 10px 0 0 0; color: ${statusColor}; font-weight: bold; text-align: center; font-size: 18px;">
                  Estado: ${statusLabel}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${getStatusMessage(newStatus)}
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Número de pedido:</strong> #${shortOrderId}
                </p>
              </div>
              
              <h3 style="color: #374151; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Detalles del pedido</h3>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📍 Dirección:</strong> ${order.delivery_address}</p>
                <p style="margin: 5px 0;"><strong>🏘️ Municipio:</strong> ${order.municipality}</p>
                <p style="margin: 5px 0;"><strong>🕐 Horario:</strong> ${order.delivery_time}</p>
                <p style="margin: 5px 0;"><strong>💰 Total:</strong> ${formatPrice(order.total_amount)}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
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
        subject: `${statusEmoji} Pedido #${shortOrderId} - ${statusLabel}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Order status update email sent:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending order status email:", error);
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
