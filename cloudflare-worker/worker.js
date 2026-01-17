/**
 * Cloudflare Worker for Imprenta CASBAR Contact Form
 * Handles reCAPTCHA verification and email sending via Mailgun
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
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
    const recaptchaValid = await verifyRecaptcha(recaptchaResponse)
    if (!recaptchaValid) {
      return jsonResponse({ 
        error: 'Verificación reCAPTCHA fallida. Por favor intenta nuevamente.' 
      }, 400)
    }

    // Step 2: Send email via Mailgun
    const emailSent = await sendEmailViaMailgun(name, email, phone, message)
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
      error: 'Error procesando tu solicitud.' 
    }, 500)
  }
}

/**
 * Verify reCAPTCHA response with Google
 */
async function verifyRecaptcha(response) {
  const verifyURL = 'https://www.google.com/recaptcha/api/siteverify'
  
  const formData = new URLSearchParams()
  formData.append('secret', RECAPTCHA_SECRET_KEY)
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
async function sendEmailViaMailgun(name, email, phone, message) {
  const mailgunURL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`

  // Prepare email content
  const emailSubject = `Nuevo mensaje de contacto de ${name}`
  const emailBody = `Has recibido un nuevo mensaje desde el formulario de contacto:

Nombre: ${name}
Email: ${email}
Teléfono: ${phone || 'No proporcionado'}

Mensaje:
${message}

---
Este mensaje fue enviado desde el formulario de contacto de Imprenta CASBAR.`

  // Prepare form data for Mailgun
  const formData = new URLSearchParams()
  formData.append('from', `Imprenta CASBAR <mailgun@${MAILGUN_DOMAIN}>`)
  formData.append('to', RECIPIENT_EMAILS)
  formData.append('subject', emailSubject)
  formData.append('text', emailBody)
  formData.append('h:Reply-To', email)

  // Create Basic Auth header
  const authString = btoa(`api:${MAILGUN_API_KEY}`)

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
