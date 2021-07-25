/**
 *
 * AuthRegister
 *
 * Register.html page content scripts. Initialized from scripts.js file.
 *
 *
 */

 class AuthRegister {
    constructor() {
      // Initialization of the page plugins
      this._initForm();
    }
  
    // Form validation
    _initForm() {

      const form = document.getElementById('registerForm');
      const errorHandler = document.getElementById('registerErrorHandler');
      if (!form) {
        return;
      }
      const validateOptions = {
        rules: {
          registerEmail: {
            required: true,
            email: true,
          },
          registerPassword: {
            required: true,
            minlength: 6,
            regex: /[a-z].*[0-9]|[0-9].*[a-z]/i,
          },
          registerCheck: {
            required: true,
          },
          registerFirstName: {
            required: true,
          },
          registerLastName: {
            required: true,
          }
        },
        messages: {
          registerEmail: {
            email: 'Your email address must be in correct format!',
          },
          registerPassword: {
            minlength: 'Password must be at least {0} characters!',
            regex: 'Password must contain a letter and a number!',
          },
          registerCheck: {
            required: 'Please read and accept the terms!',
          },
          registerFirstName: {
            required: 'Please enter your first name!',
          },
          registerLastName: {
            required: 'Please enter your last name!',
          }
        }
      };
      jQuery(form).validate(validateOptions);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (jQuery(form).valid()) {
          const formValues = {
            email: form.querySelector('[name="registerEmail"]').value,
            password: form.querySelector('[name="registerPassword"]').value,
            firstName: form.querySelector('[name="registerFirstName"]').value,
            lastName: form.querySelector('[name="registerLastName"]').value,
            check: form.querySelector('[name="registerCheck"]').checked,
          };
          
          jQuery.ajax({
            url: "https://expense.projecthost.dev/api/users/register",
            method: "POST",
            data: JSON.stringify(formValues),
            contentType: "application/json; charset=utf-8",
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }).then(response => {
            localStorage.setItem("auth-token", 'Bearer '+response['token']);
            location.reload();
          }).catch(error => {
            errorHandler.style.display = "initial";
            errorHandler.classList.remove("fade-text-active");
            void errorHandler.offsetWidth;
            errorHandler.classList.add("fade-text-active");
          })

          return;
        }
      });
    }
  }
  