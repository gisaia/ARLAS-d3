export interface ColorGenerator {
    getColor(key: string, value?: string): string;
}
