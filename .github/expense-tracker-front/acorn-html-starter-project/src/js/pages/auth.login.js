/**
 *
 * AuthLogin
 *
 * Pages.Authentication.Login.html page content scripts. Initialized from scripts.js file.
 *
 *
 */

 class AuthLogin {
    constructor() {
      // Initialization of the page plugins
      this._initForm();
    }
  
    // Form validation
    _initForm() {
      const form = document.getElementById('loginForm');
      if (!form) {
        return;
      }
      const validateOptions = {
        rules: {
          email: {
            required: true,
            email: true,
          },
        },
        messages: {
          email: {
            email: 'Your email address must be in correct format!',
          },
          error: {
            error: "Invalid email and password combination!"
          }
        },
      };
      jQuery(form).validate(validateOptions);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (jQuery(form).valid()) {
          const formValues = {
            email: form.querySelector('[name="email"]').value,
            password: form.querySelector('[name="password"]').value,
          };

          jQuery.ajax({
            url: "https://expense.projecthost.dev/api/users/login",
            method: "POST",
            data: JSON.stringify(formValues),
            contentType: "application/json; charset=utf-8",
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }).then(response => {
              localStorage.setItem("token", 'Bearer '+response['token']);
          }).catch(error => {
              $('#loginErrorHandler');
          })
          
        }
      });
    }
  }
