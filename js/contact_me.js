$(function() {

  $("#contactForm input,#contactForm textarea").jqBootstrapValidation({
    preventSubmit: true,
    submitError: function($form, event, errors) {
      // additional error messages or events
    },
    submitSuccess: function($form, event) {
      event.preventDefault(); // prevent default submit behaviour
      
      // Get reCAPTCHA response
      var recaptchaResponse = grecaptcha.getResponse();
      
      // Check if reCAPTCHA is completed
      if (!recaptchaResponse) {
        $('#success').html("<div class='alert alert-warning'>");
        $('#success > .alert-warning').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
          .append("</button>");
        $('#success > .alert-warning')
          .append("<strong>Por favor completa la verificación reCAPTCHA.</strong>");
        $('#success > .alert-warning')
          .append('</div>');
        return;
      }
      
      // get values from FORM
      var name = $("input#name").val();
      var email = $("input#email").val();
      var phone = $("input#phone").val();
      var message = $("textarea#message").val();
      var firstName = name; // For Success/Failure Message
      // Check for white space in name for Success/Fail message
      if (firstName.indexOf(' ') >= 0) {
        firstName = name.split(' ').slice(0, -1).join(' ');
      }
      $this = $("#sendMessageButton");
      $this.prop("disabled", true); // Disable submit button until AJAX call is complete to prevent duplicate messages
      
      // TODO: Replace this URL with your Cloudflare Worker URL after deployment
      // Format: https://imprenta-casbar-contact.YOUR-SUBDOMAIN.workers.dev
      var workerURL = "https://morning-fire-34f9.ingnoerodriguezc.workers.dev";
      
      $.ajax({
        url: workerURL,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          name: name,
          phone: phone,
          email: email,
          message: message,
          recaptchaResponse: recaptchaResponse
        }),
        cache: false,
        success: function(response) {
          // Success message
          $('#success').html("<div class='alert alert-success'>");
          $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
            .append("</button>");
          $('#success > .alert-success')
            .append("<strong>¡Tu mensaje ha sido enviado! Gracias por contactarnos.</strong>");
          $('#success > .alert-success')
            .append('</div>');
          //clear all fields
          $('#contactForm').trigger("reset");
          // Reset reCAPTCHA
          grecaptcha.reset();
        },
        error: function(xhr) {
          // Fail message
          var errorMsg = "Lo sentimos, parece que nuestro servidor no está respondiendo. Por favor intenta nuevamente más tarde.";
          if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMsg = xhr.responseJSON.error;
          }
          $('#success').html("<div class='alert alert-danger'>");
          $('#success > .alert-danger').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
            .append("</button>");
          $('#success > .alert-danger').append($("<strong>").text("Lo sentimos " + firstName + ", " + errorMsg));
          $('#success > .alert-danger').append('</div>');
          // Reset reCAPTCHA on error
          grecaptcha.reset();
        },
        complete: function() {
          setTimeout(function() {
            $this.prop("disabled", false); // Re-enable submit button when AJAX call is complete
          }, 1000);
        }
      });
    },
    filter: function() {
      return $(this).is(":visible");
    },
  });

  $("a[data-toggle=\"tab\"]").click(function(e) {
    e.preventDefault();
    $(this).tab("show");
  });
});

/*When clicking on Full hide fail/success boxes */
$('#name').focus(function() {
  $('#success').html('');
});
