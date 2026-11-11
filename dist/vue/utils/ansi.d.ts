export interface AnsiSegment {
    text: string;
    className?: string;
}
export declare function ansiToSegments(line: string): AnsiSegment[];
