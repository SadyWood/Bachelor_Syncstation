export interface NoticeItem {
  id: string;
  time: string;
  message: string;
}

export interface ContextCardProps {
  projectName: string;
  role: string;
  dayInfo: string;
  notices: NoticeItem[];
  onChangePress: () => void;
}
