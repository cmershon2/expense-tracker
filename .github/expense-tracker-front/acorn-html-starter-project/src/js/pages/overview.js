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
    this._initCustomLegendBarChart();

    this._initEvents();
  }

  _initEvents() {
    // Listening for color change events to update charts
    document.documentElement.addEventListener(Globals.colorAttributeChange, (event) => {
      this._customLegendBarChart && this._customLegendBarChart.destroy();
      this._initCustomLegendBarChart();
    });
  }

  // Sales chart with the custom legend
  _initCustomLegendBarChart() {
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
              backgroundColor: 'rgba(' + Globals.primaryrgb + ',0.1)',
              borderColor: Globals.primary,
              borderWidth: 2,
              data: [5, 2, 2, 1, 3, 6, 3],
            },
            {
              label: 'Shopping',
              backgroundColor: 'rgba(' + Globals.secondaryrgb + ',0.1)',
              borderColor: Globals.secondary,
              borderWidth: 2,
              data: [5, 2, 7, 5, 9, 3, 4],
            },
            {
              label: 'Groceries',
              backgroundColor: 'rgba(' + Globals.primaryrgb + ',0.1)',
              borderColor: Globals.primary,
              borderWidth: 2,
              data: [0, 0, 0, 0, 3, 6, 5],
            },
            {
              label: 'Bills & Utilities',
              backgroundColor: 'rgba(' + Globals.secondaryrgb + ',0.1)',
              borderColor: Globals.secondary,
              borderWidth: 2,
              data: [0, 0, 0, 0, 0, 0, 3],
            },
            {
              label: 'Business Expenses',
              backgroundColor: 'rgba(' + Globals.secondaryrgb + ',0.1)',
              borderColor: Globals.secondary,
              borderWidth: 2,
              data: [0, 7, 2, 0, 5, 0, 0],
            },
            {
              label: 'Bills & Utilities',
              backgroundColor: 'rgba(' + Globals.secondaryrgb + ',0.1)',
              borderColor: Globals.secondary,
              borderWidth: 2,
              data: [0, 0, 0, 0, 0, 0, 3],
            },
            {
              label: 'Business Expenses',
              backgroundColor: 'rgba(' + Globals.secondaryrgb + ',0.1)',
              borderColor: Globals.secondary,
              borderWidth: 2,
              data: [0, 7, 2, 0, 5, 0, 0],
            }
          ],
          icons: ['cutlery', 'handbag', 'cart', 'tool', 'shop', 'cutlery', 'handbag'],
        },
      });
      this._customLegendBarChart.generateLegend();
    }
  }
}
