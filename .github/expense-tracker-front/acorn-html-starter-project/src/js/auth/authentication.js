async function isSession(){
  return new Promise(function(res){
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
      res(401);
    })
  });
}

document.addEventListener("DOMContentLoaded", async function(){
  let session = await isSession();
  let sPath = window.location.pathname;
  let sPage = sPath.substring(sPath.lastIndexOf('/') + 1);

  if(session == 200){
    if(sPage == 'Login.html'){
      window.location.replace("./Overview.html");
    } else if(sPage == 'Register.html'){
      window.location.replace("./Overview.html");
    }
  }
  else{
    if(sPage == 'Overview.html'){
      window.location.replace("./Login.html");
    }
  }
});