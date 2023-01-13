export interface TimelineData {
    date: Date;
    metadata: {
        thumbnail: string;
    };
}
export interface TimelineTooltip {
    data: TimelineData;
    shown: boolean;
    position: number;
    width: number;
}
