async function isSession(){
  return new Promise(function(res,rej){
    jQuery.ajax({
      url: "https://expense.projecthost.dev/api/categories",
      method: "GET",
      contentType: "application/json; charset=utf-8",
      headers: {
        "Authorization": tokenStorage.getToken()
      }
    }).then(response => {
      console.log('Session Alive');
      res(200);
    }).catch(error => {
      console.log('Session Ended');
      rej(error);
    })
  });
}

document.addEventListener("DOMContentLoaded", async function(){
  let sPath = window.location.pathname;
  let sPage = sPath.substring(sPath.lastIndexOf('/') + 1);

  await isSession().then(res =>{
    if(sPage == 'Login.html'){
      window.location.replace("./Overview.html");
    } else if(sPage == 'Register.html'){
      window.location.replace("./Overview.html");
    }
  }).catch(rej =>{
    if(!(sPage == 'Login.html' || sPage == 'Register.html')){
      window.location.replace("./Login.html");
    }
  });
});