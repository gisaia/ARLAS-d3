import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorGenerator } from '../utils/color-generator';
import { DonutParams } from './DonutParams';
import { MultiSelectionDonut } from './MultiSelectionDonut';
import { OneSelectionDonut } from './OneSelectionDonut';
import { TreeNode } from './utils/DonutUtils';

const FULL_ARC_DONUT_DATA: TreeNode = {
    id: 'root',
    isOther: false,
    fieldValue: 'root',
    fieldName: 'root',
    size: 100,
    children: [
        { id: 'c1', isOther: false, fieldValue: 'A', fieldName: 'cat', size: 30 },
        { id: 'c2', isOther: false, fieldValue: 'B', fieldName: 'cat', size: 50 },
        { id: 'c3', isOther: false, fieldValue: 'C', fieldName: 'cat', size: 20 },
    ]
};

const INCOMPLETE_ARC_DONUT_DATA: TreeNode = {
    id: 'root',
    isOther: false,
    fieldValue: 'root',
    fieldName: 'root',
    size: 100,
    children: [
        { id: 'c1', isOther: false, fieldValue: 'A', fieldName: 'cat', size: 30 },
    ]
};

function testDonut(DonutClass: typeof MultiSelectionDonut | typeof OneSelectionDonut) {
    describe(DonutClass.name, () => {
        let colorGenerator: ColorGenerator;

        function createDonut(donutData: TreeNode, keysToColors?: Array<[string, string]>) {
            const container = document.createElement('div');
            const svg = document.createElement('svg');
            container.appendChild(svg);

            const params = new DonutParams('test', donutData, svg as any as SVGElement, container, colorGenerator);
            params.keysToColors = keysToColors ?? [];
            const donut = new DonutClass(params);
            donut.plot();

            return donut;
        }

        beforeEach(() => {
            colorGenerator = {
                getColor: vi.fn((key: string, keysToColors?: Array<[string, string]>) => {
                    const match = keysToColors?.find(([k]) => k === key);
                    return match ? match[1] : '#abcdef';
                })
            };
        });

        it('should plot the correct number of arcs', () => {
            const donut = createDonut(FULL_ARC_DONUT_DATA);

            const arcs = donut.donutParams.donutContainer.querySelectorAll('.donut__arc');
            expect(arcs.length).toBe(4);
        });

        it('should color arcs according to keysToColors or color generator', () => {
            const donut = createDonut(FULL_ARC_DONUT_DATA, [['A', '#00ff00'], ['C', '#ff0000']]);

            const arcs = donut.donutParams.donutContainer.querySelectorAll<SVGPathElement>('.donut__arc');
            expect(arcs[1].style.fill).toBe('rgb(171, 205, 239)');
            expect(arcs[2].style.fill).toBe('rgb(0, 255, 0)');
            expect(arcs[3].style.fill).toBe('rgb(255, 0, 0)');
            expect(colorGenerator.getColor).toHaveBeenCalled();
        });

        it('should reflect data proportion in arc length', () => {
            const donut = createDonut(FULL_ARC_DONUT_DATA);
            const nodes = donut.donutParams.donutNodes;

            const children = nodes.filter(n => n.depth === 1);
            const totalAngle = children.reduce((sum, n) => sum + (n.x1 - n.x0), 0);
            expect(totalAngle).toBeCloseTo(1, 5);

            const totalSize = children.reduce((sum, n) => sum + (n.value ?? 0), 0);
            children.forEach(child => {
                const proportion = (child.value ?? 0) / totalSize;
                const angle = child.x1 - child.x0;
                expect(angle).toBeCloseTo(proportion, 5);
            });
        });

        it('should plot missing data in root with dashes', () => {
            const donut = createDonut(INCOMPLETE_ARC_DONUT_DATA);
            const arcs = donut.donutParams.donutContainer.querySelectorAll<SVGPathElement>('.donut__arc');

            const noValueArc = Array.from(arcs).find(a => a.style.strokeDasharray !== '');
            expect(noValueArc).toBeDefined();
        });

        it('should emit selectedNodesEvent when clicking an arc', () => {
            const donut = createDonut(FULL_ARC_DONUT_DATA);
            const spy = vi.spyOn(donut.donutParams.selectedNodesEvent, 'next');

            let arcs = donut.donutParams.donutContainer.querySelectorAll<HTMLElement>('.donut__arc');
            arcs[1].click();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith([
                [{ fieldName: 'cat', fieldValue: 'B' }]
            ]);

            arcs = donut.donutParams.donutContainer.querySelectorAll('.donut__arc');
            if (typeof donut === typeof OneSelectionDonut) {
                // When an arc is clicked, the donut focuses on this arc and removes the others
                expect(arcs.length).toBe(1);
            } else {
                expect(arcs.length).toBe(4);
            }
        });

        it('should emit tooltipEvent and update tooltip when hovering an arc', () => {
            const donut = createDonut(FULL_ARC_DONUT_DATA);
            const spy = vi.spyOn(donut.donutParams.tooltipEvent, 'next');

            const arcs = donut.donutParams.donutContainer.querySelectorAll<HTMLElement>('.donut__arc');
            const hoveredArcIndex = 1;
            // Needs both for the tooltip to be displayed
            arcs[hoveredArcIndex].dispatchEvent(new MouseEvent('mouseover'));
            arcs[hoveredArcIndex].dispatchEvent(new MouseEvent('mousemove'));

            expect(spy).toHaveBeenCalledTimes(1);
            const emitted = spy.mock.calls[0][0];
            const hoveredNode = FULL_ARC_DONUT_DATA.children?.[hoveredArcIndex];
            expect(hoveredNode).toBeDefined();

            expect(emitted).toBeDefined();
            expect(emitted?.isShown).toBe(true);
            expect(emitted?.content).toBeDefined();
            expect(emitted?.content?.[0].field).toBe(hoveredNode?.fieldName);
            expect(emitted?.content?.[0].value).toBe(hoveredNode?.fieldValue);
            expect(emitted?.content?.[0].metric).toBe(hoveredNode?.size);
        });
    });
}

testDonut(MultiSelectionDonut);
testDonut(OneSelectionDonut);

