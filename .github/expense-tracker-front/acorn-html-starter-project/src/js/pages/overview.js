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
  }

  async _dataSet(){
    const categories = await Helpers.getCategories();
    let transactions = [];
    categories.forEach(cat =>{
      let transactionObj = {transactions:[]};
      let currCategory;
      let numOfTransactions = 0;
      Helpers.getTransaction(cat.categoryId).then(function (res) {
        res.forEach(tran =>{
          numOfTransactions++;
          currCategory = tran.categoryId;
          transactionObj['transactions'].push(tran);
        })
        transactionObj['numOfTransactions']=numOfTransactions;
        transactionObj['categoryId']=currCategory;
      });
      transactions.push(transactionObj);
    });

    return {categories, transactions};
  }

  async _charts(){
    let data = await this._dataSet();

    let numberOfCategories = 0;
    data.categories.forEach(cat =>{
      numberOfCategories++;
    });
    let colorRange = Helpers.generateColor('#2decc2','#2499e3',numberOfCategories);

    this._initCustomLegendBarChart(data,colorRange);
    this._initCategoryTiles(data);
    this._initSmallDoughnutCharts();
  }
  
  //Refreshes icons
  _initIcons() {
    if (typeof csicons !== 'undefined') {
      csicons.replace();
    }
  }

  // Sales chart with the custom legend
  _initCustomLegendBarChart(data, colorRange) {
    //console.log(data);
    console.log('Categories: ', data.categories);
    console.log('Transactions', data.transactions);
    let dataSet={
      labels:[],
      datasets:[],
      icons:[]
    };

    data.categories.forEach(function(cat,i){
      // add category icon
      dataSet.icons.push(cat.icon);

      // created  current data set.
      let currSet={
        label: cat.title,
        backgroundColor: 'rgba(' + colorRange[i] + ',0.1)',
        borderColor: 'rgba(' + colorRange[i] + ',1)',
        borderWidth: 2,
        data: []
      };

      data.transactions.forEach(trans =>{
        if(trans.categoryId == cat.categoryId)
        {
          currSet.data.push(trans.numberOfTransactions);
        }
      })
    })

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
                    stepSize: 5,
                    min: 0,
                    max: 25,
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
                itemClone.querySelector('.value').innerHTML = total;
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
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Food & Drink',
                backgroundColor: 'rgba(' + colorRange[0] + ',0.1)',
                borderColor: 'rgba(' + colorRange[0] + ',1)',
                borderWidth: 2,
                data: [5, 2, 2, 1, 3, 6, 3],
              },
              {
                label: 'Shopping',
                backgroundColor: 'rgba(' + colorRange[1] + ',0.1)',
                borderColor: 'rgba(' + colorRange[1] + ',1)',
                borderWidth: 2,
                data: [5, 2, 7, 5, 9, 3, 4],
              },
              {
                label: 'Groceries',
                backgroundColor: 'rgba(' + colorRange[2] + ',0.1)',
                borderColor: 'rgba(' + colorRange[2] + ',1)',
                borderWidth: 2,
                data: [0, 0, 0, 0, 3, 6, 5],
              },
              {
                label: 'Bills & Utilities',
                backgroundColor: 'rgba(' + colorRange[3] + ',0.1)',
                borderColor: 'rgba(' + colorRange[3] + ',1)',
                borderWidth: 2,
                data: [0, 0, 0, 0, 0, 0, 3],
              },
              {
                label: 'Business Expenses',
                backgroundColor: 'rgba(' + colorRange[4] + ',0.1)',
                borderColor: 'rgba(' + colorRange[4] + ',1)',
                borderWidth: 2,
                data: [0, 7, 2, 0, 5, 0, 0],
              }
            ],
            icons: ['cutlery', 'handbag', 'cart', 'tool', 'shop'],
          },
        });
        this._customLegendBarChart.generateLegend();
      }
  }

  _initCategoryTiles(data){
    const tiles = $('#category-tiles');
    tiles.html(' ');
    //console.log('Categories: ', data.categories);
    data.categories.forEach(cat => {
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
  _initSmallDoughnutCharts() {
    if (document.getElementById('smallDoughnutChart1')) {
      this._smallDoughnutChart1 = ChartsExtend.SmallDoughnutChart('smallDoughnutChart1', [7.30, 134], 'Expense Name Here');
    }
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
