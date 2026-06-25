<template>
   <div class="visit-network">
      <div class="text-h6 q-mb-sm">🕸️ Shepherd Coverage</div>
      <div class="text-caption text-grey-7 q-mb-sm">
         Each large hub is a shepherd, sized and labeled by how many people
         they've visited. The dots around a hub are those people, colored by the
         shepherd who has visited them most. People pulled between two hubs have
         been visited by both.
      </div>
      <div ref="container" class="network-canvas"></div>
      <div v-if="shepherdCount === 0" class="no-data text-center text-grey-6 q-pa-lg">
         <q-icon name="hub" size="xl" />
         <p class="q-mt-md">No visit data available</p>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
   id: string;
   name: string;
   shepherd: boolean;
   color: string;
   coverage: number; // for shepherds: number of distinct people visited
   radius: number;
   anchorX?: number;
   anchorY?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
   source: string | GraphNode;
   target: string | GraphNode;
   count: number;
   color: string;
}

interface CoverageModel {
   nodes: GraphNode[];
   links: GraphLink[];
}

export default defineComponent({
   name: 'VisitNetworkChart',
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);
      const container = ref<HTMLElement | null>(null);

      // Build the shepherd-centric coverage model: which people each shepherd
      // has visited (as the shepherd), how often, and how recently.
      const model = computed<CoverageModel>(() => {
         const active = people.value.filter((p) => !p.departed);
         const activeIds = new Set(active.map((p) => p.id));
         const shepherds = active.filter((p) => p.role === 'shepherd');
         const shepherdIds = shepherds.map((s) => s.id);
         const shepherdIdSet = new Set(shepherdIds);

         const colorFor = d3
            .scaleOrdinal<string, string>()
            .domain(shepherdIds)
            .range(
               shepherdIds.length > 0
                  ? d3.quantize((t) => d3.interpolateRainbow(t), shepherdIds.length)
                  : ['#2563eb']
            );

         // shepherdId -> (personId -> times visited)
         const coverage = new Map<string, Map<string, number>>();
         // personId -> shepherd who has visited them the most (for coloring)
         const primary = new Map<string, { shepherdId: string; count: number }>();
         const seen = new Set<string>();

         for (const person of people.value) {
            for (const m of person.meetings ?? []) {
               if (seen.has(m.id)) continue;
               seen.add(m.id);
               if (m.shepherdId === m.sheepId) continue;
               if (!shepherdIdSet.has(m.shepherdId)) continue;
               if (!activeIds.has(m.sheepId)) continue;

               let visited = coverage.get(m.shepherdId);
               if (!visited) {
                  visited = new Map();
                  coverage.set(m.shepherdId, visited);
               }
               const count = (visited.get(m.sheepId) ?? 0) + 1;
               visited.set(m.sheepId, count);

               const cur = primary.get(m.sheepId);
               if (!cur || count > cur.count) {
                  primary.set(m.sheepId, { shepherdId: m.shepherdId, count });
               }
            }
         }

         const radiusForCoverage = (n: number) => 6 + Math.sqrt(n) * 2.5;

         const nodes: GraphNode[] = active.map((p) => {
            const isShepherd = p.role === 'shepherd';
            const coverageCount = coverage.get(p.id)?.size ?? 0;
            const primaryShepherd = primary.get(p.id)?.shepherdId;
            return {
               id: p.id,
               name: p.name,
               shepherd: isShepherd,
               coverage: coverageCount,
               radius: isShepherd ? radiusForCoverage(coverageCount) : 4,
               color: isShepherd
                  ? colorFor(p.id)
                  : primaryShepherd
                    ? colorFor(primaryShepherd)
                    : '#cbd5e1',
            };
         });

         const links: GraphLink[] = [];
         for (const [shepherdId, visited] of coverage) {
            for (const [personId, count] of visited) {
               links.push({
                  source: shepherdId,
                  target: personId,
                  count,
                  color: colorFor(shepherdId),
               });
            }
         }

         return { nodes, links };
      });

      const shepherdCount = computed(
         () => model.value.nodes.filter((n) => n.shepherd).length
      );

      let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

      const draw = () => {
         const el = container.value;
         if (!el || shepherdCount.value === 0) return;

         d3.select(el).selectAll('*').remove();

         const width = el.clientWidth || 800;
         const height = 600;

         const svg = d3
            .select(el)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

         // Copy data so the simulation can mutate positions freely.
         const nodeData: GraphNode[] = model.value.nodes.map((n) => ({ ...n }));
         const linkData: GraphLink[] = model.value.links.map((l) => ({ ...l }));

         // Lay shepherd hubs out on a grid; the biggest go first for balance.
         const hubs = nodeData.filter((n) => n.shepherd).sort((a, b) => b.coverage - a.coverage);
         const cols = Math.ceil(Math.sqrt(hubs.length));
         const rows = Math.ceil(hubs.length / cols);
         const cellW = width / cols;
         const cellH = height / rows;
         hubs.forEach((hub, i) => {
            hub.anchorX = ((i % cols) + 0.5) * cellW;
            hub.anchorY = (Math.floor(i / cols) + 0.5) * cellH;
         });

         const maxCount = d3.max(linkData, (d) => d.count) ?? 1;
         const strokeScale = d3.scaleLinear().domain([1, maxCount]).range([0.5, 3]);

         simulation = d3
            .forceSimulation<GraphNode>(nodeData)
            .force(
               'link',
               d3
                  .forceLink<GraphNode, GraphLink>(linkData)
                  .id((d) => d.id)
                  .distance(45)
                  .strength(0.35)
            )
            .force('charge', d3.forceManyBody<GraphNode>().strength((d) => (d.shepherd ? -120 : -25)))
            .force(
               'x',
               d3
                  .forceX<GraphNode>((d) => (d.shepherd ? d.anchorX ?? width / 2 : width / 2))
                  .strength((d) => (d.shepherd ? 0.6 : 0.01))
            )
            .force(
               'y',
               d3
                  .forceY<GraphNode>((d) => (d.shepherd ? d.anchorY ?? height / 2 : height / 2))
                  .strength((d) => (d.shepherd ? 0.6 : 0.01))
            )
            .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.radius + 2));

         const link = svg
            .append('g')
            .selectAll('line')
            .data(linkData)
            .enter()
            .append('line')
            .attr('stroke', (d) => d.color)
            .attr('stroke-opacity', 0.25)
            .attr('stroke-width', (d) => strokeScale(d.count));

         const node = svg
            .append('g')
            .selectAll('circle')
            .data(nodeData)
            .enter()
            .append('circle')
            .attr('r', (d) => d.radius)
            .attr('fill', (d) => d.color)
            .attr('fill-opacity', (d) => (d.shepherd ? 1 : 0.85))
            .attr('stroke', '#fff')
            .attr('stroke-width', (d) => (d.shepherd ? 2 : 1))
            .call(drag(simulation));

         node
            .append('title')
            .text((d) =>
               d.shepherd ? `${d.name} — has visited ${d.coverage} people` : d.name
            );

         // Labels for the shepherd hubs only.
         const label = svg
            .append('g')
            .selectAll('text')
            .data(nodeData.filter((d) => d.shepherd))
            .enter()
            .append('text')
            .text((d) => `${d.name} (${d.coverage})`)
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('text-anchor', 'middle')
            .attr('fill', '#1e293b')
            .attr('paint-order', 'stroke')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .style('pointer-events', 'none');

         simulation.on('tick', () => {
            link
               .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
               .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
               .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
               .attr('y2', (d) => (d.target as GraphNode).y ?? 0);
            node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
            label
               .attr('x', (d) => d.x ?? 0)
               .attr('y', (d) => (d.y ?? 0) + d.radius + 12);
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
      watch(model, redraw, { deep: true });

      return { container, shepherdCount };
   },
});
</script>

<style scoped>
.visit-network {
   width: 100%;
}

.network-canvas {
   width: 100%;
   min-height: 600px;
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
