export interface Project {
  id: string;
  name: string;
  role: string;
  currentDay: number;
  totalDays: number;
  shootingDate: string | null;
  hasNotices: boolean;
}

export interface SelectContextScreenProps {
  onBack: () => void;
  onSelectProject: (project: Project) => void;
}
