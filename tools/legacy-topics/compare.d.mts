export interface TopicTitle {
  title: string;
  group?: string | undefined;
}
export declare function normalizeTitle(s: string): string;
export declare function compareTopicLists(legacy: TopicTitle[], migrated: TopicTitle[]): string[];
