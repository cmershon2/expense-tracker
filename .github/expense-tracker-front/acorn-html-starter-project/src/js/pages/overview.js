/**
 *
 * Overview
 *
 * Overview.html page content scripts. Initialized from scripts.js file.
 *
 *
 */

 class Overview {
  constructor() {
    // References to page items that might require an update
    this._customLegendBarChart = null;

    // Initialization of the page plugins
    this._initTour();
    this._initEvents();
    this._initSelect2();
    this._initDatePickers();
    this._initCategoryBreakdownFilters();
    this._initExpenseListFilters();
    this._initCategoriesFilters();
  }

  _initEvents() {
    // Listening for color change events to update charts
    document.documentElement.addEventListener(Globals.colorAttributeChange, (event) => {
      this._customLegendBarChart && this._customLegendBarChart.destroy();

      let categoryBreakDownStart = localStorage.getItem("category-breakdown-start");
      let categoryBreakDownEnd = localStorage.getItem("category-breakdown-end");
      let categoryBreakDownFormat = localStorage.getItem("category-breakdown-format");

      let expenseListStart = localStorage.getItem("expense-list-start");
      let expenseListEnd = localStorage.getItem("expense-list-end");
      let expenseListCat = localStorage.getItem("expense-list-category");
 
      let categoriesCat = localStorage.getItem("categories-category");

      if(categoryBreakDownStart == null && categoryBreakDownEnd == null && categoryBreakDownFormat == null){
        this._initCustomLegendBarChart();
      } else {
        this._initCustomLegendBarChart(moment(categoryBreakDownStart, "MM/DD/YYYY"),moment(categoryBreakDownEnd, "MM/DD/YYYY"), categoryBreakDownFormat);
      }

      if(expenseListStart == null && expenseListEnd == null){
        this._initExpenseList();
      } else {
        this._initExpenseList(expenseListStart, expenseListEnd, expenseListCat.split(','), 1);
      }

      this._initCategoryTiles(categoriesCat.split(','), 1)
    });
  }

  // get data & format it
  async _dataSet(){
    return new Promise(async function(resolve) {
      let index = 0;
      await Helpers.getCategories().then(res => {
        
        res.forEach(async function(c) {
          c.transactions =[];
          await Helpers.getTransaction(c.categoryId).then(t => {
            t.forEach(function(e) {
              if(e.categoryId == c.categoryId){
                c.transactions.push(e);
              }
            })
            if(index == res.length-1){
              resolve(res);
            }
          })
          index++;
        });
      })
    });
  }
  
  //Refreshes icons
  _initIcons() {
    if (typeof csicons !== 'undefined') {
      csicons.replace();
    }
  }

  // init filters on breakdown
  _initCategoryBreakdownFilters() {
    // Set default date range on load.
    let startDateElement = $('#category-breakdown-date-picker-start');
    let endDateElement = $('#category-breakdown-date-picker-end');
    let dateFormatElement = $('#category-breakdown-date-format-filter');
    let dateRangeElement = $('#category-breakdown-date-filter');
    let startDate;
    let endDate;
    let format;

    // check local storage for start & end date as well as format
    // if these are not defined, get default values
    if(localStorage.getItem("category-breakdown-start") != null){
      startDate = moment(localStorage.getItem("category-breakdown-start"));
    } else {
      startDate = moment().startOf('isoWeek');
    }

    if(localStorage.getItem("category-breakdown-end") != null){
      endDate = moment(localStorage.getItem("category-breakdown-end"));
    } else {
      endDate = moment().endOf('isoWeek');
    }

    if(localStorage.getItem("category-breakdown-format") != null){
      format = localStorage.getItem("category-breakdown-format");
      dateFormatElement.select2("val",localStorage.getItem("category-breakdown-format"));
    } else {
      format = dateFormatElement.val();
    }

    if(localStorage.getItem("category-date-range") != null){
      dateRangeElement.select2("val", localStorage.getItem("category-date-range"));
    } else {
      dateRangeElement.val('w');
    }

    startDateElement.val(startDate.format('MM/DD/YYYY'));
    endDateElement.val(endDate.format('MM/DD/YYYY'));

    /* default is weekly so disable date picker */
    startDateElement.attr("disabled","");
    endDateElement.attr("disabled","");

    // set date picker & update
    startDateElement.datepicker("setDate",startDate.format('MM/DD/YYYY'));
    endDateElement.datepicker("setDate",endDate.format('MM/DD/YYYY'));
    $('#category-breakdown-date-picker').datepicker("update");

    this._initCustomLegendBarChart(startDate, endDate, format); 

    // Listen to event changes on the date range
    $('#category-breakdown-date-filter').on("change", e => {
      let filter = $('#category-breakdown-date-filter').val();
      let startDate = moment();
      let endDate = moment();
    
      if(filter == 'w'){
        startDate = moment().startOf('isoWeek');
        endDate = moment().endOf('isoWeek');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else if(filter == 'm'){
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else if(filter == 'y'){
        startDate = moment().startOf('year');
        endDate = moment().endOf('year');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else {
        startDate = moment(startDateElement.val());
        endDate = moment(endDateElement.val());
        startDateElement.removeAttr("disabled");
        endDateElement.removeAttr("disabled");
      }

    
      startDateElement.val(startDate.format('MM/DD/YYYY'));
      endDateElement.val(endDate.format('MM/DD/YYYY'));
      startDateElement.datepicker("setDate",startDate.format('MM/DD/YYYY'));
      endDateElement.datepicker("setDate",endDate.format('MM/DD/YYYY'));
      $('#category-breakdown-date-picker').datepicker("update");
    });

    $('#category-breakdown-apply').on("click", e =>{
      /* Kill old chart version */
      this._customLegendBarChart.destroy();

      let startDate = moment(startDateElement.val(), 'MM/DD/YYYY');
      let endDate = moment(endDateElement.val(), 'MM/DD/YYYY');
      let format = $('#category-breakdown-date-format-filter').val();
      let dateRangeElement = $('#category-breakdown-date-filter').val();

      /* store start & end date in session storage */
      localStorage.setItem("category-breakdown-start", startDate.format('MM/DD/YYYY'));
      localStorage.setItem("category-breakdown-end", endDate.format('MM/DD/YYYY'));
      localStorage.setItem("category-breakdown-format", format);
      localStorage.setItem("category-date-range", dateRangeElement);
      this._initCustomLegendBarChart(startDate, endDate, format); 
    });
  }

  // init filters on expense list
  _initExpenseListFilters() {
    // Set default date range on load.
    let startDateElement = $('#expense-list-date-picker-start');
    let endDateElement = $('#expense-list-date-picker-end');
    let dateRangeElement = $('#expense-list-date-filter');
    let startDate;
    let endDate;
    let catFilterValue;

    // check local storage for start & end date as well as format
    // if these are not defined, get default values
    if(localStorage.getItem("expense-list-start") != null){
      startDate = moment(localStorage.getItem("expense-list-start"));
      startDateElement.val(localStorage.getItem("expense-list-start"));
    } else {
      startDate = moment().startOf('isoWeek');
    }

    if(localStorage.getItem("expense-list-end") != null){
      endDate = moment(localStorage.getItem("expense-list-end"));
      endDateElement.val(localStorage.getItem("expense-list-end"));
    } else {
      endDate = moment().endOf('isoWeek');
    }

    if(localStorage.getItem("expense-date-range") != null){
      dateRangeElement.select2("val", localStorage.getItem("expense-date-range"));
    } else {
      dateRangeElement.val('w');
    }

    if(localStorage.getItem("expense-list-category") != null){
      catFilterValue = localStorage.getItem("expense-list-category").split(",");
    } else {
      catFilterValue = ['a'];
    }

    startDateElement.val(startDate.format('MM/DD/YYYY'));
    endDateElement.val(endDate.format('MM/DD/YYYY'));

    /* default is weekly so disable date picker */
    startDateElement.attr("disabled","");
    endDateElement.attr("disabled","");

    startDateElement.datepicker("setDate",startDate.format('MM/DD/YYYY'));
    endDateElement.datepicker("setDate",endDate.format('MM/DD/YYYY'));
    $('#expense-list-date-picker').datepicker("update");

    this._initExpenseList(startDate, endDate, catFilterValue); 

    // Listen to event changes on the date range
    $('#expense-list-date-filter').on("change", e => {
      let filter = $('#expense-list-date-filter').val();
      let startDate = moment();
      let endDate = moment();
    
      if(filter == 'w'){
        startDate = moment().startOf('isoWeek');
        endDate = moment().endOf('isoWeek');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else if(filter == 'm'){
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else if(filter == 'y'){
        startDate = moment().startOf('year');
        endDate = moment().endOf('year');
        startDateElement.attr("disabled","");
        endDateElement.attr("disabled","");
      } else {
        startDate = moment(startDateElement.val());
        endDate = moment(endDateElement.val());
        startDateElement.removeAttr("disabled");
        endDateElement.removeAttr("disabled");
      }

    
      startDateElement.val(startDate.format('MM/DD/YYYY'));
      endDateElement.val(endDate.format('MM/DD/YYYY'));
      startDateElement.datepicker("setDate",startDate.format('MM/DD/YYYY'));
      endDateElement.datepicker("setDate",endDate.format('MM/DD/YYYY'));
      $('#expense-list-date-picker').datepicker("update");
    });

    $('#expense-list-apply').on("click", e =>{
      let startDate = moment(startDateElement.val(), 'MM/DD/YYYY');
      let endDate = moment(endDateElement.val(), 'MM/DD/YYYY');
      let catFilterValue = $('#expense-list-category-filter').val();
      let dateRangeElement = $('#expense-list-date-filter').val();
      // first is used to stop select2 from sending duplicate selected values.
      let first = 1;

      /* store start & end date in session storage */
      localStorage.setItem("expense-list-start", startDate.format('MM/DD/YYYY'));
      localStorage.setItem("expense-list-end", endDate.format('MM/DD/YYYY'));
      localStorage.setItem("expense-list-category",  catFilterValue);
      localStorage.setItem("expense-date-range", dateRangeElement);
      this._initExpenseList(startDate, endDate, catFilterValue, first); 
    });
  }

  // init filters on categories
  _initCategoriesFilters() {
    let catFilterValue;

    if(localStorage.getItem("categories-category") != null){
      catFilterValue = localStorage.getItem("categories-category").split(",");
    } else {
      catFilterValue = ['a'];
    }

    this._initCategoryTiles(catFilterValue);

    $('#categories-apply').on("click", e =>{
      let catFilterValue = $('#categories-category-filter').val();
      let first = 1;

      /* store categorys filter in session */
      localStorage.setItem("categories-category", catFilterValue);
      this._initCategoryTiles(catFilterValue, first); 
    });
  }

  // custom bar chart init 
  async _initCustomLegendBarChart(startDate, endDate, format) {
    let data = await this._dataSet();
    let numberOfCategories = 0;

    data.forEach(cat =>{
      numberOfCategories++;
    });
    let colorRange = Helpers.generateColor('#1ed699','#2499e3',numberOfCategories);
    //console.log('Categories: ', data);

    if(startDate == null || endDate == null || format == null){
      startDate = moment().startOf('isoWeek');
      endDate = moment().endOf('isoWeek');
      format = 'd';
    }

    // clone start & end date to modify in getDateRange function
    // this will return an array of dates between the start and end date.
    let dateRange = Helpers.getDateRange(startDate.clone(), endDate.clone());
    // init the dateSet used in the chart.
    let dataSet={
      labels:[],
      datasets:[],
      icons:[]
    };

    // for each date in date range, push to labels.
    dateRange.forEach( function(date) {
      let formattedDate;

      if(format == 'd') {
        // format for Days
        formattedDate = moment(date).format('MMM D, YYYY');
      } else if(format == 'w') {
        // format for Weeks
        formattedDate = moment(date).format('WW, YYYY');
      } else if(format == 'm') {
        // format for Months
        formattedDate = moment(date).format('MMM, YYYY');
      } else if(format == 'y') {
        // format for Years
        formattedDate = moment(date).format('YYYY');
      } 

      // check if value already in array
      if(!(dataSet.labels.includes(formattedDate))){
        dataSet.labels.push(formattedDate);
      }
    });

    // generate data set for chart
    data.forEach(function(cat,i){
      // add category icon
      dataSet.icons.push(cat.icon);
      // created  current data set.
      let currSet={
        label: cat.title,
        backgroundColor: 'rgba('+ colorRange[i] +',0.1)',
        borderColor: 'rgba('+ colorRange[i] +',1)',
        borderWidth: 2,
        data: []
      };

      // init each data section by setting all to 0
      currSet.data = new Array(dataSet.labels.length).fill(0);

      // loop through transactions to see if there is an existing
      // date to add the metrical data to.
      cat.transactions.forEach(tran =>{
        // round epoch time to start of day
        let currDate = moment(tran.transactionDate).startOf('day');
        
        if(currDate.isBetween(startDate, endDate) || currDate.isSame(startDate) || currDate.isSame(endDate)){
          let index;

          if(format == 'd') {
            // format for Days
            index = currDate.diff(startDate, 'days');
          } else if(format == 'w') {
            // format for Weeks
            index = currDate.diff(startDate, 'weeks');
          } else if(format == 'm') {
            // format for Months
            index = currDate.diff(startDate, 'months');
          } else if(format == 'y') {
            // format for Years
            index = currDate.diff(startDate, 'years');
          } 

          currSet.data[index] = currSet.data[index]+tran.amount;
        }

      });

      dataSet.datasets.push(currSet);
    });

      if (document.getElementById('customLegendBarChart')) {
        const ctx = document.getElementById('customLegendBarChart').getContext('2d');
        this._customLegendBarChart = new Chart(ctx, {
          type: 'bar',
          options: {
            cornerRadius: parseInt(Globals.borderRadiusMd),
            plugins: {
              crosshair: false,
              datalabels: {display: false},
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              yAxes: [
                {
                  stacked: true,
                  gridLines: {
                    display: true,
                    lineWidth: 1,
                    color: Globals.separatorLight,
                    drawBorder: false,
                  },
                  ticks: {
                    beginAtZero: true,
                    padding: 20,
                  },
                },
              ],
              xAxes: [
                {
                  stacked: true,
                  gridLines: {display: false},
                  barPercentage: 0.5,
                },
              ],
            },
            legend: false,
            legendCallback: function (chart) {
              const legendContainer = chart.canvas.parentElement.parentElement.querySelector('.custom-legend-container');
              legendContainer.innerHTML = '';
              const legendItem = chart.canvas.parentElement.parentElement.querySelector('.custom-legend-item');
              for (let i = 0; i < chart.data.datasets.length; i++) {
                var itemClone = legendItem.content.cloneNode(true);
                var total = chart.data.datasets[i].data.reduce(function (total, num) {
                  return total + num;
                });
                itemClone.querySelector('.text').innerHTML = chart.data.datasets[i].label.toLocaleUpperCase();
                itemClone.querySelector('.value').innerHTML = '$'+total;
                itemClone.querySelector('.value').style = 'color: ' + chart.data.datasets[i].borderColor + '!important';
                itemClone.querySelector('.icon-container').style = 'border-color: ' + chart.data.datasets[i].borderColor + '!important';
                itemClone.querySelector('.icon').style = 'color: ' + chart.data.datasets[i].borderColor + '!important';
                itemClone.querySelector('.icon').setAttribute('data-cs-icon', chart.data.icons[i]);
                itemClone.querySelector('a').addEventListener('click', (event) => {
                  event.preventDefault();
                  const hidden = chart.getDatasetMeta(i).hidden;
                  chart.getDatasetMeta(i).hidden = !hidden;
                  if (event.currentTarget.classList.contains('opacity-50')) {
                    event.currentTarget.classList.remove('opacity-50');
                  } else {
                    event.currentTarget.classList.add('opacity-50');
                  }
                  chart.update();
                });
                legendContainer.appendChild(itemClone);
              }
              csicons.replace();
            },
            tooltips: {
              enabled: false,
              custom: function (tooltip) {
                var tooltipEl = this._chart.canvas.parentElement.querySelector('.custom-tooltip');
                if (tooltip.opacity === 0) {
                  tooltipEl.style.opacity = 0;
                  return;
                }
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltip.yAlign) {
                  tooltipEl.classList.add(tooltip.yAlign);
                } else {
                  tooltipEl.classList.add('no-transform');
                }
                if (tooltip.body) {
                  var chart = this;
                  var index = tooltip.dataPoints[0].index;
                  var datasetIndex = tooltip.dataPoints[0].datasetIndex;
                  var icon = tooltipEl.querySelector('.icon');
                  var iconContainer = tooltipEl.querySelector('.icon-container');
                  iconContainer.style = 'border-color: ' + tooltip.labelColors[0].borderColor + '!important';
                  icon.style = 'color: ' + tooltip.labelColors[0].borderColor + ';';
                  icon.setAttribute('data-cs-icon', chart._data.icons[datasetIndex]);
                  csicons.replace();
                  tooltipEl.querySelector('.text').innerHTML = chart._data.datasets[datasetIndex].label.toLocaleUpperCase();
                  tooltipEl.querySelector('.value').innerHTML = '$'+chart._data.datasets[datasetIndex].data[index];
                  tooltipEl.querySelector('.value').style = 'color: ' + tooltip.labelColors[0].borderColor + ';';
                }
                var positionY = this._chart.canvas.offsetTop;
                var positionX = this._chart.canvas.offsetLeft;
                tooltipEl.style.opacity = 1;
                tooltipEl.style.left = positionX + tooltip.dataPoints[0].x - 75 + 'px';
                tooltipEl.style.top = positionY + tooltip.caretY + 'px';
              },
            },
          },
          data: dataSet,
        });
        this._customLegendBarChart.generateLegend();
      }
  }

  // category tiles init
  async _initCategoryTiles(catFilterValue, first){
    if(catFilterValue == null){
      catFilterValue = ['a'];
    }

    let data = await this._dataSet();
    let categoryFilter = $('#categories-category-filter');

    data.forEach(cat =>{
      let optionHtml= `
        <option value="${cat.categoryId}">${cat.title}</option>
      `;
      categoryFilter.append(optionHtml);
    });

    if(first != 1){
      categoryFilter.val(catFilterValue).trigger("change");
    }

    const tiles = $('#category-tiles');
    tiles.html(' ');
    //console.log('Categories: ', data.categories);
    data.forEach(cat => {
      if(catFilterValue.includes(String(cat.categoryId)) || catFilterValue.includes('a') || catFilterValue.length == 0){
        let appendHtml = `
        <div class="col-12 col-sm-6 col-lg-6">
          <div class="card sh-11 hover-scale-up cursor-pointer">
            <div class="h-100 row g-0 card-body align-items-center py-3">
              <div class="col-auto pe-3">
                <div class="bg-gradient-2 sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                  <i data-cs-icon="${cat.icon}" class="text-white"></i>
                </div>
              </div>
              <div class="col">
                <div class="row gx-2 d-flex align-content-center">
                  <div class="col-12 col-xl d-flex">
                    <div class="p mb-0 d-flex align-items-center lh-1-25">${cat.title}</div>
                  </div>
                  <div class="col-12 col-xl-auto">
                    <div class="cta-2 text-primary">$${Helpers.AddCommas(cat.totalExpense)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        `;
        tiles.append(appendHtml);
      }
    });

    let addNew=`
    <div class="col-12 col-sm-6 col-lg-6">
      <div class="card sh-11 hover-scale-up cursor-pointer">
        <div class="h-100 row g-0 card-body align-items-center py-3">
          <div class="col-auto pe-3">
            <div class="sh-5 sw-5 border border-dashed rounded-xl mx-auto">
              <div class="bg-separator w-100 h-100 rounded-xl d-flex justify-content-center align-items-center mb-2">
                <i data-cs-icon="plus" class="text-white"></i>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="row gx-2 d-flex align-content-center">
              <div class="col-12 col-xl d-flex">
                <div class="p mb-0 d-flex align-items-center lh-1-25 text-muted">Add New Category</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
    tiles.append(addNew);

    this._initIcons();
  }

  // expense list init
  async _initExpenseList(startDate, endDate, catFilterValue, first) {
    if(startDate == null || endDate == null || catFilterValue == null){
      startDate = moment().startOf('isoWeek');
      endDate = moment().endOf('isoWeek');
      catFilterValue = ['a'];
    }

    let data = await this._dataSet();
    let numberOfCategories = 0;
    let categoryFilter = $('#expense-list-category-filter');

    data.forEach(cat =>{
      numberOfCategories++;
      let optionHtml= `
        <option value="${cat.categoryId}">${cat.title}</option>
      `;
      categoryFilter.append(optionHtml);
    });

    if(first != 1){
    categoryFilter.val(catFilterValue).trigger("change");
    }

    let colorRange = Helpers.generateColor('#1ed699','#2499e3',numberOfCategories);

    const expenseStats = $('#expense-stats');
    expenseStats.html(' ');

    // generate data set for chart
    data.forEach(function(cat,i){
      if(catFilterValue.includes(String(cat.categoryId)) || catFilterValue.includes('a') || catFilterValue.length == 0){
        cat.transactions.forEach(tran =>{
          let currDate = moment(tran.transactionDate);

          if(currDate.isBetween(startDate, endDate) || currDate.isSame(startDate) || currDate.isSame(endDate)){
            let formattedDate = currDate.format('MMM D, YYYY');
          
            let appendHtml = `
              <div class="card mb-2 sh-10 sh-md-8">
                <div class="card-body pt-0 pb-0 h-100">
                  <div class="row g-0 d-flex h-100 align-items-center">
                    <div class="col-auto pe-3 align-items-center">
                      <canvas id="donut-${tran.transactionId}" class="col-auto sw-6 sh-6"></canvas>
                    </div>
                    <div class="col-6 col-md-2 d-flex justify-content-start align-items-center mb-2">
                      <a href="#" class="custom-legend-container body-link text-truncate"></a>
                      <template class="custom-legend-item">
                        <div class="text-small text mt-2">$</div>
                        <div class="cta-3 text-primary value">$</div>
                      </template>
                    </div>
                    <div class="col-7 col-md-4 d-flex align-items-center justify-content-end mb-1">
                      <span class="badge me-1" 
                      style="box-shadow: inset 0 0 0 1px rgba(${colorRange[i]},1) !important;
                      color: rgba(${colorRange[i]},1) !important;">${cat.title}</span>
                    </div>
                    <div class="col col-md-4 d-flex align-items-center justify-content-end text-muted text-medium">
                      <span>${formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;

            expenseStats.append(appendHtml);

            ChartsExtend.SmallDoughnutChart('donut-'+tran.transactionId, [tran.amount, (cat.totalExpense-tran.amount)], tran.note);
          }
        });
      }
    });

    let addNew=`
    <div class="card mb-2 sh-10 sh-md-8">
      <div class="hover-scale-up cursor-pointer pt-0 pb-0 h-100">
        <div class="h-100 row g-0 card-body align-items-center py-1">
          <div class="col-auto pe-3">
            <div class="sh-5 sw-5 border border-dashed rounded-xl mx-auto">
              <div class="bg-separator w-100 h-100 rounded-xl d-flex justify-content-center align-items-center">
                <i data-cs-icon="plus" class="text-white"></i>
              </div>
            </div>
          </div>
          <div class="col justify-content-start">
            <div class="row d-flex align-content-center">
              <div class="p mb-0 d-flex align-items-center lh-1-25 text-muted">Add New Expense</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    expenseStats.append(addNew);
    this._initIcons();
  }

  // init all select2 dropdowns
  _initSelect2() {
    // Category Breakdown select2 filter init
    $('#category-breakdown-date-filter').select2({minimumResultsForSearch: Infinity, placeholder: ''});
    $('#category-breakdown-date-format-filter').select2({minimumResultsForSearch: Infinity, placeholder: ''});

    // Expense List select2 filter init
    $('#expense-list-date-filter').select2({minimumResultsForSearch: Infinity, placeholder: ''});
    $('#expense-list-category-filter').val(["a"]);
    $('#expense-list-category-filter').select2({minimumResultsForSearch: Infinity, placeholder: 'Select 1 or more', tags: true});

    // Categories select2 filter init
    $('#categories-date-filter').select2({minimumResultsForSearch: Infinity, placeholder: ''});
    $('#categories-category-filter').val(["a"]);
    $('#categories-category-filter').select2({minimumResultsForSearch: Infinity, placeholder: 'Select 1 or more', tags: true});
  }

  // init all datepickers
  _initDatePickers() {

    // Category Breakdown Date Picker Init
    $('#category-breakdown-date-picker').datepicker({
      weekStart: 1
    });

    // Expense List Date Picker Init
    $('#expense-list-date-picker').datepicker({
      weekStart: 1
    });

    // Expense List Date Picker Init
    $('#categories-date-picker').datepicker({
      weekStart: 1
    });
  }

  // Dashboard Take a Tour
  _initTour() {
    if (typeof introJs !== 'undefined' && document.getElementById('dashboardTourButton') !== null) {
      document.getElementById('dashboardTourButton').addEventListener('click', (event) => {
        introJs()
          .setOption('nextLabel', '<span>Next</span><i class="cs-chevron-right"></i>')
          .setOption('prevLabel', '<i class="cs-chevron-left"></i><span>Prev</span>')
          .setOption('skipLabel', '<i class="cs-close"></i>')
          .setOption('doneLabel', '<i class="cs-check"></i><span>Done</span>')
          .setOption('overlayOpacity', 0.5)
          .start();
      });
    }
  }
}