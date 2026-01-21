<template>
   <div class="chart-container">
      <div class="shepherds-grid">
         <div v-for="shepherd in shepherdsData" :key="shepherd.id" class="shepherd-panel">
            <div class="shepherd-panel-header">
               <q-avatar color="deep-orange-6" text-color="white" size="sm" icon="person" />
               <span class="text-weight-bold q-ml-sm">{{ shepherd.name }}</span>
               <q-chip color="green" text-color="white" size="xs" class="q-ml-auto">
                  {{ shepherd.total }} total
               </q-chip>
            </div>
            <div :ref="el => setChartRef(shepherd.id, el)" class="d3-line-chart"></div>
         </div>
      </div>
      <div v-if="shepherdsData.length === 0" class="no-data text-center text-grey-6 q-pa-lg">
         <q-icon name="show_chart" size="xl" />
         <p class="q-mt-md">No shepherd data available</p>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';
import * as d3 from 'd3';

interface DataPoint {
   label: string;
   value: number;
   year: number;
   quarter: number;
}

interface ShepherdData {
   id: string;
   name: string;
   data: DataPoint[];
   total: number;
}

export default defineComponent({
   name: 'ShepherdPerformanceChart',
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);
      const chartRefs = ref<Record<string, HTMLElement | null>>({});

      const years = [2023, 2024, 2025, 2026];
      const quarters = [1, 2, 3, 4];

      const yearColors: Record<number, string> = {
         2023: '#2563eb',
         2024: '#16a34a',
         2025: '#d97706',
         2026: '#dc2626'
      };

      const allLabels = computed(() => {
         const labels: string[] = [];
         years.forEach(year => {
            quarters.forEach(q => {
               labels.push(`Q${q} ${year}`);
            });
         });
         return labels;
      });

      const setChartRef = (id: string, el: unknown) => {
         if (el instanceof HTMLElement) {
            chartRefs.value[id] = el;
         }
      };

      const shepherdsData = computed<ShepherdData[]>(() => {
         const shepherds = people.value.filter(p => p.role === 'shepherd');

         return shepherds.map(shepherd => {
            const dataMap: Record<string, number> = {};
            allLabels.value.forEach(label => { dataMap[label] = 0; });

            shepherd.meetings.forEach(meeting => {
               if (
                  meeting.shepherdId !== meeting.sheepId &&
                  meeting.completed &&
                  years.includes(meeting.year)
               ) {
                  const label = `Q${meeting.quarter} ${meeting.year}`;
                  dataMap[label]++;
               }
            });

            const data: DataPoint[] = [];
            years.forEach(year => {
               quarters.forEach(q => {
                  const label = `Q${q} ${year}`;
                  data.push({
                     label,
                     value: dataMap[label],
                     year,
                     quarter: q
                  });
               });
            });

            const total = data.reduce((sum, d) => sum + d.value, 0);

            return {
               id: shepherd.id,
               name: shepherd.name,
               data,
               total
            };
         }).sort((a, b) => b.total - a.total);
      });

      const drawChart = (shepherdId: string, data: DataPoint[]) => {
         const container = chartRefs.value[shepherdId];
         if (!container) return;

         d3.select(container).selectAll('*').remove();

         const containerWidth = container.clientWidth;
         const margin = { top: 20, right: 20, bottom: 50, left: 35 };
         const width = containerWidth - margin.left - margin.right;
         const height = 150 - margin.top - margin.bottom;

         const svg = d3.select(container)
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 150)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

         const x = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, width])
            .padding(0.15);

         const fixedMax = 6;

         const y = d3.scaleLinear()
            .domain([0, fixedMax])
            .range([height, 0]);

         svg.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y)
               .ticks(3)
               .tickSize(-width)
               .tickFormat(() => '')
            )
            .selectAll('line')
            .style('stroke', '#e8e8e8');

         svg.select('.grid').select('.domain').remove();

         svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll('text')
            .style('font-size', '9px')
            .style('fill', d => {
               const year = parseInt(String(d).split(' ')[1]);
               return yearColors[year] || '#666';
            })
            .style('font-weight', '600')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.5em');

         svg.select('.x-axis').select('.domain').style('stroke', '#ccc');

         svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format('d')))
            .selectAll('text')
            .style('font-size', '10px');

         svg.select('.y-axis').select('.domain').style('stroke', '#ccc');

         svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.label) || 0)
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', d => yearColors[d.year])
            .attr('rx', 2)
            .transition()
            .duration(500)
            .delay((_, i) => i * 30)
            .attr('y', d => y(d.value))
            .attr('height', d => height - y(d.value));

         svg.selectAll('.value-label')
            .data(data.filter(d => d.value > 0))
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => (x(d.label) || 0) + x.bandwidth() / 2)
            .attr('y', d => y(d.value) - 4)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('font-weight', '700')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d.value)
            .transition()
            .duration(300)
            .delay((_, i) => 400 + i * 30)
            .style('opacity', 1);
      };

      const drawAllCharts = () => {
         nextTick(() => {
            shepherdsData.value.forEach(shepherd => {
               drawChart(shepherd.id, shepherd.data);
            });
         });
      };

      let resizeObserver: ResizeObserver | null = null;

      onMounted(() => {
         nextTick(() => {
            drawAllCharts();
            const firstRef = Object.values(chartRefs.value)[0];
            if (firstRef?.parentElement) {
               resizeObserver = new ResizeObserver(() => {
                  drawAllCharts();
               });
               resizeObserver.observe(firstRef.parentElement);
            }
         });
      });

      onUnmounted(() => {
         if (resizeObserver) {
            resizeObserver.disconnect();
         }
      });

      watch(shepherdsData, () => {
         drawAllCharts();
      }, { deep: true });

      return {
         shepherdsData,
         setChartRef
      };
   }
});
</script>

<style scoped>
.chart-container {
   width: 100%;
}

.shepherds-grid {
   display: flex;
   flex-direction: column;
   gap: 1rem;
}

.shepherd-panel {
   background: #fafafa;
   border-radius: 8px;
   padding: 0.75rem;
   border: 1px solid #e0e0e0;
}

.shepherd-panel-header {
   display: flex;
   align-items: center;
   margin-bottom: 0.5rem;
   padding-bottom: 0.5rem;
   border-bottom: 1px solid #eee;
}

.d3-line-chart {
   width: 100%;
   height: 150px;
}

.no-data {
   min-height: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
}
</style>
