<template>
   <div class="visit-network">
      <div class="text-h6 q-mb-sm">🕸️ Visit Network</div>
      <div class="text-caption text-grey-7 q-mb-sm">
         Each line is a past visit between two people; thicker lines mean more
         visits. Orange nodes are shepherds.
      </div>
      <div ref="container" class="network-canvas"></div>
      <div v-if="nodes.length === 0" class="no-data text-center text-grey-6 q-pa-lg">
         <q-icon name="hub" size="xl" />
         <p class="q-mt-md">No visit data available</p>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';
import { PairingGraph } from '@/scheduling/pairingGraph';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
   id: string;
   name: string;
   shepherd: boolean;
   degree: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
   source: string | GraphNode;
   target: string | GraphNode;
   count: number;
}

export default defineComponent({
   name: 'VisitNetworkChart',
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);
      const container = ref<HTMLElement | null>(null);

      const activeById = computed(() => {
         const map = new Map<string, { name: string; shepherd: boolean }>();
         people.value
            .filter((p) => !p.departed)
            .forEach((p) =>
               map.set(p.id, { name: p.name, shepherd: p.role === 'shepherd' })
            );
         return map;
      });

      const links = computed<GraphLink[]>(() => {
         const graph = new PairingGraph(people.value);
         const result: GraphLink[] = [];
         for (const { a, b, stats } of graph.entries()) {
            // Only edges between two currently-active people.
            if (activeById.value.has(a) && activeById.value.has(b)) {
               result.push({ source: a, target: b, count: stats.count });
            }
         }
         return result;
      });

      const nodes = computed<GraphNode[]>(() => {
         const degree = new Map<string, number>();
         for (const link of links.value) {
            degree.set(link.source as string, (degree.get(link.source as string) ?? 0) + 1);
            degree.set(link.target as string, (degree.get(link.target as string) ?? 0) + 1);
         }
         const result: GraphNode[] = [];
         for (const [id, info] of activeById.value) {
            result.push({
               id,
               name: info.name,
               shepherd: info.shepherd,
               degree: degree.get(id) ?? 0,
            });
         }
         return result;
      });

      let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

      const draw = () => {
         const el = container.value;
         if (!el || nodes.value.length === 0) return;

         d3.select(el).selectAll('*').remove();

         const width = el.clientWidth || 800;
         const height = 520;

         const svg = d3
            .select(el)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

         // Copy data so the simulation can mutate x/y without touching computed refs.
         const nodeData: GraphNode[] = nodes.value.map((n) => ({ ...n }));
         const linkData: GraphLink[] = links.value.map((l) => ({ ...l }));

         const maxCount = d3.max(linkData, (d) => d.count) ?? 1;
         const strokeScale = d3.scaleLinear().domain([1, maxCount]).range([1, 6]);
         const radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(nodeData, (d) => d.degree) ?? 1])
            .range([4, 16]);

         simulation = d3
            .forceSimulation<GraphNode>(nodeData)
            .force(
               'link',
               d3
                  .forceLink<GraphNode, GraphLink>(linkData)
                  .id((d) => d.id)
                  .distance(60)
            )
            .force('charge', d3.forceManyBody().strength(-80))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide<GraphNode>().radius((d) => radiusScale(d.degree) + 2));

         const link = svg
            .append('g')
            .attr('stroke', '#cbd5e1')
            .selectAll('line')
            .data(linkData)
            .enter()
            .append('line')
            .attr('stroke-width', (d) => strokeScale(d.count));

         const node = svg
            .append('g')
            .selectAll('circle')
            .data(nodeData)
            .enter()
            .append('circle')
            .attr('r', (d) => radiusScale(d.degree))
            .attr('fill', (d) => (d.shepherd ? '#ea580c' : '#2563eb'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .call(drag(simulation));

         node.append('title').text((d) => `${d.name} (${d.degree} connections)`);

         simulation.on('tick', () => {
            link
               .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
               .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
               .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
               .attr('y2', (d) => (d.target as GraphNode).y ?? 0);
            node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
         });
      };

      const drag = (sim: d3.Simulation<GraphNode, GraphLink>) =>
         d3
            .drag<SVGCircleElement, GraphNode>()
            .on('start', (event, d) => {
               if (!event.active) sim.alphaTarget(0.3).restart();
               d.fx = d.x;
               d.fy = d.y;
            })
            .on('drag', (event, d) => {
               d.fx = event.x;
               d.fy = event.y;
            })
            .on('end', (event, d) => {
               if (!event.active) sim.alphaTarget(0);
               d.fx = null;
               d.fy = null;
            });

      const redraw = () => {
         nextTick(() => draw());
      };

      onMounted(() => {
         nextTick(() => draw());
      });
      onUnmounted(() => simulation?.stop());
      watch([nodes, links], redraw, { deep: true });

      return { container, nodes };
   },
});
</script>

<style scoped>
.visit-network {
   width: 100%;
}

.network-canvas {
   width: 100%;
   min-height: 520px;
   border: 1px solid #e0e0e0;
   border-radius: 8px;
   background: #fafafa;
}

.no-data {
   min-height: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
}
</style>
