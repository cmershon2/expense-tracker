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
    this._smallDoughnutChart1 = null;

    // Initialization of the page plugins
    this._charts();
    this._initTour();
    this._initEvents();
  }

  _initEvents() {
    // Listening for color change events to update charts
    document.documentElement.addEventListener(Globals.colorAttributeChange, (event) => {
      this._customLegendBarChart && this._customLegendBarChart.destroy();
      this._charts();
    });

    let startDate;
    let endDate;
    
  }

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

  async _charts(){
      let data = await this._dataSet();
      let numberOfCategories = 0;

      data.forEach(cat =>{
        numberOfCategories++;
      });
      let colorRange = Helpers.generateColor('#1ed699','#2499e3',numberOfCategories);
         
      this._initCustomLegendBarChart(data,colorRange);
      this._initCategoryTiles(data);
      this._initSmallDoughnutCharts(data, colorRange);
  }
  
  //Refreshes icons
  _initIcons() {
    if (typeof csicons !== 'undefined') {
      csicons.replace();
    }
  }

  // Sales chart with the custom legend
  _initCustomLegendBarChart(data, colorRange, startDate, endDate) {
    //console.log('Categories: ', data);

    if(startDate == null || endDate == null){
      startDate = moment().startOf('week');
      endDate = moment().endOf('week');
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
    dateRange.forEach( function(date,i) {
      let formattedDate = moment(date).format('MMM D, YYYY');
      dataSet.labels.push(formattedDate);
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
        let currDate = moment(tran.transactionDate);
        let formattedDate = currDate.format('MMM D, YYYY');
        
        if(currDate.isBetween(startDate, endDate)){
          let index = currDate.diff(startDate, 'days');
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
                  tooltipEl.querySelector('.value').innerHTML = chart._data.datasets[datasetIndex].data[index];
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

  _initCategoryTiles(data){
    const tiles = $('#category-tiles');
    tiles.html(' ');
    //console.log('Categories: ', data.categories);
    data.forEach(cat => {
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

  // Progress doughnut charts
  _initSmallDoughnutCharts(data, colorRange) {
    console.log('Categories: ', data);
    const expenseStats = $('#expense-stats');
    expenseStats.html(' ');

    // generate data set for chart
    data.forEach(function(cat,i){
      cat.transactions.forEach(tran =>{
        console.log(tran)
        let currDate = moment(tran.transactionDate);
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
      });
    });

    let addNew=`
    <div class="card mb-2 sh-10 sh-md-8">
      <div class="hover-scale-up cursor-pointer pt-0 pb-0 h-100">
        <div class="h-100 row g-0 card-body align-items-center py-1">
          <div class="col pe-3">
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
