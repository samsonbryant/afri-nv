export type GuidePlacement = "top" | "right" | "bottom" | "left";

export type GuideStep = {
  title: string;
  body: string;
  target?: string;
  placement?: GuidePlacement;
  optional?: boolean;
};

export type ModuleGuide = {
  id: string;
  version: number;
  title: string;
  match: (pathname: string) => boolean;
  steps: GuideStep[];
};
