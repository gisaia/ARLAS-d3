import { HistogramData } from '../../../utils/HistogramUtils';
import { ModelResult } from './model_result';

export abstract class Model {
    public name: string;
    public data: Array<HistogramData>;

    public abstract apply(): ModelResult;
    public abstract store(modelResult: ModelResult): void;
}
