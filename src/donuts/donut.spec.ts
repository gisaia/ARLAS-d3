import { describe, expect, it, vi } from 'vitest';
import { DonutParams } from './DonutParams';
import { MultiSelectionDonut } from './MultiSelectionDonut';
import { TreeNode } from './utils/DonutUtils';



describe('MultiSelect Donut', () => {
    it('Should create', () => {
        const donutData: TreeNode = {
            id: 'root',
            isOther: false,
            fieldValue: 'root',
            fieldName: 'root',
            size: 1640,
            children : []
        };
        const donutContainer = document.createElement('div');
        const donutSvg = document.createElement('svg');
        donutContainer.appendChild(donutSvg);

        const donutParams = new DonutParams('test', donutData, donutSvg as any as SVGElement, donutContainer);
        const donut = new MultiSelectionDonut(donutParams);
        donut.plot();

        const spy = vi.spyOn(donut as any, 'onClick');
        (donutContainer.getElementsByClassName('donut__arc')[0] as any as HTMLElement).click();
        expect(spy).toHaveBeenCalledOnce();
    });
});
