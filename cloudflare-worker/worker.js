/**
 * Cloudflare Worker for Imprenta CASBAR Contact Form
 * Handles reCAPTCHA verification and email sending via Mailgun
 */

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env)
  }
}

async function handleRequest(request, env) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // Parse the incoming form data
    const data = await request.json()
    const { name, email, phone, message, recaptchaResponse } = data

    // Validate required fields
    if (!name || !email || !message || !recaptchaResponse) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    // Step 1: Verify reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(recaptchaResponse, env)
    if (!recaptchaValid) {
      return jsonResponse({ 
        error: 'Verificación reCAPTCHA fallida. Por favor intenta nuevamente.' 
      }, 400)
    }

    // Step 2: Send email via Mailgun
    const emailSent = await sendEmailViaMailgun(name, email, phone, message, env)
    if (!emailSent) {
      return jsonResponse({ 
        error: 'Error al enviar el correo. Por favor intenta más tarde.' 
      }, 500)
    }

    // Success!
    return jsonResponse({ 
      success: true, 
      message: '¡Tu mensaje ha sido enviado exitosamente!' 
    }, 200)

  } catch (error) {
    console.error('Worker error:', error)
    return jsonResponse({ 
      error: 'Error procesando tu solicitud: ' + error.message 
    }, 500)
  }
}

/**
 * Verify reCAPTCHA response with Google
 */
async function verifyRecaptcha(response, env) {
  const verifyURL = 'https://www.google.com/recaptcha/api/siteverify'
  
  const formData = new URLSearchParams()
  formData.append('secret', env.RECAPTCHA_SECRET_KEY)
  formData.append('response', response)

  try {
    const result = await fetch(verifyURL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const data = await result.json()
    return data.success === true
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}

/**
 * Send email via Mailgun API
 */
async function sendEmailViaMailgun(name, email, phone, message, env) {
  const mailgunURL = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`

  // Prepare email content
  const emailSubject = `imprentacasbar.com - Nuevo mensaje de contacto de ${name}`
  
  // HTML email body with professional styling
  const emailBodyHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo mensaje de contacto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with logo and brand color -->
          <tr>
            <td style="background: linear-gradient(135deg, #18BC9C 0%, #2C3E50 100%); padding: 40px 30px; text-align: center;">
              <img src="https://imprentacasbar.com/logo-w.svg" alt="Imprenta CASBAR" style="height: 60px; margin-bottom: 15px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Imprenta CASBAR</h1>
              <p style="color: #ECF0F1; margin: 10px 0 0 0; font-size: 16px;">¡Le damos la mejor impresión a tu negocio!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2C3E50; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">📧 Nuevo Mensaje de Contacto</h2>
              <p style="color: #7B8A8B; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">Has recibido un nuevo mensaje desde el formulario de contacto en tu sitio web:</p>
              
              <!-- Contact Information Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECF0F1; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <strong style="color: #2C3E50; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">👤 Nombre:</strong>
                          <p style="color: #2C3E50; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <strong style="color: #2C3E50; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">✉️ Email:</strong>
                          <p style="margin: 5px 0 0 0;">
                            <a href="mailto:${email}" style="color: #18BC9C; text-decoration: none; font-size: 16px; font-weight: 600;">${email}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong style="color: #2C3E50; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📱 Teléfono:</strong>
                          <p style="margin: 5px 0 0 0;">
                            <a href="tel:${phone || ''}" style="color: #18BC9C; text-decoration: none; font-size: 16px; font-weight: 600;">${phone || 'No proporcionado'}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message Box -->
              <div style="margin-bottom: 30px;">
                <strong style="color: #2C3E50; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">💬 Mensaje:</strong>
                <div style="background-color: #F8F9FA; border-left: 4px solid #18BC9C; padding: 20px; margin-top: 10px; border-radius: 4px;">
                  <p style="color: #2C3E50; margin: 0; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="mailto:${email}?subject=Re: Consulta desde imprentacasbar.com" style="background-color: #18BC9C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; text-transform: uppercase; display: inline-block; letter-spacing: 1px;">Responder al Cliente</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #2C3E50; padding: 30px; text-align: center;">
              <p style="color: #ECF0F1; margin: 0 0 10px 0; font-size: 14px;">Este mensaje fue enviado desde el formulario de contacto en</p>
              <p style="margin: 0;">
                <a href="https://imprentacasbar.com" style="color: #18BC9C; text-decoration: none; font-weight: 700; font-size: 16px;">imprentacasbar.com</a>
              </p>
              <p style="color: #95A5A6; margin: 15px 0 0 0; font-size: 12px;">
                📍 Retorno 14 de Cecilio Robelo #13, Jardín Balbuena<br>
                Ciudad de México, 15900
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Plain text fallback
  const emailBodyText = `Nuevo mensaje de contacto

Nombre: ${name}
Email: ${email}
Teléfono: ${phone || 'No proporcionado'}

Mensaje:
${message}

---
Este mensaje fue enviado desde el formulario de contacto de imprentacasbar.com`

  // Prepare form data for Mailgun
  const formData = new URLSearchParams()
  formData.append('from', `Imprenta CASBAR <mailgun@${env.MAILGUN_DOMAIN}>`)
  formData.append('to', env.RECIPIENT_EMAILS)
  formData.append('subject', emailSubject)
  formData.append('text', emailBodyText)
  formData.append('html', emailBodyHtml)
  formData.append('h:Reply-To', email)

  // Create Basic Auth header
  const authString = btoa(`api:${env.MAILGUN_API_KEY}`)

  try {
    const result = await fetch(mailgunURL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (!result.ok) {
      const errorText = await result.text()
      console.error('Mailgun error:', errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
