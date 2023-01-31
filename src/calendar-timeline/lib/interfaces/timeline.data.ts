export interface TimelineData {
    date: Date;
    id?: string;
    metadata?: {
        thumbnail?: string;
        name?: string;
    };
}
export interface TimelineTooltip {
    data: TimelineData;
    stringDate: string;
    shown: boolean;
    position: number;
    width: number;
}
