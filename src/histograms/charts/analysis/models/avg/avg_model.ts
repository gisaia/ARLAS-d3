import { Model } from '../model';
import { AvgResult } from './avg_model_result';
import { HistogramData } from 'histograms/utils/HistogramUtils';

export class AvgModel extends Model {

    public apply(): AvgResult {
        if (this.data && this.data.length > 0) {
            const mean = this.data.map((d: HistogramData) => d.value).reduce((a, b) => a + b) / this.data.length;
            const avgResult: AvgResult = {
                result: mean
            };
            return avgResult;
        }
        return null;
    }

    public store(avgResult: AvgResult): void {

    }
}
