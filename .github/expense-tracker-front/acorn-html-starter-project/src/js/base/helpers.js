/**
 *
 * Helpers
 * Static helper methods.
 *
 */

class Helpers {
  // A basic debounce function for events like resize, keydown and etc.
  static Debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  static async getCategories(){
    return new Promise(function(res,rej){
      jQuery.ajax({
        url: "https://expense.projecthost.dev/api/categories",
        method: "GET",
        contentType: "application/json; charset=utf-8",
        headers: {
          "Authorization": tokenStorage.getToken()
        }
      }).then(response => {
        res(response);
      }).catch(error => {
        rej(error);
      })
    });
  }

  static async getTransaction(categoryId){
    return new Promise(function(res,rej){
      jQuery.ajax({
        url: `https://expense.projecthost.dev/api/categories/${categoryId}/transactions`,
        method: "GET",
        contentType: "application/json; charset=utf-8",
        headers: {
          "Authorization": tokenStorage.getToken()
        }
      }).then(response => {
        res(response);
      }).catch(error => {
        rej(error);
      })
    });
  }
  
  // return array of dates between a given moment start & end date
  static getDateRange(startDate, endDate) {
    startDate.subtract(1, 'days');
    let currDate = startDate.startOf('day');
    let lastDate = endDate.startOf('day');
    let dates=[];
  
    while(currDate.add(1, 'days').diff(lastDate) <= 0) {
      //console.log(currDate.toDate());
      dates.push(currDate.clone().toDate());
  }
  
    return dates; 
  }

  // sum together 2 arrays for each index
  // for example [1,2] and [2,3] would return [3,5]
  static arraySum(array1, array2) 
  {
    var result = [];
    var ctr = 0;
    var x=0;
    
  while (ctr < array1.length && ctr < array2.length) 
    {
      result.push(array1[ctr] + array2[ctr]);
      ctr++;
    }

  if (ctr === array1.length) 
  {
      for (x = ctr; x < array2.length; x++)   {
        result.push(array2[x]);
      }
    } 
    else
    {
    for (x = ctr; x < array1.length; x++) 
      {
        result.push(array1[x]);
      }
    }
    return result;
  }

  // Checks the given array and returns a value plus one from the greatest prop value
  static NextId(data, prop) {
    if (!data) {
      console.error('NextId data is null');
      return;
    }
    const max = data.reduce(function (prev, current) {
      if (+parseInt(current[prop]) > +parseInt(prev[prop])) {
        return current;
      } else {
        return prev;
      }
    });
    return parseInt(max[prop]) + 1;
  }

  // Fetches data from the path parameter and fires onComplete callback with the json formatted data
  static FetchJSON(path, onComplete) {
    fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response;
      })
      .then((response) => response.json())
      .then((data) => onComplete(data))
      .catch((error) => {
        console.error('Problem with the fetching JSON data: ', error);
      });
  }

  // Adds commas to thousand
  static AddCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }

  // If the project is run in a subdirectory and absolute-path is used, this function adds the data-url-prefix value defined in the html element to the paths.
  static UrlFix(paramPath) {
    const dataPrefix = document.documentElement.dataset.urlPrefix;
    if (!dataPrefix) {
      return paramPath;
    }
    const prefix = dataPrefix.endsWith('/') ? dataPrefix : `${dataPrefix}/`;
    const path = paramPath.startsWith('/') ? paramPath.slice(1, paramPath.length) : paramPath;
    return `${prefix}${path}`;
  }

  static hex(c){
    var s = "0123456789abcdef";
    var i = parseInt (c);
    if (i == 0 || isNaN (c))
      return "00";
    i = Math.round(Math.min (Math.max (0, i), 255));
    return s.charAt((i - i % 16) / 16) + s.charAt (i % 16);
  }

  // Convert an RGB triplet to a hex string
  static convertToHex(rgb){
    return Helpers.hex(rgb[0]) + Helpers.hex(rgb[1]) + Helpers.hex(rgb[2]);
  }

  // Remove '#' in color hex string
  static trim (s){
    return (s.charAt(0) == '#') ? s.substring(1, 7) : s
  }

  // Convert a hex string to an RGB triplet
  static convertToRGB (hex) {
    var color = [];
    color[0] = parseInt((Helpers.trim(hex)).substring(0, 2), 16);
    color[1] = parseInt((Helpers.trim(hex)).substring(2, 4), 16);
    color[2] = parseInt((Helpers.trim(hex)).substring(4, 6), 16);
    return color;
  }

  static generateColor(colorStart,colorEnd,colorCount){

    // The beginning of your gradient
    var start = Helpers.convertToRGB(colorStart);    
  
    // The end of your gradient
    var end = Helpers.convertToRGB(colorEnd);    
  
    // The number of colors to compute
    var len = colorCount;
  
    //Alpha blending amount
    var alpha = 0.0;
  
    var range = [];
    
    for (let i = 0; i < len; i++) {
      var c = [];
      alpha += (1.0/len);
      
      c[0] = Math.round(start[0] * alpha + (1 - alpha) * end[0]);
      c[1] = Math.round(start[1] * alpha + (1 - alpha) * end[1]);
      c[2] = Math.round(start[2] * alpha + (1 - alpha) * end[2]);
      range.push(c.toString());  
    }
    
    return range;
  }

}
