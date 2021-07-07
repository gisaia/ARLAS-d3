export interface ColorGenerator {
    getColor(key: string, keysToColors?: Array<[string, string]>, colorsSaturationWeight?): string;
}
