import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  customerEmail: string;
  customerName: string;
}

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
    const { customerEmail, customerName }: WelcomeEmailRequest = await req.json();

    if (!customerEmail) {
      throw new Error("Missing required field: customerEmail");
    }

    const name = customerName || "Cliente";

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
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🔧 FerreHogar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu ferretería en casa</p>
            </div>
            
            <!-- Body -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 64px;">🎉</span>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 0; text-align: center; font-size: 24px;">
                ¡Bienvenido/a, ${name}!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: center;">
                Gracias por registrarte en <strong>FerreHogar</strong>. Ahora tienes acceso a todo nuestro catálogo de productos de ferretería y hogar con entrega a domicilio.
              </p>
              
              <!-- Features Grid -->
              <div style="margin: 30px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 15px; text-align: center; width: 33%; vertical-align: top;">
                      <div style="background: #fff7ed; border-radius: 12px; padding: 20px;">
                        <span style="font-size: 36px;">🛒</span>
                        <p style="color: #ea580c; font-weight: 600; margin: 10px 0 5px 0; font-size: 14px;">Catálogo completo</p>
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Miles de productos disponibles</p>
                      </div>
                    </td>
                    <td style="padding: 15px; text-align: center; width: 33%; vertical-align: top;">
                      <div style="background: #fff7ed; border-radius: 12px; padding: 20px;">
                        <span style="font-size: 36px;">🚚</span>
                        <p style="color: #ea580c; font-weight: 600; margin: 10px 0 5px 0; font-size: 14px;">Entrega rápida</p>
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Directo a tu puerta</p>
                      </div>
                    </td>
                    <td style="padding: 15px; text-align: center; width: 33%; vertical-align: top;">
                      <div style="background: #fff7ed; border-radius: 12px; padding: 20px;">
                        <span style="font-size: 36px;">💰</span>
                        <p style="color: #ea580c; font-weight: 600; margin: 10px 0 5px 0; font-size: 14px;">Mejores precios</p>
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Ofertas exclusivas</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
                  ¿Listo para explorar? Visita nuestra tienda y descubre lo que tenemos para ti.
                </p>
              </div>
              
              <!-- Tips Section -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0; font-size: 16px;">💡 Consejos para empezar:</h3>
                <ul style="color: #4b5563; font-size: 14px; line-height: 2; padding-left: 20px; margin-bottom: 0;">
                  <li>Completa tu <strong>perfil</strong> para agilizar futuras compras</li>
                  <li>Agrega productos a tus <strong>favoritos</strong> con el corazón ❤️</li>
                  <li>Activa las <strong>alertas de stock</strong> en productos agotados</li>
                  <li>Usa <strong>cupones de descuento</strong> en el checkout</li>
                </ul>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  ¿Tienes preguntas? Estamos aquí para ayudarte.
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
        subject: "🎉 ¡Bienvenido/a a FerreHogar!",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Welcome email sent:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);
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
