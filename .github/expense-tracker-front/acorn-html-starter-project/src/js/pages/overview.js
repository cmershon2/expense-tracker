/**
 *
 * Overview
 *
 * Overview.html page content scripts. Initialized from scripts.js file.
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
    this._initExpenseListFilters();
    this._initCategoriesFilters();
    this._initCategoryBreakdownFilters();
    this._initAddCategoryForm();
    this._initAddExpenseForm();
  }

  _initEvents() {
    // stacked modals fix
    $(document).on('show.bs.modal', '.modal', function () {
      var zIndex = 1040 + (10 * $('.modal:visible').length);
      $(this).css('z-index', zIndex);
      setTimeout(function() {
          $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
      }, 0);
    });

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

      if(categoriesCat != null) {
        this._initCategoryTiles('', 1);
      } else {
        this._initCategoryTiles(categoriesCat.split(','), 1);
      }
    });
  }

  // get data & format it
  async _dataSet(){
    return new Promise(async function(resolve) {
      let index = 0;
      await Helpers.getCategories().then(res => {
        if(res.length > 0){
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
        } else {
          resolve(res);
        }
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
    let dropDownMenu = $('#category-breakdown-drop-down');
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
    if(dateRangeElement.val() != 'c'){
      startDateElement.attr("disabled","");
      endDateElement.attr("disabled","");
    }

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

      dropDownMenu.removeClass("show");
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
    if(dateRangeElement.val() != 'c'){
      startDateElement.attr("disabled","");
      endDateElement.attr("disabled","");
    }

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
    let colorRange;

    if(data.length > 0){
      data.forEach(cat =>{
        numberOfCategories++;
      });
      colorRange = Helpers.generateColor('#1ed699','#2499e3',numberOfCategories);
    }

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
    if(data.length > 0){
      $('#chart-no-data').addClass('d-none');
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
      } else {
          $('#chart-no-data').removeClass('d-none');
      }
  }

  // category tiles init
  async _initCategoryTiles(catFilterValue, first){
    if(catFilterValue == null){
      catFilterValue = ['a'];
    }

    let data = await this._dataSet();

    let categoryFilter = $('#categories-category-filter');
    let expenseFilter = $('#expense-list-category-filter');
    let expenseAddDropdown = $('#expenseCategory');
    let iconArray = [
      'acorn',
      'air-balloon',
      'anchor',
      'antenna',
      'ball',
      'balloon',
      'banana',
      'basket',
      'book',
      'burger',
      'cart',
      'clock',
      'coffee-to-go',
      'colors',
      'compass',
      'controller',
      'cupcake',
      'cutlery',
      'delivery-truck',
      'dollar',
      'electricity',
      'email',
      'euro',
      'factory',
      'flash',
      'gear',
      'gift',
      'glasses',
      'handbag',
      'health',
      'heart',
      'home',
      'laptop',
      'message',
      'mobile',
      'money',
      'moon',
      'petrol',
      'phone',
      'plane',
      'pound',
      'prize',
      'router',
      'shield',
      'shipping',
      'shop',
      'speaker',
      'strawberry',
      'suitcase',
      'thermometer',
      'tool',
      'tree',
      'wallet',
      'water',
      'wifi',
      'wine',
      'wizard'
    ];

    iconArray.forEach(icon =>{
      if (!($(`#categoryIcon`).find("option[value='" + icon + "']").length)) {
          // Create a DOM Option and pre-select by default
          let newOption = new Option(icon, icon, true, true);
          // Append it to the select
          $(`#categoryIcon`).append(newOption);
      }
    });
      $(`#categoryIcon`).val('');

      // Add category icons to add new category modal
      $('#categoryIcon').select2({
        dropdownParent: $(`#addCategoryModal`),
        placeholder: 'Category Icon',
        templateSelection: function formatText(item) {
          if (jQuery(item.element).val()) {
            return jQuery(
              '<div></span> <span class="align-middle d-inline-block lh-1">' +
              item.text +
              ': </span><span class="align-middle d-inline-block"><i data-cs-icon="' +
              item.text +
              '"></i></div>'
            );
          }else{
            return item.text;
          }
        },
        templateResult: function formatText(item) {
          if (jQuery(item.element).val()) {
            return jQuery(
              '<div><span class="align-middle d-inline-block lh-1">' +
              item.text +
              '</span></div>'
            );
          }
        }
      });

      $('#categoryIcon').on('select2:select', e => {
        this._initIcons();
      });
 

    let tiles = $('#category-tiles');
    let modalCont = $('#category-details-modal');
    tiles.html(' ');
    modalCont.html(' ');
    if(data.length > 0 ){
      data.forEach(cat => {
        if(first != 1){
          let optionHtml= `
            <option value="${cat.categoryId}">${cat.title}</option>
          `;
          categoryFilter.append(optionHtml);
        }

        if(first != 1){
          categoryFilter.val(catFilterValue).trigger("change");
        }

        if(catFilterValue.includes(String(cat.categoryId)) || catFilterValue.includes('a') || catFilterValue.length == 0){
          let appendHtml = `
          <div class="col-12 col-sm-6 col-lg-6">
            <div class="card sh-11 hover-scale-up cursor-pointer" data-bs-toggle="modal" data-bs-target="#category-${cat.categoryId}">
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

          // Add edit modal for users to change category settings
          let modalHtml = `
          <div class="modal fade" id="category-${cat.categoryId}" tabindex="-2" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Category Details</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id='edit-category-${cat.categoryId}' class="tooltip-end-bottom" novalidate>
                  <div class="modal-body">
                      <div class="mb-3 filled form-group tooltip-end-top">
                        <i data-cs-icon="edit"></i>
                        <input class="form-control" placeholder="Category Name" name="categoryName"  id="category-${cat.categoryId}-name" disabled required/>
                      </div>
                      <div class="mb-3 filled form-group tooltip-end-top">
                        <textarea placeholder="Description" class="form-control" name="categoryDescription" id='category-${cat.categoryId}-description' rows="2" disabled required></textarea>
                        <i data-cs-icon="notebook-3"></i>
                      </div>
                      <div class="w-100 filled mb-3 form-group tooltip-end-top">
                        <i data-cs-icon="settings-2"></i>
                        <select id="category-${cat.categoryId}-icon" class="form-control" name="categoryIcon" disabled required>
                        </select>
                      </div>
                      <hr>
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="category-edit-mode-${cat.categoryId}">
                        <label class="form-check-label" for="category-edit-mode-${cat.categoryId}">Edit Mode</label>
                      </div>
                  </div>
                  <div class="modal-footer">
                    <div class="col">
                      <button id='category-${cat.categoryId}-cancel' type="button" class="w-100 btn btn-icon btn-icon-start btn-primary mb-1" data-bs-dismiss="modal" aria-label="Close"><i data-cs-icon="close-circle"></i><span> Cancel</span></button>
                    </div>
                    <div class="col">
                      <button id='category-${cat.categoryId}-save' type="submit" class="w-100 btn btn-icon btn-icon-start btn-success mb-1" disabled><i data-cs-icon="save"></i><span> Save</span></button>
                    </div>
                    <div class="col">
                      <button id='category-${cat.categoryId}-delete'type="button" class="w-100 btn btn-icon btn-icon-start btn-danger mb-1" data-bs-toggle="modal" data-bs-target="#category-${cat.categoryId}-del-modal" disabled><i data-cs-icon="bin"></i><span> Delete</span></button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          `;

          // delete modal to confirm deletion
          let deleteModal = `
          <div class="modal fade" id="category-${cat.categoryId}-del-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" role="dialog" aria-labelledby="staticBackdropLabel" aria-modal="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="staticBackdropLabel">Delete Category</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <h3>Are you sure you want to delete the "<i>${cat.title}</i>" category?</h3>
                  <p>Please know that when deleting a category, <b>all</b> associated expenses are deleted.</p>
                </div>
                <div class="modal-footer">
                  <div class="row g-0 d-flex w-100 align-items-center d-grid gap-2 ">
                    <div class="col">
                      <button data-bs-dismiss="modal" aria-label="Close" type="button" class="w-100 btn btn-icon btn-icon-start btn-primary mb-1"><i data-cs-icon="close-circle"></i><span> Cancel</span></button>
                    </div>
                    <div class="col">
                      <button data-bs-dismiss="modal" aria-label="Close" id='category-${cat.categoryId}-delete-del-modal'type="button" class="w-100 btn btn-icon btn-icon-start btn-danger mb-1"><i data-cs-icon="bin"></i><span> Delete</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          `;


          tiles.append(appendHtml);
          modalCont.append(modalHtml);
          modalCont.append(deleteModal);

          $(`#category-${cat.categoryId}-name`).val(cat.title);
          $(`#category-${cat.categoryId}-description`).val(cat.description);

          let formEditCat = $(`#edit-category-${cat.categoryId}`);
          let validateOptions = {
            rules: {
              categoryName: {
                required: true,
                maxlength: 20
              },
              categoryDescription: {
                required: true,
                maxlength: 255
              },
              categoryIcon: {
                required: true
              }
            },
            messages: {
              categoryName: {
                categoryName: 'Your category name must be under 20 characters.',
              },
              categoryDescription: {
                categoryDescription: 'Your category description must be under 255 characters.',
              }
            }
          };
          jQuery(formEditCat).validate(validateOptions);

          // listen to if category should be updated & validate form.
          formEditCat.on('submit', async event => {
            event.preventDefault();
            event.stopPropagation();
            if (jQuery(formEditCat).valid()) {
              let formValues = {
                title: $(`#category-${cat.categoryId}-name`).val(),
                description: $(`#category-${cat.categoryId}-description`).val(),
                icon: $(`#category-${cat.categoryId}-icon`).val()
              };

              await Helpers.putCategories(cat.categoryId,formValues).then( e =>{
                jQuery.notify(
                  {title: 'Category Updated', message: `Your category, "${formValues.title}", was successfully updated.`, icon:'cs-info-hexagon'},
                    {
                      type: 'success',
                      delay: 5000,
                  }
                );
                
                // wipe filters
                localStorage.setItem("categories-category", ['a']);
                categoryFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
                expenseFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
                expenseAddDropdown.html('');
                $(`#category-${cat.categoryId}`).modal('hide');
    
                this._customLegendBarChart && this._customLegendBarChart.destroy();
                this._initCategoryBreakdownFilters();
                this._initExpenseListFilters();
                this._initCategoriesFilters();
              }).catch(error =>{

                jQuery.notify(
                  {title: 'An Error Occurred', message: `Your category could not be updated at this time. Please try again later.`, icon:'cs-error-hexagon'},
                  {
                    type: 'danger',
                    delay: 5000,
                  }
                );
                
                $(`#category-${cat.categoryId}`).modal('hide');
              });
            }
          });

          iconArray.forEach(icon =>{
            if (!($(`#category-${cat.categoryId}-icon`).find("option[value='" + icon + "']").length)) {
              // Create a DOM Option and pre-select by default
              let newOption = new Option(icon, icon, true, true);
              // Append it to the select
              $(`#category-${cat.categoryId}-icon`).append(newOption);
            }
          });

          $(`#category-${cat.categoryId}-icon`).val(cat.icon);

          $(`#category-${cat.categoryId}-icon`).select2({
            dropdownParent: $(`#category-${cat.categoryId}`),
            placeholder: 'Category Icon',
            templateSelection: function formatText(item) {
              if (jQuery(item.element).val()) {
                return jQuery(
                  '<div></span> <span class="align-middle d-inline-block lh-1">' +
                  item.text +
                  ': </span><span class="align-middle d-inline-block"><i data-cs-icon="' +
                  item.text +
                  '"></i></div>'
                );
              }else{
                return item.text;
              }
            },
            templateResult: function formatText(item) {
              if (jQuery(item.element).val()) {
                return jQuery(
                  '<div><span class="align-middle d-inline-block lh-1">' +
                  item.text +
                  '</span></div>'
                );
              }
            }
          });

          // on selected from drop-down init icons
          $(`#category-${cat.categoryId}-icon`).on('select2:select', e => {
            this._initIcons();
          });

          // listen to entering/exiting edit mode
          $(`#category-edit-mode-${cat.categoryId}`).change(e =>{
            if ($(`#category-edit-mode-${cat.categoryId}`).is(':checked')) {
              // in edit mode
              $(`#category-${cat.categoryId}-name`).removeAttr('disabled');
              $(`#category-${cat.categoryId}-description`).removeAttr('disabled');
              $(`#category-${cat.categoryId}-icon`).removeAttr('disabled');
              $(`#category-${cat.categoryId}-save`).removeAttr('disabled');
              $(`#category-${cat.categoryId}-delete`).removeAttr('disabled');
            } else {
              // not in edit mode
              $(`#category-${cat.categoryId}-name`).attr('disabled', 'on');
              $(`#category-${cat.categoryId}-description`).attr('disabled', 'on');
              $(`#category-${cat.categoryId}-icon`).attr('disabled', 'on');
              $(`#category-${cat.categoryId}-save`).attr('disabled', 'on');
              $(`#category-${cat.categoryId}-delete`).attr('disabled', 'on');
              $(`#category-${cat.categoryId}-name`).val(cat.title);
              $(`#category-${cat.categoryId}-description`).val(cat.description);
              $(`#category-${cat.categoryId}-icon`).val(cat.icon).trigger('change');
              this._initIcons();
            }
          });

          // listen to if modal is closed
          $(`#category-${cat.categoryId}`).on('hidden.bs.modal', e => {
            // reset to original values & set to disabled fields
            $(`#category-edit-mode-${cat.categoryId}`).prop("checked", false);
            $(`#category-${cat.categoryId}-name`).attr('disabled', 'on');
            $(`#category-${cat.categoryId}-description`).attr('disabled', 'on');
            $(`#category-${cat.categoryId}-icon`).attr('disabled', 'on');
            $(`#category-${cat.categoryId}-save`).attr('disabled', 'on');
            $(`#category-${cat.categoryId}-delete`).attr('disabled', 'on');
            $(`#category-${cat.categoryId}-name`).val(cat.title);
            $(`#category-${cat.categoryId}-description`).val(cat.description);
            $(`#category-${cat.categoryId}-icon`).val(cat.icon).trigger('change');
            this._initIcons();
          });

          // listen to if category should be deleted
          $(`#category-${cat.categoryId}-delete-del-modal`).on('click', async e => {
            await Helpers.deleteCategory(cat.categoryId).then(e => {
              jQuery.notify(
                {title: 'Category Deleted', message: `The category, "${cat.title}", was successfully deleted.`, icon:'cs-info-hexagon'},
                  {
                    type: 'success',
                    delay: 5000,
                }
              );
              
              // wipe filters
              localStorage.setItem("categories-category", ['a']);
              categoryFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
              expenseFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
              expenseAddDropdown.html('');
              $(`#category-${cat.categoryId}`).modal('hide');

              this._customLegendBarChart && this._customLegendBarChart.destroy();
              $('#legend-container').html(' ');
              this._initCategoryBreakdownFilters();
              this._initExpenseListFilters();
              this._initCategoriesFilters();
            }).catch(error =>{
              jQuery.notify(
                {title: 'An Error Occurred', message: `Your category could not be deleted at this time. Please try again later.`, icon:'cs-error-hexagon'},
                  {
                    type: 'danger',
                    delay: 5000,
                }
              );
              
              $(`#category-${cat.categoryId}`).modal('hide');
            });
          });
        }
      });

      let addNew=`
      <div class="col-12 col-sm-6 col-lg-6">
        <div class="card sh-11 hover-scale-up cursor-pointer" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
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

    } else {
      let addNew=`
      <div class="card border border-dashed h-100 cursor-pointer" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
        <div class="card-body pt-0 pb-0 h-100">
          <div class="row g-0 d-flex align-items-center gap-2 h-100">
            <div class="col-5 d-flex justify-content-end">
              <div class="sh-5 sw-5 border border-dashed rounded-xl">
                <div class="bg-separator w-100 h-100 rounded-xl d-flex justify-content-center align-items-center">
                    <i data-cs-icon="plus" class="text-white"></i>
                </div>
              </div>
            </div>
            <div class="col d-flex">
              <div class="p text-muted">Get started by creating a Category</div>
            </div>
          </div>
        </div>
      </div>
      `;

      tiles.append(addNew);
    }

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
    data.forEach(cat => {
      numberOfCategories++;
      if(first != 1){
        let optionHtml= `
          <option value="${cat.categoryId}">${cat.title}</option>
        `;
        categoryFilter.append(optionHtml);
      }

      if(first != 1){
        categoryFilter.val(catFilterValue).trigger("change");
      }
    })

    let colorRange = Helpers.generateColor('#1ed699','#2499e3',numberOfCategories);

    let expenseStats = $('#expense-stats');
    let expenseModals = $('#expense-details-modal');
    
    expenseStats.html(' ');
    expenseModals.html(' ');

    // generate data set for chart

    if(data.length > 0){
      data.forEach((cat,i)=>{

        if (!($(`#expenseCategory`).find("option[value='" + cat.categoryId + "']").length)) {
            // Create a DOM Option and pre-select by default
            let newOption = new Option(cat.title, cat.categoryId, true, true);
            // Append it to the select
            $(`#expenseCategory`).append(newOption);
        }

        $(`#expenseCategory`).val('');
    
        // Add category to add new expense modal
        $('#expenseCategory').select2({
          dropdownParent: $(`#addExpenseModal`),
          placeholder: 'Category',
          templateSelection: function formatText(item) {
            if (jQuery(item.element).val()) {
              return jQuery(
                '<div><span class="align-middle d-inline-block lh-1">' +
                item.text +
                '</span></div>'
              );
            }else{
              return item.text;
            }
          },
          templateResult: function formatText(item) {
            if (jQuery(item.element).val()) {
              return jQuery(
                '<div><span class="align-middle d-inline-block lh-1">' +
                item.text +
                '</span></div>'
              );
            }
          }
        });

        if(catFilterValue.includes(String(cat.categoryId)) || catFilterValue.includes('a') || catFilterValue.length == 0){
          cat.transactions.forEach(tran =>{
            let currDate = moment(tran.transactionDate);

            if(currDate.isBetween(startDate, endDate) || currDate.isSame(startDate) || currDate.isSame(endDate)){
              let formattedDate = currDate.format('MMM D, YYYY');
            
              let appendHtml = `
                <div class="card mb-2 sh-10 sh-md-8 hover-scale-up cursor-pointer" data-bs-toggle="modal" data-bs-target="#expense-${tran.transactionId}">
                  <div class="card-body pt-0 pb-0 h-100">
                    <div class="row g-0 d-flex h-100 align-items-center">
                      <div class="col-auto pe-3 align-items-center">
                        <canvas id="donut-${tran.transactionId}" class="col-auto sw-6 sh-6"></canvas>
                      </div>
                      <div class="col-6 col-md-2 d-flex justify-content-start align-items-center mb-2">
                        <span class="custom-legend-container text-truncate"></span>
                        <template class="custom-legend-item">
                          <div class="text-small text mt-2"></div>
                          <div class="cta-3 text-primary value"></div>
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

              // Add edit modal for users to change expense settings
              let modalHtml = `
              <div class="modal fade" id="expense-${tran.transactionId}" tabindex="-2" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Expense Details</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id='edit-expense-${tran.transactionId}' class="tooltip-end-bottom" novalidate>
                      <div class="modal-body">
                        <div class="mb-3 filled form-group tooltip-end-top">
                          <i data-cs-icon="diagram-1"></i>
                          <input class="form-control" placeholder="Category" name="expenseCategory"  id="expense-${tran.transactionId}-category" disabled/>
                          <div id="expenseCategoryHelpBlock" class="form-text">
                            Note: once an expense has been created, the category can not be changed.
                          </div>
                        </div>
                        <hr>
                        <div class="mb-3 filled form-group tooltip-end-top">
                          <i data-cs-icon="edit"></i>
                          <input class="form-control" placeholder="Expense Name" name="expenseName"  id="expense-${tran.transactionId}-name" disabled required/>
                        </div>
                        <div class="mb-3 filled form-group tooltip-end-top">
                          <input placeholder="Amount" class="form-control" name="expenseAmount" id='expense-${tran.transactionId}-amount' disabled required />
                          <i data-cs-icon="dollar"></i>
                        </div>
                        <div class="filled">
                          <i data-cs-icon="calendar"></i>
                          <input type="text" class="form-control" placeholder="Date" id="expense-${tran.transactionId}-date" disabled required>
                        </div>
                        <hr>
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" id="expense-edit-mode-${tran.transactionId}">
                          <label class="form-check-label" for="expense-edit-mode-${tran.transactionId}">Edit Mode</label>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <div class="col">
                          <button id='expense-${tran.transactionId}-cancel' type="button" class="w-100 btn btn-icon btn-icon-start btn-primary mb-1" data-bs-dismiss="modal" aria-label="Close"><i data-cs-icon="close-circle"></i><span> Cancel</span></button>
                        </div>
                        <div class="col">
                          <button id='expense-${tran.transactionId}-save' type="submit" class="w-100 btn btn-icon btn-icon-start btn-success mb-1" disabled><i data-cs-icon="save"></i><span> Save</span></button>
                        </div>
                        <div class="col">
                          <button id='expense-${tran.transactionId}-delete'type="button" class="w-100 btn btn-icon btn-icon-start btn-danger mb-1" data-bs-toggle="modal" data-bs-target="#expense-${tran.transactionId}-del-modal" disabled><i data-cs-icon="bin"></i><span> Delete</span></button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              `;

              // delete modal to confirm deletion
              let deleteModal = `
              <div class="modal fade" id="expense-${tran.transactionId}-del-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" role="dialog" aria-labelledby="staticBackdropLabel" aria-modal="true">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="staticBackdropLabel">Delete Category</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <h3>Are you sure you want to delete the "<i>${tran.note}</i>" category?</h3>
                      <p>Please know that when deleting a category, <b>all</b> associated expenses are deleted.</p>
                    </div>
                    <div class="modal-footer">
                      <div class="row g-0 d-flex w-100 align-items-center d-grid gap-2 ">
                        <div class="col">
                          <button data-bs-dismiss="modal" aria-label="Close" type="button" class="w-100 btn btn-icon btn-icon-start btn-primary mb-1"><i data-cs-icon="close-circle"></i><span> Cancel</span></button>
                        </div>
                        <div class="col">
                          <button data-bs-dismiss="modal" aria-label="Close" id='expense-${tran.transactionId}-delete-del-modal'type="button" class="w-100 btn btn-icon btn-icon-start btn-danger mb-1"><i data-cs-icon="bin"></i><span> Delete</span></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              `;

              expenseStats.append(appendHtml);
              expenseModals.append(modalHtml);
              expenseModals.append(deleteModal);

              ChartsExtend.SmallDoughnutChart('donut-'+tran.transactionId, [tran.amount, (cat.totalExpense-tran.amount)], tran.note);
              
              // create mask for amount
              let mask = IMask(document.querySelector(`#expense-${tran.transactionId}-amount`), {
                mask: Number,
                min: 0,
                max: 99999999.99,
                signed: false,  // disallow negative
                thousandsSeparator: ',',
                radix: '.',  // fractional delimiter
                mapToRadix: ['.']  // symbols to process as radix
              });

              $(`#expense-${tran.transactionId}-name`).val(tran.note);
              $(`#expense-${tran.transactionId}-category`).val(cat.title);
              $(`#expense-${tran.transactionId}-amount`).val(Helpers.AddCommas(tran.amount));
              mask.updateValue();

              $(`#expense-${tran.transactionId}-date`).val(currDate.format('MM/DD/YYYY'));

              // set date picker
              $(`#expense-${tran.transactionId}-date`).datepicker("setDate",currDate.format('MM/DD/YYYY'));
              $(`#expense-${tran.transactionId}-date`).datepicker("update");
      
              // listen to entering/exiting edit mode
              $(`#expense-edit-mode-${tran.transactionId}`).change(e =>{
                if ($(`#expense-edit-mode-${tran.transactionId}`).is(':checked')) {
                  // in edit mode
                  $(`#expense-${tran.transactionId}-name`).removeAttr('disabled');
                  $(`#expense-${tran.transactionId}-amount`).removeAttr('disabled');
                  $(`#expense-${tran.transactionId}-date`).removeAttr('disabled');
                  $(`#expense-${tran.transactionId}-save`).removeAttr('disabled');
                  $(`#expense-${tran.transactionId}-delete`).removeAttr('disabled');
                } else {
                  // not in edit mode
                  $(`#expense-${tran.transactionId}-name`).attr('disabled', 'on');
                  $(`#expense-${tran.transactionId}-amount`).attr('disabled', 'on');
                  $(`#expense-${tran.transactionId}-date`).attr('disabled', 'on');
                  $(`#expense-${tran.transactionId}-save`).attr('disabled', 'on');
                  $(`#expense-${tran.transactionId}-delete`).attr('disabled', 'on');

                  $(`#expense-${tran.transactionId}-name`).val(tran.note);
                  $(`#expense-${tran.transactionId}-amount`).val(Helpers.AddCommas(tran.amount));
                  mask.updateValue();
                  $(`#expense-${tran.transactionId}-date`).val(currDate.format('MM/DD/YYYY'));

                  // set & update date picker
                  $(`#expense-${tran.transactionId}-date`).datepicker("setDate",currDate.format('MM/DD/YYYY'));
                  $(`#expense-${tran.transactionId}-date`).datepicker("update");
                }
              });
      
              // listen to if modal is closed
              $(`#expense-${tran.transactionId}`).on('hidden.bs.modal', e => {
                // reset to original values & set to disabled fields
                $(`#expense-edit-mode-${tran.transactionId}`).prop("checked", false);
                $(`#expense-${tran.transactionId}-name`).attr('disabled', 'on');
                $(`#expense-${tran.transactionId}-amount`).attr('disabled', 'on');
                $(`#expense-${tran.transactionId}-date`).attr('disabled', 'on');
                $(`#expense-${tran.transactionId}-save`).attr('disabled', 'on');
                $(`#expense-${tran.transactionId}-delete`).attr('disabled', 'on');

                $(`#expense-${tran.transactionId}-name`).val(tran.note);
                $(`#expense-${tran.transactionId}-amount`).val(Helpers.AddCommas(tran.amount));
                mask.updateValue();
                $(`#expense-${tran.transactionId}-date`).val(currDate.format('MM/DD/YYYY'));

                // set & update date picker
                $(`#expense-${tran.transactionId}-date`).datepicker("setDate",currDate.format('MM/DD/YYYY'));
                $(`#expense-${tran.transactionId}-date`).datepicker("update");
              });

              let formEditExp = $(`#edit-expense-${tran.transactionId}`);
              let validateOptions = {
                rules: {
                  expenseName: {
                    required: true,
                    maxlength: 50
                  },
                  expenseAmount: {
                    required: true,
                  },
                  expenseCategory: {
                    required: true,
                    maxlength: 20
                  },
                  expenseDate: {
                    required: true
                  }
                },
                messages: {
                  expenseName: {
                    expenseName: 'Your expense name must be under 50 characters.',
                  },
                  expenseCategory: {
                    expenseCategory: 'Your category name must be under 20 characters.',
                  },
                }
              };
              jQuery(formEditExp).validate(validateOptions);
      
              // listen to if expense should be updated & validate form.
              formEditExp.on('submit', async event => {
                event.preventDefault();
                event.stopPropagation();
                if (jQuery(formEditExp).valid()) {
                  let formValues = {
                    amount: parseFloat($(`#expense-${tran.transactionId}-amount`).val().replace(/,/g, "")),
                    note: $(`#expense-${tran.transactionId}-name`).val(),
                    transactionDate: moment($(`#expense-${tran.transactionId}-date`).val()).valueOf()
                  };

                  await Helpers.putExpense(tran.categoryId,tran.transactionId,formValues).then( e =>{
                    jQuery.notify(
                      {title: 'Expense Updated', message: `Your expense, "${formValues.note}", was successfully updated.`, icon:'cs-info-hexagon'},
                        {
                          type: 'success',
                          delay: 5000,
                      }
                    );
                    
                    $(`#expense-${tran.transactionId}`).modal('hide');
        
                    this._customLegendBarChart && this._customLegendBarChart.destroy();
                    this._initCategoryBreakdownFilters();
                    this._initExpenseListFilters();
                    this._initCategoriesFilters();
                  }).catch(error =>{
                    jQuery.notify(
                      {title: 'An Error Occurred', message: `Your expense could not be updated at this time. Please try again later.`, icon:'cs-error-hexagon'},
                      {
                        type: 'danger',
                        delay: 5000,
                      }
                    );
                    
                    $(`#expense-${tran.transactionId}`).modal('hide');
                  });

                }
              });

              // listen to if category should be deleted
              $(`#expense-${tran.transactionId}-delete-del-modal`).on('click', async e => {
                await Helpers.deleteExpense(tran.categoryId, tran.transactionId).then(e => {
                  jQuery.notify(
                    {title: 'Expense Deleted', message: `The expense, "${tran.note}", was successfully deleted.`, icon:'cs-info-hexagon'},
                      {
                        type: 'success',
                        delay: 5000,
                    }
                  );
                  
                  $(`#expense-${tran.transactionId}`).modal('hide');
        
                  this._customLegendBarChart && this._customLegendBarChart.destroy();
                  this._initCategoryBreakdownFilters();
                  this._initExpenseListFilters();
                  this._initCategoriesFilters();
                }).catch(error =>{
                  jQuery.notify(
                    {title: 'An Error Occurred', message: `Your expense could not be deleted at this time. Please try again later.`, icon:'cs-error-hexagon'},
                      {
                        type: 'danger',
                        delay: 5000,
                    }
                  );
                  
                  $(`#expense-${tran.transactionId}`).modal('hide');
                });
              });

            }
          });
        }
      });
      let addNew=`
      <div class="card mb-2 sh-10 sh-md-8 hover-scale-up cursor-pointer" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
        <div class="card-body pt-0 pb-0 h-100">
          <div class="h-100 row g-0 align-items-center py-1">
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

    } else {
      let addNew=`
      <div class="card border border-dashed h-100 cursor-pointer" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
        <div class="card-body pt-0 pb-0 h-100">
          <div class="row g-0 d-flex align-items-center gap-2 h-100">
            <div class="col-5 d-flex justify-content-end">
              <div class="sh-5 sw-5 border border-dashed rounded-xl">
                <div class="bg-separator w-100 h-100 rounded-xl d-flex justify-content-center align-items-center">
                    <i data-cs-icon="plus" class="text-white"></i>
                </div>
              </div>
            </div>
            <div class="col d-flex">
              <div class="p text-muted">Get started by creating a Category</div>
            </div>
          </div>
        </div>
      </div>
      `;

      expenseStats.append(addNew);
    }

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

    // Add New Expense Date Picker Init
    $('#expenseDate').datepicker({
      weekStart: 1,
      autoclose: true
    });
  }

  async _initAddExpenseForm() {
    let form = document.getElementById('add-Expense-Form');
    let categoryFilter = $('#categories-category-filter');
    let expenseFilter = $('#expense-list-category-filter');
    if (!form) {
      return;
    }
    let validateOptions = {
      rules: {
        expenseCategory: {
          required: true,
          maxlength: 20
        },
        expenseName: {
          required: true,
          maxlength: 50
        },
        expenseAmount: {
          required: true
        },
        expenseDate: {
          required: true
        }
      },
      messages: {
        expenseCategory: {
          expenseCategory: 'Your category name must be under 20 characters.',
        },
        expenseName: {
          expenseName: 'Your expense name must be under 50 characters.',
        }
      }
    };
    jQuery(form).validate(validateOptions);

    let mask = IMask(document.querySelector('#expenseAmount'), {
      mask: Number,
      min: -1,
      max: 99999999.99,
      signed: false,  // disallow negative
      thousandsSeparator: ',',
      radix: '.',  // fractional delimiter
      mapToRadix: ['.']  // symbols to process as radix
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopPropagation();
      if (jQuery(form).valid()) {
        let formValues = {
          note: $('#expenseName').val(),
          amount: parseFloat($('#expenseAmount').val().replace(/,/g, "")),
          transactionDate: moment($('#expenseDate').val()).valueOf()
        };
        
        await Helpers.addExpense($('#expenseCategory').val(), formValues).then( e =>{
          jQuery.notify(
            {title: 'New Expense Added', message: `Your new expense was successfully added.`, icon:'cs-info-hexagon'},
              {
                type: 'success',
                delay: 5000,
            }
          );
          
          // wipe filters
          localStorage.setItem("categories-category", ['a']);
          categoryFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
          expenseFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});


          $('#expenseName').val("");
          $('#expenseAmount').val("");
          mask.updateValue();
          $('#expenseCategory').val("").change();
          $('#expenseDate').val("");
          $('#expenseDate').datepicker("update");
          $('#addExpenseModal').modal('hide');

          this._customLegendBarChart && this._customLegendBarChart.destroy();
          this._initCategoryBreakdownFilters();
          this._initExpenseListFilters();
          this._initCategoriesFilters();
        }).catch(error => {
          jQuery.notify(
            {title: 'An Error Occurred', message: `Your expense could not be created at this time. Please try again later.`, icon:'cs-error-hexagon'},
            {
              type: 'danger',
              delay: 5000,
            }
          );
          
          $('#addExpenseModal').modal('hide');
        });
        
      }
    });
  }

  async _initAddCategoryForm() {
    let form = document.getElementById('add-Category-Form');
    let categoryFilter = $('#categories-category-filter');
    let expenseFilter = $('#expense-list-category-filter');
    if (!form) {
      return;
    }
    let validateOptions = {
      rules: {
        categoryName: {
          required: true,
          maxlength: 20
        },
        categoryDescription: {
          required: true,
          maxlength: 255
        },
        categoryIcon: {
          required: true
        }
      },
      messages: {
        categoryName: {
          categoryName: 'Your category name must be under 20 characters.',
        },
        categoryDescription: {
          categoryDescription: 'Your category description must be under 255 characters.',
        }
      }
    };
    jQuery(form).validate(validateOptions);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopPropagation();
      if (jQuery(form).valid()) {
        let formValues = {
          title: form.querySelector('[name="categoryName"]').value,
          description: form.querySelector('[name="categoryDescription"]').value,
          icon: form.querySelector('[name="categoryIcon"]').value
        };
 
        
        await Helpers.addCategories(formValues).then( e =>{
          jQuery.notify(
            {title: 'New Category Added', message: `Your new category, "${formValues.title}", was successfully added.`, icon:'cs-info-hexagon'},
              {
                type: 'success',
                delay: 5000,
            }
          );
          
          // wipe filters
          localStorage.setItem("categories-category", ['a']);
          categoryFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});
          expenseFilter.html('').select2({data: [{id: 'a', text: 'All Categories'}]});

          $('#categoryName').val("");
          $('#categoryDescription').val("");
          $('#categoryIcon').val("").change();
          $('#addCategoryModal').modal('hide');

          this._customLegendBarChart && this._customLegendBarChart.destroy();
          this._initCategoryBreakdownFilters();
          this._initExpenseListFilters();
          this._initCategoriesFilters();
        }).catch(error =>{
          jQuery.notify(
            {title: 'An Error Occurred', message: `Your category could not be created at this time. Please try again later.`, icon:'cs-error-hexagon'},
            {
              type: 'danger',
              delay: 5000,
            }
          );
          
          $('#addCategoryModal').modal('hide');
        });

      }
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